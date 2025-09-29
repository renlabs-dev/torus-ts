import { withdrawFromTorusEvm, waitForTransactionReceipt } from "@torus-network/sdk/evm";
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
  GAS_CONFIG,
  isUserRejectionError,
  POLLING_CONFIG,
} from "./simple-bridge-helpers";

interface BaseToNativeStep1Params {
  amount: string;
  evmAddress: string;
  chain: Chain;
  switchChain: (params: { chainId: number }) => void;
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
  updateBridgeState: (updates: { step: SimpleBridgeStep; errorMessage?: string }) => void;
  addTransaction: (tx: SimpleBridgeTransaction) => void;
  getExplorerUrl: (txHash: string, chainName: string) => string;
}

export async function executeBaseToNativeStep1(params: BaseToNativeStep1Params) {
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

  let baseSwitchAttempts = 0;
  while (
    baseSwitchAttempts < POLLING_CONFIG.MAX_SWITCH_ATTEMPTS &&
    chain.id !== BASE_CHAIN_ID
  ) {
    try {
      switchChain({ chainId: BASE_CHAIN_ID });
      await new Promise<void>((resolve) =>
        setTimeout(resolve, POLLING_CONFIG.SWITCH_RETRY_DELAY_MS),
      );
      if (chain.id === BASE_CHAIN_ID) break;
      throw new Error("Base switch verification failed");
    } catch {
      baseSwitchAttempts++;
      if (baseSwitchAttempts >= POLLING_CONFIG.MAX_SWITCH_ATTEMPTS) {
        throw new Error("Failed to switch to Base chain");
      }
      await new Promise((resolve) =>
        setTimeout(resolve, POLLING_CONFIG.SWITCH_RETRY_DELAY_MS),
      );
    }
  }

  updateBridgeState({ step: SimpleBridgeStep.STEP_1_SIGNING });
  addTransaction({
    step: 1,
    status: "SIGNING",
    chainName: "Base",
    message: "Signing transaction...",
  });

  const [hyperlaneError, hyperlaneResult] = await tryAsync(
    triggerHyperlaneTransfer({
      origin: "base",
      destination: "torus",
      tokenIndex: 0,
      amount,
      recipient: evmAddress,
    }),
  );

  if (hyperlaneError) {
    const errorMessage = isUserRejectionError(hyperlaneError)
      ? "Transaction rejected by user"
      : "Failed to execute Base → Torus EVM transfer";

    addTransaction({
      step: 1,
      status: "ERROR",
      chainName: "Base",
      message: errorMessage,
      txHash: undefined,
      explorerUrl: undefined,
    });

    updateBridgeState({
      step: SimpleBridgeStep.ERROR,
      errorMessage,
    });

    if (isUserRejectionError(hyperlaneError)) {
      return;
    }

    throw hyperlaneError;
  }

  updateBridgeState({ step: SimpleBridgeStep.STEP_1_CONFIRMING });
  addTransaction({
    step: 1,
    status: "CONFIRMING" as const,
    chainName: "Base",
    message: "Waiting for confirmation...",
    txHash: undefined,
    explorerUrl: undefined,
  });

  await refetchTorusEvmBalance();
  const baselineBalance = torusEvmBalance?.value || 0n;
  const expectedIncrease = toNano(parseFloat(amount));

  let pollCount = 0;
  const pollPromise = new Promise<void>((resolve, reject) => {
    const interval = setInterval(() => {
      void (async () => {
        pollCount++;
        const refetchResult = await refetchTorusEvmBalance() as {status: string; data?: {value: bigint}};
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
    await pollPromise;
  } catch (pollError) {
    const errorMessage =
      "Base transfer did not confirm (check balance and retry)";
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
  const step1TxHash =
    hyperlaneResult && typeof hyperlaneResult === "object" && "hash" in hyperlaneResult
      ? (hyperlaneResult as { hash: string }).hash
      : undefined;

  addTransaction({
    step: 1,
    status: "SUCCESS" as const,
    chainName: "Base",
    message: "Transfer complete",
    txHash: step1TxHash,
    explorerUrl: step1TxHash
      ? getExplorerUrl(step1TxHash, "Base")
      : undefined,
  });

  try {
    if (chain.id !== BASE_CHAIN_ID) {
      switchChain({ chainId: BASE_CHAIN_ID });
    }
  } catch (returnError: unknown) {
    console.warn(
      "Auto-return to Base failed:",
      returnError instanceof Error
        ? returnError.message
        : String(returnError),
    );
  }
}

interface BaseToNativeStep2Params {
  amount: string;
  selectedAccount: { address: SS58Address };
  walletClient: WalletClient;
  chain: Chain;
  torusEvmChainId: number;
  switchChain: (params: { chainId: number }) => void;
  refetchNativeEthBalance: () => Promise<unknown>;
  refetchTorusEvmBalance: () => Promise<unknown>;
  nativeEthBalance?: { value: bigint };
  wagmiConfig: Config;
  updateBridgeState: (updates: { step: SimpleBridgeStep; errorMessage?: string }) => void;
  addTransaction: (tx: SimpleBridgeTransaction) => void;
  getExplorerUrl: (txHash: string, chainName: string) => string;
}

export async function executeBaseToNativeStep2(params: BaseToNativeStep2Params) {
  const {
    amount,
    selectedAccount,
    walletClient,
    chain,
    torusEvmChainId,
    switchChain,
    refetchNativeEthBalance,
    refetchTorusEvmBalance,
    nativeEthBalance,
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
    try {
      switchChain({ chainId: torusEvmChainId });
    } catch (switchError: unknown) {
      if (!(switchError instanceof Error)) {
        throw switchError;
      }

      const errorMessage = isUserRejectionError(switchError)
        ? "Chain switch rejected by user"
        : "Failed to switch to Torus EVM chain";

      addTransaction({
        step: 2,
        status: "ERROR",
        chainName: "Torus EVM",
        message: errorMessage,
        txHash: undefined,
        explorerUrl: undefined,
      });
      updateBridgeState({
        step: SimpleBridgeStep.ERROR,
        errorMessage,
      });

      if (isUserRejectionError(switchError)) {
        return;
      }

      throw switchError;
    }
  }

  await refetchNativeEthBalance();
  if ((nativeEthBalance?.value ?? 0n) < GAS_CONFIG.ESTIMATED_TOTAL) {
    const errorMessage =
      "Insufficient ETH for gas on Torus EVM. Please add funds.";
    addTransaction({
      step: 2,
      status: "ERROR",
      chainName: "Torus EVM",
      message: errorMessage,
      txHash: undefined,
      explorerUrl: undefined,
    });
    updateBridgeState({
      step: SimpleBridgeStep.ERROR,
      errorMessage,
    });
    throw new Error(errorMessage);
  }

  updateBridgeState({ step: SimpleBridgeStep.STEP_2_SIGNING });

  const [withdrawError, txHash] = await tryAsync(
    withdrawFromTorusEvm(
      walletClient,
      chain,
      selectedAccount.address,
      amountRems,
      async () => {
        await refetchTorusEvmBalance();
      },
    ),
  );

  if (withdrawError !== undefined) {
    const errorMessage = isUserRejectionError(withdrawError)
      ? "Withdrawal transaction rejected by user"
      : "Failed to withdraw from Torus EVM";

    addTransaction({
      step: 2,
      status: "ERROR",
      chainName: "Torus EVM",
      message: errorMessage,
      txHash: undefined,
      explorerUrl: undefined,
    });

    updateBridgeState({
      step: SimpleBridgeStep.ERROR,
      errorMessage,
    });

    if (isUserRejectionError(withdrawError)) {
      return;
    }

    throw withdrawError;
  }

  updateBridgeState({ step: SimpleBridgeStep.STEP_2_CONFIRMING });

  const [receiptError] = await tryAsync(
    waitForTransactionReceipt(wagmiConfig, {
      hash: txHash,
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