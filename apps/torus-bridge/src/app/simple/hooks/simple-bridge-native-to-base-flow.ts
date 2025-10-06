import type { ApiPromise } from "@polkadot/api";
import { transferAllowDeath } from "@torus-network/sdk/chain";
import { convertH160ToSS58 } from "@torus-network/sdk/evm";
import type { SS58Address } from "@torus-network/sdk/types";
import { toNano } from "@torus-network/torus-utils/torus/token";
import type { SimpleBridgeTransaction } from "../_components/simple-bridge-types";
import { SimpleBridgeStep } from "../_components/simple-bridge-types";
import {
  formatErrorForUser,
  isUserRejectionError,
  POLLING_CONFIG,
  TIMEOUT_CONFIG,
  UserRejectedError,
  withTimeout,
} from "./simple-bridge-helpers";

/**
 * Parameters for executing Step 1 of the Native-to-Base bridge flow.
 *
 * This interface defines all the required parameters for the Native TORUS to Torus EVM
 * transfer process, including wallet connections, balance management, and UI state updates.
 */
interface NativeToBaseStep1Params {
  /** Amount of TORUS tokens to transfer from Native to Torus EVM as string */
  amount: string;
  /** Target EVM address in hex format (0x...) for the transfer destination */
  evmAddress: string;
  /** Currently selected Substrate account with SS58 address for signing */
  selectedAccount: { address: SS58Address };
  /** Polkadot.js API instance for Substrate blockchain interactions */
  api: ApiPromise;
  /** Function to send Substrate transactions with event tracking capabilities */
  sendTx: (tx: ReturnType<typeof transferAllowDeath>) => Promise<
    | [
        undefined,
        {
          tracker: {
            on: (event: string, callback: (data?: unknown) => void) => unknown;
            off: (event: string, callback: (data?: unknown) => void) => unknown;
          };
        },
      ]
    | [Error, undefined]
  >;
  /** Function to refetch Torus EVM balance from the network, returns status and optional balance data */
  refetchTorusEvmBalance: () => Promise<{
    status: string;
    data?: { value: bigint };
  }>;
  /** Optional current Torus EVM balance with value as bigint, undefined if not loaded */
  torusEvmBalance?: { value: bigint };
  /** Function to update the bridge UI state with step progress and error messages */
  updateBridgeState: (updates: {
    step: SimpleBridgeStep;
    errorMessage?: string;
  }) => void;
  /** Function to add transaction entries to the UI for tracking progress */
  addTransaction: (tx: SimpleBridgeTransaction) => void;
}

/**
 * Executes Step 1 of the Native-to-Base bridge flow.
 *
 * Orchestrates Native TORUS → Torus EVM transfer including Substrate transaction,
 * finalization tracking, and Torus EVM balance polling for confirmation.
 *
 * @param params - Step 1 execution parameters
 * @param params.amount - Amount of TORUS tokens to transfer as string
 * @param params.evmAddress - Target EVM address in hex format (0x...)
 * @param params.selectedAccount - Currently selected Substrate account with SS58 address
 * @param params.api - Polkadot.js API instance for Substrate interactions
 * @param params.sendTx - Function to send Substrate transactions with tracker
 * @param params.refetchTorusEvmBalance - Function to refetch Torus EVM balance from network
 * @param params.updateBridgeState - Function to update UI bridge state
 * @param params.addTransaction - Function to add transaction entries to UI
 * @returns Promise<void>
 * @throws {UserRejectedError} If user rejects the Substrate transaction
 * @throws {Error} On transaction failure, network errors, or confirmation timeout
 *
 * @sideEffects Updates bridge UI state, adds transactions to UI, makes network calls
 */
