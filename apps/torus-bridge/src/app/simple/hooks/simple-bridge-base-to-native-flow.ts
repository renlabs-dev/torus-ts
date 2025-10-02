import {
  waitForTransactionReceipt,
  withdrawFromTorusEvm,
} from "@torus-network/sdk/evm";
import type { SS58Address } from "@torus-network/sdk/types";
import { toNano } from "@torus-network/torus-utils/torus/token";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import type { Chain, WalletClient } from "viem";
import type { Config } from "wagmi";
import type { SimpleBridgeTransaction } from "../_components/simple-bridge-types";
import { SimpleBridgeStep } from "../_components/simple-bridge-types";
import {
  BASE_CHAIN_ID,
  CONFIRMATION_CONFIG,
  formatErrorForUser,
  isUserRejectionError,
  POLLING_CONFIG,
  TIMEOUT_CONFIG,
  UserRejectedError,
  withTimeout,
} from "./simple-bridge-helpers";

interface BaseToNativeStep1Params {
  amount: string;
  evmAddress: string;
  chain: Chain;
  switchChain: (params: { chainId: number }) => Promise<{ id: number }>;
  triggerHyperlaneTransfer: (params: {
    origin: string;
    destination: string;
    tokenIndex: number;
    amount: string;
    recipient: string;
  }) => Promise<unknown>;
  warpCore: {
    tokens: {
      chainName: string;
      symbol: string;
      getConnectionForChain: (chain: string) => unknown;
    }[];
  };
  refetchTorusEvmBalance: () => Promise<unknown>;
  torusEvmBalance?: { value: bigint };
  updateBridgeState: (updates: {
    step: SimpleBridgeStep;
    errorMessage?: string;
  }) => void;
  addTransaction: (tx: SimpleBridgeTransaction) => void;
  getExplorerUrl: (txHash: string, chainName: string) => string;
}

