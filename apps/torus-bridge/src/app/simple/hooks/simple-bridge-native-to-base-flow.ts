import type { ApiPromise } from "@polkadot/api";
import { transferAllowDeath } from "@torus-network/sdk/chain";
import { convertH160ToSS58 } from "@torus-network/sdk/evm";
import type { SS58Address } from "@torus-network/sdk/types";
import { toNano } from "@torus-network/torus-utils/torus/token";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import type { SimpleBridgeTransaction } from "../_components/simple-bridge-types";
import { SimpleBridgeStep } from "../_components/simple-bridge-types";
import {
  isUserRejectionError,
  POLLING_CONFIG,
  TIMEOUT_CONFIG,
  withTimeout,
  formatErrorForUser,
  UserRejectedError,
} from "./simple-bridge-helpers";

interface NativeToBaseStep1Params {
  amount: string;
  evmAddress: string;
  selectedAccount: { address: SS58Address };
  api: ApiPromise;
  sendTx: (tx: ReturnType<typeof transferAllowDeath>) => Promise<
    | [
        undefined,
        {
          tracker: {
            on: (event: string, callback: (data?: unknown) => void) => unknown;
          };
        },
      ]
    | [Error, undefined]
  >;
  updateBridgeState: (updates: {
    step: SimpleBridgeStep;
    errorMessage?: string;
  }) => void;
  addTransaction: (tx: SimpleBridgeTransaction) => void;
}

export async function executeNativeToBaseStep1(
  params: NativeToBaseStep1Params,
) {
  const {
    amount,
    evmAddress,
    selectedAccount: _selectedAccount,
    api,
    sendTx,
    updateBridgeState,
    addTransaction,
  } = params;

  const amountRems = toNano(parseFloat(amount));
  const evmSS58Addr = convertH160ToSS58(evmAddress);

  updateBridgeState({ step: SimpleBridgeStep.STEP_1_PREPARING });
  addTransaction({
    step: 1,
    status: "STARTING",
    chainName: "Torus Native",
    message: "Preparing Native → Torus EVM bridge",
  });

  updateBridgeState({ step: SimpleBridgeStep.STEP_1_SIGNING });

  const [sendErr, sendRes] = await sendTx(
    transferAllowDeath(api, evmSS58Addr, amountRems),
  );

  if (sendErr !== undefined) {
    const errorMessage = isUserRejectionError(sendErr)
      ? "Transaction rejected by user"
      : "Failed to bridge from Native to Torus EVM";

    const errorDetails = formatErrorForUser(sendErr);

    addTransaction({
      step: 1,
      status: "ERROR",
      chainName: "Torus Native",
      message: errorMessage,
      errorDetails,
      txHash: undefined,
      explorerUrl: undefined,
    });

    updateBridgeState({
      step: SimpleBridgeStep.ERROR,
      errorMessage,
    });

    if (isUserRejectionError(sendErr)) {
      throw new UserRejectedError(errorMessage);
    }

    throw sendErr;
  }

  const { tracker } = sendRes;

  updateBridgeState({ step: SimpleBridgeStep.STEP_1_CONFIRMING });

  const trackerPromise = new Promise<void>((resolve, reject) => {
    let settled = false;

    const handleFinalized = () => {
      if (settled) return;
      settled = true;

      updateBridgeState({ step: SimpleBridgeStep.STEP_1_COMPLETE });
      addTransaction({
        step: 1,
        status: "SUCCESS",
        chainName: "Torus Native",
        message: "Bridge complete",
      });
      resolve();
    };

    const handleError = (error: unknown) => {
      if (settled) return;
      settled = true;

      updateBridgeState({
        step: SimpleBridgeStep.ERROR,
        errorMessage: "Native bridge transaction failed",
      });
      addTransaction({
        step: 1,
        status: "ERROR",
        chainName: "Torus Native",
        message: "Transaction failed",
      });
      reject(error instanceof Error ? error : new Error(String(error)));
    };

    tracker.on("finalized", handleFinalized);
    tracker.on("error", handleError);
  });

  try {
    await withTimeout(
      trackerPromise,
      TIMEOUT_CONFIG.DEFAULT_OPERATION_MS,
      "Native bridge transaction timeout",
    );
  } catch (timeoutError) {
    const errorMessage =
      timeoutError instanceof Error && timeoutError.message.includes("timeout")
        ? "Native bridge transaction timeout - please retry"
        : "Native bridge transaction failed";

    updateBridgeState({
      step: SimpleBridgeStep.ERROR,
      errorMessage,
    });
    addTransaction({
      step: 1,
      status: "ERROR",
      chainName: "Torus Native",
      message: errorMessage,
    });
    throw timeoutError;
  }
}