export async function executeNativeToBaseStep1(
  params: NativeToBaseStep1Params,
) {
  const {
    amount,
    evmAddress,
    selectedAccount: _selectedAccount,
    api,
    sendTx,
    refetchTorusEvmBalance,
    updateBridgeState,
    addTransaction,
  } = params;

  const amountRems = toNano(amount.trim());
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

  // Shared settled flag accessible from both promise closure and timeout handler
  const settledRef = { current: false };

  const trackerPromise = new Promise<void>((resolve, reject) => {
    const handleFinalized = async () => {
      if (settledRef.current) return;
      settledRef.current = true;

      // Remove listeners to prevent further events
      tracker.off("finalized", onFinalized);
      tracker.off("error", onError);

      console.log(
        "DEBUG - Substrate transaction finalized! Starting Torus EVM balance polling",
      );

      // After Substrate finalization, poll Torus EVM balance to confirm tokens arrived
      console.log(
        "DEBUG - Starting Torus EVM balance polling after Substrate finalization",
      );

      // Get fresh baseline balance
      const baselineResult = await refetchTorusEvmBalance();
      const baselineBalance = baselineResult.data?.value || 0n;
      const expectedIncrease = toNano(amount.trim());

      console.log(
        "DEBUG - Baseline balance:",
        Number(baselineBalance) / 1e18,
        "TORUS",
      );
      console.log("DEBUG - Expected increase:", parseFloat(amount), "TORUS");
      console.log(
        "DEBUG - Expected final balance:",
        Number(baselineBalance + expectedIncrease) / 1e18,
        "TORUS",
      );

      let pollCount = 0;
      const pollPromise = new Promise<void>((resolvePoll, rejectPoll) => {
        const intervalId = setInterval(() => {
          void (async () => {
            pollCount++;
            console.log(
              `DEBUG - Poll ${pollCount}: Checking Torus EVM balance`,
            );

            const refetchResult = (await refetchTorusEvmBalance()) as {
              status: string;
              data?: { value: bigint };
            };

            if (refetchResult.status === "error") {
              console.log("DEBUG - Refetch error, skipping this poll");
              return;
            }

            const currentBalance = refetchResult.data?.value || 0n;
            console.log(
              "DEBUG - Current balance:",
              Number(currentBalance) / 1e18,
              "TORUS",
            );
            console.log(
              "DEBUG - Target balance:",
              Number(baselineBalance + expectedIncrease) / 1e18,
              "TORUS",
            );

            if (currentBalance >= baselineBalance + expectedIncrease) {
              console.log("DEBUG - Balance target reached! Resolving polling");
              clearInterval(intervalId);
              resolvePoll();
            } else if (pollCount >= POLLING_CONFIG.MAX_POLLS) {
              console.log("DEBUG - Polling timeout reached, rejecting");
              clearInterval(intervalId);
              rejectPoll(
                new Error(
                  "Torus EVM balance confirmation timeout - no balance increase",
                ),
              );
            }
          })();
        }, POLLING_CONFIG.INTERVAL_MS);
      });

      try {
        await withTimeout(
          pollPromise,
          TIMEOUT_CONFIG.POLLING_OPERATION_MS,
          "Torus EVM balance confirmation timeout",
        );

        updateBridgeState({ step: SimpleBridgeStep.STEP_1_COMPLETE });
        addTransaction({
          step: 1,
          status: "SUCCESS",
          chainName: "Torus Native",
          message: "Bridge complete - tokens arrived in Torus EVM",
        });
        resolve();
      } catch (pollError) {
        const errorMessage =
          pollError instanceof Error && pollError.message.includes("timeout")
            ? "Bridge confirmation timeout - tokens may not have arrived in Torus EVM"
            : "Bridge did not complete successfully";

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
        reject(
          pollError instanceof Error ? pollError : new Error(String(pollError)),
        );
      }
    };

    const handleError = (error: unknown) => {
      if (settledRef.current) return;
      settledRef.current = true;

      // Remove listeners to prevent further events
      tracker.off("finalized", onFinalized);
      tracker.off("error", onError);

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

    // Create named handler functions for proper cleanup
    const onFinalized = () => void handleFinalized();
    const onError = (error: unknown) => void handleError(error);

    tracker.on("finalized", onFinalized);
    tracker.on("error", onError);
  });

  try {
    await withTimeout(
      trackerPromise,
      TIMEOUT_CONFIG.DEFAULT_OPERATION_MS,
      "Native bridge transaction timeout",
    );
  } catch (timeoutError) {
    // Mark as settled to prevent handler execution after timeout
    // The handlers will check settledRef.current and exit early
    settledRef.current = true;

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

/**
 * Parameters for executing Step 2 of the Native-to-Base bridge flow.
 *
 * This interface defines all the required parameters for the Torus EVM to Base
 * transfer process, including chain switching, balance management, and UI state updates.
 */
interface NativeToBaseStep2Params {
  /** Amount of TORUS tokens to transfer as string */
  amount: string;
  /** Target EVM address in hex format (0x...) */
  evmAddress: string;
  /** Target Torus EVM chain ID for switching */
  torusEvmChainId: number;
  /** Optional current chain ID from reactive state */
  chainId?: number;
  /** Wallet client for querying current chain */
  walletClient: { getChainId: () => Promise<number> };
  /** Function to switch wallet to target chain */
  switchChain: (params: { chainId: number }) => Promise<{ id: number }>;
  /** Function to trigger Hyperlane cross-chain transfer and return transaction hash */
  triggerHyperlaneTransfer: (params: {
    origin: string;
    destination: string;
    tokenIndex: number;
    amount: string;
    recipient: string;
  }) => Promise<string>;
  /** Function to refetch Base balance */
  refetchBaseBalance: () => Promise<unknown>;
  /** Optional current Base balance */
  baseBalance?: { value: bigint };
  /** Function to update bridge UI state */
  updateBridgeState: (updates: {
    step: SimpleBridgeStep;
    errorMessage?: string;
  }) => void;
  /** Function to add transaction entries to UI */
  addTransaction: (tx: SimpleBridgeTransaction) => void;
  /** Function to generate blockchain explorer URLs */
  getExplorerUrl: (txHash: string, chainName: string) => string;
}

/**
 * Executes Step 2 of the Native-to-Base bridge flow.
 *
 * Orchestrates Torus EVM → Base transfer including chain switch, Hyperlane transfer,
 * and Base balance polling for confirmation.
 *
 * @param params - Step 2 execution parameters of type NativeToBaseStep2Params
 * @returns Promise<void>
 * @throws {UserRejectedError} If user rejects chain switch or transaction
 * @throws {Error} On switch failure, transfer failure, or confirmation timeout
 */
export async function executeNativeToBaseStep2(
  params: NativeToBaseStep2Params,
) {
  const {
    amount,
    evmAddress,
    torusEvmChainId,
    chainId: _chainId,
    walletClient,
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

  // Check actual wallet chain ID, not the reactive chainId parameter
  const actualChainId = await walletClient.getChainId();
  console.log(
    "Step 2 - Actual wallet chain:",
    actualChainId,
    "Target: Torus EVM (",
    torusEvmChainId,
    ")",
  );

  if (actualChainId !== torusEvmChainId) {
    updateBridgeState({ step: SimpleBridgeStep.STEP_2_SWITCHING });
    addTransaction({
      step: 2,
      status: "STARTING",
      chainName: "Torus EVM",
      message: "Switching to Torus EVM chain...",
      metadata: { type: "switch" },
    });

    let currentChainId = actualChainId;
    let torusEvmSwitchAttempts = 0;
    let lastSwitchError: Error | undefined;

    while (
      torusEvmSwitchAttempts < POLLING_CONFIG.MAX_SWITCH_ATTEMPTS &&
      currentChainId !== torusEvmChainId
    ) {
      try {
        console.log(
          `Attempting to switch to Torus EVM chain (attempt ${torusEvmSwitchAttempts + 1})`,
        );
        const result = await switchChain({ chainId: torusEvmChainId });
        currentChainId = result.id;

        if (currentChainId === torusEvmChainId) {
          console.log("Successfully switched to Torus EVM chain");
          break;
        }

        // Wait and verify chain switch
        await new Promise((resolve) =>
          setTimeout(resolve, POLLING_CONFIG.SWITCH_RETRY_DELAY_MS),
        );

        // Re-check wallet's actual chain ID after delay
        const recheckChainId = await walletClient.getChainId();
        if (recheckChainId === torusEvmChainId) {
          console.log("Chain switch verified after delay");
          currentChainId = recheckChainId;
          break;
        }

        console.warn(
          "Chain ID mismatch after switch. Expected:",
          torusEvmChainId,
          "Got:",
          recheckChainId,
        );

        // Increment attempts for unsuccessful switch (even when no exception thrown)
        torusEvmSwitchAttempts++;

        if (torusEvmSwitchAttempts >= POLLING_CONFIG.MAX_SWITCH_ATTEMPTS) {
          const errorMessage = "Unable to switch to Torus EVM network";
          const errorDetails =
            "Failed to switch to Torus EVM network after 3 attempts. Please switch manually to Torus EVM in your wallet and click Retry to continue.";

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

          throw new Error(errorMessage);
        }

        console.log(
          `Waiting ${POLLING_CONFIG.SWITCH_RETRY_DELAY_MS / 1000}s before retry attempt ${torusEvmSwitchAttempts + 1}...`,
        );

        // Wait before retry
        await new Promise((resolve) =>
          setTimeout(resolve, POLLING_CONFIG.SWITCH_RETRY_DELAY_MS),
        );
      } catch (switchError: unknown) {
        lastSwitchError = switchError as Error;
        torusEvmSwitchAttempts++;

        console.log(
          `Switch attempt ${torusEvmSwitchAttempts} failed:`,
          lastSwitchError.message,
        );

        if (torusEvmSwitchAttempts >= POLLING_CONFIG.MAX_SWITCH_ATTEMPTS) {
          const error = switchError as Error;
          const isUserRejected = isUserRejectionError(error);
          const errorMessage = isUserRejected
            ? "Network switch was not accepted"
            : "Unable to switch to Torus EVM network";

          const errorDetails = isUserRejected
            ? "Please accept the network switch in your wallet to continue the transfer, or switch manually to Torus EVM and click Retry."
            : "Failed to switch to Torus EVM network after 3 attempts. Please switch manually to Torus EVM in your wallet and click Retry to continue.";

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

        console.log(
          `Waiting ${POLLING_CONFIG.SWITCH_RETRY_DELAY_MS / 1000}s before retry attempt ${torusEvmSwitchAttempts + 1}...`,
        );

        // Wait before retry
        await new Promise((resolve) =>
          setTimeout(resolve, POLLING_CONFIG.SWITCH_RETRY_DELAY_MS),
        );
      }
    }

    // Final verification with wallet's actual chain
    const finalChainId = await walletClient.getChainId();
    if (finalChainId !== torusEvmChainId) {
      const errorMessage = "Failed to verify Torus EVM chain switch";
      const errorDetails =
        lastSwitchError !== undefined
          ? formatErrorForUser(lastSwitchError)
          : "Unable to switch to Torus EVM network. Please switch manually and try again.";

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

      if (
        lastSwitchError !== undefined &&
        isUserRejectionError(lastSwitchError)
      ) {
        throw new UserRejectedError(errorMessage);
      }

      throw new Error(errorMessage);
    }

    console.log(
      "Confirmed on Torus EVM chain, proceeding to Hyperlane transfer",
    );
    addTransaction({
      step: 2,
      status: "SUCCESS",
      chainName: "Torus EVM",
      message: "Successfully switched to Torus EVM",
      metadata: { type: "switch" },
    });
  }

  // Note: We don't check ETH balance here - let the wallet handle gas validation
  // The wallet will show a proper error if there's insufficient gas

  updateBridgeState({ step: SimpleBridgeStep.STEP_2_SIGNING });
  addTransaction({
    step: 2,
    status: "SIGNING",
    chainName: "Torus EVM",
    message: "Signing transaction...",
  });

  let txHash2: string | undefined;
  try {
    txHash2 = await triggerHyperlaneTransfer({
      origin: "torus",
      destination: "base",
      tokenIndex: 1,
      amount,
      recipient: evmAddress,
    });
  } catch (hyperlaneError2) {
    const error = hyperlaneError2 as Error;
    const errorMessage = isUserRejectionError(error)
      ? "Transaction rejected by user"
      : "Failed to execute Torus EVM → Base transfer";

    const errorDetails = formatErrorForUser(error);

    addTransaction({
      step: 2,
      status: "ERROR",
      chainName: "Torus EVM",
      message: errorMessage,
      errorDetails,
      txHash: undefined,
      explorerUrl: undefined,
      errorPhase: "sign",
    });

    updateBridgeState({
      step: SimpleBridgeStep.ERROR,
      errorMessage,
    });

    if (isUserRejectionError(error)) {
      throw new UserRejectedError(errorMessage);
    }

    throw hyperlaneError2;
  }

  updateBridgeState({ step: SimpleBridgeStep.STEP_2_CONFIRMING });

  await refetchBaseBalance();
  const baseBaselineBalance = baseBalance?.value || 0n;
  const baseExpectedIncrease = toNano(parseFloat(amount));

  let basePollCount = 0;
  const basePollPromise = new Promise<void>((resolve, reject) => {
    const baseIntervalId = setInterval(() => {
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
          clearInterval(baseIntervalId);
          resolve();
        } else if (basePollCount >= POLLING_CONFIG.MAX_POLLS) {
          clearInterval(baseIntervalId);
          reject(new Error("Confirmation timeout - no balance increase"));
        }
      })();
    }, POLLING_CONFIG.INTERVAL_MS);
  });

  try {
    await withTimeout(
      basePollPromise,
      TIMEOUT_CONFIG.POLLING_OPERATION_MS,
      "Base transfer confirmation timeout",
    );
  } catch (basePollError) {
    const baseErrorMessage =
      basePollError instanceof Error &&
      basePollError.message.includes("timeout")
        ? "Base transfer confirmation timeout - check balance and retry"
        : "Base transfer did not confirm (check balance and retry)";
    addTransaction({
      step: 2,
      status: "ERROR" as const,
      chainName: "Torus EVM",
      message: baseErrorMessage,
      txHash: undefined,
      explorerUrl: undefined,
      errorPhase: "confirm",
    });
    updateBridgeState({
      step: SimpleBridgeStep.ERROR,
      errorMessage: baseErrorMessage,
    });
    throw basePollError;
  }

  updateBridgeState({ step: SimpleBridgeStep.COMPLETE });

  addTransaction({
    step: 2,
    status: "SUCCESS" as const,
    chainName: "Base",
    message: "Transfer complete",
    txHash: txHash2,
    explorerUrl: txHash2 ? getExplorerUrl(txHash2, "Base") : undefined,
  });
}