export async function executeBaseToNativeStep1(
  params: BaseToNativeStep1Params,
) {
  const {
    amount,
    evmAddress,
    chain,
    switchChain,
    triggerHyperlaneTransfer,
    warpCore,
    refetchTorusEvmBalance,
    torusEvmBalance,
    updateBridgeState,
    addTransaction,
    getExplorerUrl,
  } = params;

  updateBridgeState({ step: SimpleBridgeStep.STEP_1_PREPARING });
  addTransaction({
    step: 1,
    status: "STARTING",
    chainName: "Base",
    message: "Preparing Base → Torus EVM transfer",
  });

  const baseToken = warpCore.tokens.find(
    (token) => token.chainName === "base" && token.symbol === "TORUS",
  );

  if (!baseToken) {
    throw new Error("Base TORUS token not found in warp configuration");
  }

  const connection = baseToken.getConnectionForChain("torus");
  if (!connection) {
    throw new Error("No connection found from Base to Torus EVM");
  }

  let currentChainId = chain.id;
  let baseSwitchAttempts = 0;

  console.log(
    "Step 1 - Current chain:",
    currentChainId,
    "Target: Base (",
    BASE_CHAIN_ID,
    ")",
  );

  while (
    baseSwitchAttempts < POLLING_CONFIG.MAX_SWITCH_ATTEMPTS &&
    currentChainId !== BASE_CHAIN_ID
  ) {
    try {
      console.log(
        `Attempting to switch to Base chain (attempt ${baseSwitchAttempts + 1})`,
      );
      const result = await switchChain({ chainId: BASE_CHAIN_ID });
      currentChainId = result.id;

      if (currentChainId === BASE_CHAIN_ID) {
        console.log("Successfully switched to Base chain");
        break;
      }
      throw new Error("Base switch verification failed");
    } catch (switchErr) {
      baseSwitchAttempts++;
      if (baseSwitchAttempts >= POLLING_CONFIG.MAX_SWITCH_ATTEMPTS) {
        const error = switchErr as Error;
        const errorMessage = "Failed to switch to Base chain";
        const errorDetails = formatErrorForUser(error);

        addTransaction({
          step: 1,
          status: "ERROR",
          chainName: "Base",
          message: errorMessage,
          errorDetails,
        });
        updateBridgeState({
          step: SimpleBridgeStep.ERROR,
          errorMessage,
        });

        if (isUserRejectionError(error)) {
          throw new UserRejectedError(errorMessage);
        }

        throw new Error(errorMessage);
      }
      await new Promise((resolve) =>
        setTimeout(resolve, POLLING_CONFIG.SWITCH_RETRY_DELAY_MS),
      );
    }
  }

  console.log("Confirmed on Base chain, proceeding to sign transaction");

  updateBridgeState({ step: SimpleBridgeStep.STEP_1_SIGNING });
  addTransaction({
    step: 1,
    status: "SIGNING",
    chainName: "Base",
    message: "Signing transaction...",
  });

  let step1TxHash: string | undefined;
  try {
    const hyperlaneResult = await triggerHyperlaneTransfer({
      origin: "base",
      destination: "torus",
      tokenIndex: 0,
      amount,
      recipient: evmAddress,
    });
    step1TxHash =
      hyperlaneResult &&
      typeof hyperlaneResult === "object" &&
      "hash" in hyperlaneResult
        ? (hyperlaneResult as { hash: string }).hash
        : undefined;
  } catch (hyperlaneError) {
    const error = hyperlaneError as Error;
    const isUserRejected = isUserRejectionError(error);
    const errorMessage = isUserRejected
      ? "Transaction rejected by user"
      : "Failed to execute Base → Torus EVM transfer";

    const errorDetails = formatErrorForUser(error);

    addTransaction({
      step: 1,
      status: "ERROR",
      chainName: "Base",
      message: errorMessage,
      errorDetails,
      txHash: undefined,
      explorerUrl: undefined,
    });

    updateBridgeState({
      step: SimpleBridgeStep.ERROR,
      errorMessage,
    });

    if (isUserRejected) {
      throw new UserRejectedError(errorMessage);
    }

    throw hyperlaneError;
  }

  // Success: Proceed to confirmation
  updateBridgeState({ step: SimpleBridgeStep.STEP_1_CONFIRMING });
  addTransaction({
    step: 1,
    status: "CONFIRMING" as const,
    chainName: "Base",
    message: "Waiting for confirmation...",
    txHash: step1TxHash,
    explorerUrl: step1TxHash ? getExplorerUrl(step1TxHash, "Base") : undefined,
  });

  await refetchTorusEvmBalance();
  const baselineBalance = torusEvmBalance?.value || 0n;
  const expectedIncrease = toNano(parseFloat(amount));

  let pollCount = 0;
  const pollPromise = new Promise<void>((resolve, reject) => {
    const interval = setInterval(() => {
      void (async () => {
        pollCount++;
        const refetchResult = (await refetchTorusEvmBalance()) as {
          status: string;
          data?: { value: bigint };
        };
        if (refetchResult.status === "error") {
          return;
        }
        const currentBalance = refetchResult.data?.value || 0n;

        if (currentBalance >= baselineBalance + expectedIncrease) {
          clearInterval(interval);
          resolve();
        } else if (pollCount >= POLLING_CONFIG.MAX_POLLS) {
          clearInterval(interval);
          reject(new Error("Confirmation timeout - no balance increase"));
        }
      })();
    }, POLLING_CONFIG.INTERVAL_MS);
  });

  try {
    await withTimeout(
      pollPromise,
      TIMEOUT_CONFIG.POLLING_OPERATION_MS,
      "Base transfer confirmation timeout",
    );
  } catch (pollError) {
    const errorMessage =
      pollError instanceof Error && pollError.message.includes("timeout")
        ? "Base transfer confirmation timeout - check balance and retry"
        : "Base transfer did not confirm (check balance and retry)";
    addTransaction({
      step: 1,
      status: "ERROR" as const,
      chainName: "Base",
      message: errorMessage,
      txHash: undefined,
      explorerUrl: undefined,
    });
    updateBridgeState({
      step: SimpleBridgeStep.ERROR,
      errorMessage,
    });
    throw pollError;
  }

  updateBridgeState({ step: SimpleBridgeStep.STEP_1_COMPLETE });
  addTransaction({
    step: 1,
    status: "SUCCESS" as const,
    chainName: "Base",
    message: "Transfer complete",
    txHash: step1TxHash,
    explorerUrl: step1TxHash ? getExplorerUrl(step1TxHash, "Base") : undefined,
  });

  // Always attempt to return to Base chain for cleanup
  try {
    await switchChain({ chainId: BASE_CHAIN_ID });
  } catch (returnError: unknown) {
    console.warn(
      "Auto-return to Base failed:",
      returnError instanceof Error ? returnError.message : String(returnError),
    );
  }
}

interface BaseToNativeStep2Params {
  amount: string;
  selectedAccount: { address: SS58Address };
  walletClient: WalletClient;
  chain: Chain;
  torusEvmChainId: number;
  switchChain: (params: { chainId: number }) => Promise<{ id: number }>;
  refetchTorusEvmBalance: () => Promise<unknown>;
  wagmiConfig: Config;
  updateBridgeState: (updates: {
    step: SimpleBridgeStep;
    errorMessage?: string;
  }) => void;
  addTransaction: (tx: SimpleBridgeTransaction) => void;
  getExplorerUrl: (txHash: string, chainName: string) => string;
}