interface NativeToBaseStep2Params {
  amount: string;
  evmAddress: string;
  torusEvmChainId: number;
  chainId?: number;
  switchChain: (params: { chainId: number }) => Promise<{ id: number }>;
  triggerHyperlaneTransfer: (params: {
    origin: string;
    destination: string;
    tokenIndex: number;
    amount: string;
    recipient: string;
  }) => Promise<unknown>;
  refetchBaseBalance: () => Promise<unknown>;
  baseBalance?: { value: bigint };
  updateBridgeState: (updates: {
    step: SimpleBridgeStep;
    errorMessage?: string;
  }) => void;
  addTransaction: (tx: SimpleBridgeTransaction) => void;
  getExplorerUrl: (txHash: string, chainName: string) => string;
}

export async function executeNativeToBaseStep2(
  params: NativeToBaseStep2Params,
) {
  const {
    amount,
    evmAddress,
    torusEvmChainId,
    chainId,
    switchChain,
    triggerHyperlaneTransfer,
    refetchBaseBalance,
    baseBalance,
    updateBridgeState,
    addTransaction,
    getExplorerUrl,
  } = params;

  updateBridgeState({ step: SimpleBridgeStep.STEP_2_PREPARING });
  addTransaction({
    step: 2,
    status: "STARTING",
    chainName: "Torus EVM",
    message: "Preparing Torus EVM → Base transfer",
  });

  if (chainId !== torusEvmChainId) {
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

      // Note: chainId param might not be updated immediately, will verify via balance fetch
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
  console.log("Current chain after switch:", chainId, "Expected:", torusEvmChainId);

  // Note: We don't check ETH balance here - let the wallet handle gas validation
  // The wallet will show a proper error if there's insufficient gas

  updateBridgeState({ step: SimpleBridgeStep.STEP_2_SIGNING });
  addTransaction({
    step: 2,
    status: "SIGNING",
    chainName: "Torus EVM",
    message: "Signing transaction...",
  });

  const [hyperlaneError2, hyperlaneResult2] = await tryAsync(
    triggerHyperlaneTransfer({
      origin: "torus",
      destination: "base",
      tokenIndex: 1,
      amount,
      recipient: evmAddress,
    }),
  );

  if (hyperlaneError2) {
    const errorMessage = isUserRejectionError(hyperlaneError2)
      ? "Transaction rejected by user"
      : "Failed to execute Torus EVM → Base transfer";

    const errorDetails = formatErrorForUser(hyperlaneError2);

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

    if (isUserRejectionError(hyperlaneError2)) {
      throw new UserRejectedError(errorMessage);
    }

    throw hyperlaneError2;
  }

  updateBridgeState({ step: SimpleBridgeStep.STEP_2_CONFIRMING });
  addTransaction({
    step: 2,
    status: "CONFIRMING" as const,
    chainName: "Torus EVM",
    message: "Waiting for confirmation...",
    txHash: undefined,
    explorerUrl: undefined,
  });

  await refetchBaseBalance();
  const baseBaselineBalance = baseBalance?.value || 0n;
  const baseExpectedIncrease = toNano(parseFloat(amount));

  let basePollCount = 0;
  const basePollPromise = new Promise<void>((resolve, reject) => {
    const interval = setInterval(() => {
      void (async () => {
        basePollCount++;
        const baseRefetchResult = (await refetchBaseBalance()) as {
          status: string;
          data?: { value: bigint };
        };
        if (baseRefetchResult.status === "error") {
          return;
        }
        const currentBaseBalance = baseRefetchResult.data?.value || 0n;

        if (currentBaseBalance >= baseBaselineBalance + baseExpectedIncrease) {
          clearInterval(interval);
          resolve();
        } else if (basePollCount >= POLLING_CONFIG.MAX_POLLS) {
          clearInterval(interval);
          reject(new Error("Confirmation timeout - no balance increase"));
        }
      })();
    }, POLLING_CONFIG.INTERVAL_MS);
  });

  try {
    await withTimeout(
      basePollPromise,
      TIMEOUT_CONFIG.POLLING_OPERATION_MS,
      "Torus EVM transfer confirmation timeout",
    );
  } catch (basePollError) {
    const baseErrorMessage =
      basePollError instanceof Error &&
      basePollError.message.includes("timeout")
        ? "Torus EVM transfer confirmation timeout - check balance and retry"
        : "Torus EVM transfer did not confirm (check balance and retry)";
    addTransaction({
      step: 2,
      status: "ERROR" as const,
      chainName: "Torus EVM",
      message: baseErrorMessage,
      txHash: undefined,
      explorerUrl: undefined,
    });
    updateBridgeState({
      step: SimpleBridgeStep.ERROR,
      errorMessage: baseErrorMessage,
    });
    throw basePollError;
  }

  updateBridgeState({ step: SimpleBridgeStep.COMPLETE });
  const txHash2 =
    hyperlaneResult2 &&
    typeof hyperlaneResult2 === "object" &&
    "hash" in hyperlaneResult2
      ? (hyperlaneResult2 as { hash: string }).hash
      : undefined;

  addTransaction({
    step: 2,
    status: "SUCCESS" as const,
    chainName: "Torus EVM",
    message: "Transfer complete",
    txHash: txHash2,
    explorerUrl: txHash2 ? getExplorerUrl(txHash2, "Torus EVM") : undefined,
  });
}