export async function executeBaseToNativeStep2(
  params: BaseToNativeStep2Params,
) {
  const {
    amount,
    selectedAccount,
    walletClient,
    chain,
    torusEvmChainId,
    switchChain,
    refetchTorusEvmBalance,
    wagmiConfig,
    updateBridgeState,
    addTransaction,
    getExplorerUrl,
  } = params;

  const amountRems = toNano(parseFloat(amount));

  updateBridgeState({ step: SimpleBridgeStep.STEP_2_PREPARING });
  addTransaction({
    step: 2,
    status: "STARTING",
    chainName: "Torus EVM",
    message: "Preparing Torus EVM → Native withdrawal",
  });

  if (chain.id !== torusEvmChainId) {
    updateBridgeState({ step: SimpleBridgeStep.STEP_2_SWITCHING });
    addTransaction({
      step: 2,
      status: "STARTING",
      chainName: "Torus EVM",
      message: "Switching to Torus EVM chain...",
      metadata: { type: "switch" },
    });

    try {
      const result = await switchChain({ chainId: torusEvmChainId });
      console.log("Switch chain result:", result);

      // Verify the switch was successful
      if (chain.id !== torusEvmChainId) {
        console.warn(
          "Chain ID mismatch after switch. Expected:",
          torusEvmChainId,
          "Got:",
          chain.id,
        );
      }
    } catch (switchError: unknown) {
      const error = switchError as Error;
      const isUserRejected = isUserRejectionError(error);
      const errorMessage = isUserRejected
        ? "Chain switch rejected by user"
        : "Failed to switch to Torus EVM chain";

      const errorDetails = formatErrorForUser(error);

      addTransaction({
        step: 2,
        status: "ERROR",
        chainName: "Torus EVM",
        message: errorMessage,
        errorDetails,
        txHash: undefined,
        explorerUrl: undefined,
        metadata: { type: "switch" },
      });
      updateBridgeState({
        step: SimpleBridgeStep.ERROR,
        errorMessage,
      });

      if (isUserRejected) {
        throw new UserRejectedError(errorMessage);
      }

      throw error;
    }
  }

  // Verify we're on the correct chain
  console.log(
    "Current chain after switch:",
    chain.id,
    "Expected:",
    torusEvmChainId,
  );

  if (chain.id !== torusEvmChainId) {
    const errorMessage = "Failed to switch to Torus EVM chain";
    const errorDetails =
      "Unable to switch to Torus EVM network. Please switch manually and try again.";

    addTransaction({
      step: 2,
      status: "ERROR",
      chainName: "Torus EVM",
      message: errorMessage,
      errorDetails,
      metadata: { type: "switch" },
    });
    updateBridgeState({
      step: SimpleBridgeStep.ERROR,
      errorMessage,
    });
    throw new Error(errorMessage);
  }

  updateBridgeState({ step: SimpleBridgeStep.STEP_2_SIGNING });

  let txHash: string | undefined;
  try {
    txHash = await withdrawFromTorusEvm(
      walletClient,
      chain,
      selectedAccount.address,
      amountRems,
      async () => {
        await refetchTorusEvmBalance();
      },
    );
  } catch (withdrawError) {
    const error = withdrawError as Error;
    const isUserRejected = isUserRejectionError(error);
    const errorMessage = isUserRejected
      ? "Withdrawal transaction rejected by user"
      : "Failed to withdraw from Torus EVM";

    const errorDetails = formatErrorForUser(error);

    addTransaction({
      step: 2,
      status: "ERROR",
      chainName: "Torus EVM",
      message: errorMessage,
      errorDetails,
      txHash: undefined,
      explorerUrl: undefined,
    });

    updateBridgeState({
      step: SimpleBridgeStep.ERROR,
      errorMessage,
    });

    if (isUserRejected) {
      throw new UserRejectedError(errorMessage);
    }

    throw withdrawError; // Halt the flow for other errors
  }

  // Only proceed to confirmation if signing succeeded
  updateBridgeState({ step: SimpleBridgeStep.STEP_2_CONFIRMING });

  addTransaction({
    step: 2,
    status: "CONFIRMING" as const,
    chainName: "Torus EVM",
    message: "Waiting for confirmation...",
    txHash,
    explorerUrl: txHash ? getExplorerUrl(txHash, "Torus EVM") : undefined,
  });

  const [receiptError] = await tryAsync(
    waitForTransactionReceipt(wagmiConfig, {
      hash: txHash as `0x${string}`,
      confirmations: CONFIRMATION_CONFIG.REQUIRED_CONFIRMATIONS,
    }),
  );

  if (receiptError !== undefined) {
    console.warn("Failed to get transaction receipt:", receiptError);
  }

  addTransaction({
    step: 2,
    status: "SUCCESS",
    chainName: "Torus EVM",
    message: "Withdrawal complete",
    txHash,
    explorerUrl: getExplorerUrl(txHash, "Torus EVM"),
  });

  updateBridgeState({ step: SimpleBridgeStep.COMPLETE });
}
