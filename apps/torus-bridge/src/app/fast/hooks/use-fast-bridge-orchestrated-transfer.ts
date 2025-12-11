"use client";

import { useAccounts } from "@hyperlane-xyz/widgets";
import type { SS58Address } from "@torus-network/sdk/types";
import { toNano } from "@torus-network/torus-utils/torus/token";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { useFreeBalance } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { useSendTransaction } from "@torus-ts/torus-provider/use-send-transaction";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import type { Config } from "@wagmi/core";
import { contractAddresses, getChainValuesOnEnv } from "~/config";
import { env } from "~/env";
import { useWarpCore } from "~/hooks/token";
import { useMultiProvider } from "~/hooks/use-multi-provider";
import { useTokenTransfer } from "~/hooks/use-token-transfer";
import { useCallback, useMemo, useRef } from "react";
import { erc20Abi } from "viem";
import {
  useAccount,
  useBalance,
  useClient,
  useConfig,
  useReadContract,
  useSwitchChain,
  useWalletClient,
} from "wagmi";
import type { SimpleBridgeDirection } from "../_components/fast-bridge-types";
import { SimpleBridgeStep } from "../_components/fast-bridge-types";
import {
  executeBaseToNativeStep1,
  executeBaseToNativeStep2,
} from "./fast-bridge-base-to-native-flow";
import { BASE_CHAIN_ID, UserRejectedError } from "./fast-bridge-helpers";
import {
  executeNativeToBaseStep1,
  executeNativeToBaseStep2,
} from "./fast-bridge-native-to-base-flow";
import { pollEvmBalance } from "./fast-bridge-polling";
import { useSimpleBridgeSharedState } from "./use-fast-bridge-shared-state";
import { useFastBridgeTransactionHistory } from "./use-fast-bridge-transaction-history";

export function useOrchestratedTransfer() {
  const {
    bridgeState,
    transactions,
    updateBridgeState,
    addTransaction,
    setTransactions,
    resetTransfer,
    clearErrorDetails,
    getExplorerUrl,
  } = useSimpleBridgeSharedState();

  const {
    addTransaction: addToHistory,
    updateTransaction: updateHistoryTransaction,
  } = useFastBridgeTransactionHistory();

  const currentTransactionIdRef = useRef<string | null>(null);
  const onTransactionCreatedRef = useRef<((txId: string) => void) | null>(null);

  const { toast } = useToast();

  const { selectedAccount, api, torusApi, wsEndpoint } = useTorus();

  const { sendTx: _sendTx } = useSendTransaction({
    api,
    selectedAccount,
    wsEndpoint,
    wallet: torusApi,
    transactionType: "Fast Bridge Transfer",
  });

  const sendTx = useCallback(
    async (tx: Parameters<NonNullable<typeof _sendTx>>[0]) => {
      if (!_sendTx) {
        throw new Error("sendTx is not available");
      }
      const [error, result] = await _sendTx(tx);
      if (error !== undefined) {
        return [error, undefined] as [Error, undefined];
      }
      return [
        undefined,
        result as {
          tracker: {
            on: (event: string, callback: (data?: unknown) => void) => unknown;
            off: (event: string, callback: (data?: unknown) => void) => unknown;
          };
        },
      ] as [
        undefined,
        {
          tracker: {
            on: (event: string, callback: (data?: unknown) => void) => unknown;
            off: (event: string, callback: (data?: unknown) => void) => unknown;
          };
        },
      ];
    },
    [_sendTx],
  );

  // Cast needed due to wagmi version mismatch between app and SDK
  const wagmiConfig = useConfig() as Config;
  const { data: walletClient } = useWalletClient();
  const { address: evmAddress, chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const getChainValues = getChainValuesOnEnv(
    env("NEXT_PUBLIC_TORUS_CHAIN_ENV"),
  );
  const { chainId: torusEvmChainId } = getChainValues("torus");

  const warpCore = useWarpCore();
  const _multiProvider = useMultiProvider();
  const { accounts } = useAccounts(_multiProvider);

  const { triggerTransactions: _triggerTransactions } = useTokenTransfer(
    undefined,
    true, // throwOnError=true to allow error propagation for custom handling
  );

  const triggerHyperlaneTransfer = useCallback(
    async (params: {
      origin: string;
      destination: string;
      tokenIndex: number;
      amount: string;
      recipient: string;
    }): Promise<string> => {
      const hash = await _triggerTransactions({
        origin: params.origin,
        destination: params.destination,
        tokenIndex: params.tokenIndex,
        amount: params.amount,
        recipient: params.recipient,
      });

      if (!hash) {
        throw new Error("Transaction hash not found after transfer");
      }

      return hash;
    },
    [_triggerTransactions],
  );

  const _torusEvmClient = useClient({ chainId: torusEvmChainId });
  const { data: _torusEvmBalance, refetch: _refetchTorusEvmBalance } =
    useBalance({
      address: evmAddress,
      chainId: torusEvmChainId,
    });

  // Query Base TORUS ERC20 token balance
  const baseTorusAddress =
    contractAddresses.base[env("NEXT_PUBLIC_TORUS_CHAIN_ENV")].torusErc20;

  const { data: baseBalance, refetch: _refetchBaseBalance } = useReadContract({
    chainId: BASE_CHAIN_ID,
    address: baseTorusAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: evmAddress ? [evmAddress] : undefined,
    query: {
      enabled: Boolean(evmAddress),
    },
  });

  const { data: _nativeEthBalance, refetch: _refetchNativeEthBalance } =
    useBalance({
      address: evmAddress,
      chainId: torusEvmChainId,
      // Omit token parameter to query native ETH balance
    });

  const refetchTorusEvmBalance = useCallback(async (): Promise<{
    status: string;
    data?: { value: bigint };
  }> => {
    const result = await _refetchTorusEvmBalance();
    return result as { status: string; data?: { value: bigint } };
  }, [_refetchTorusEvmBalance]);

  const refetchBaseBalance = useCallback(async (): Promise<{
    status: string;
    data?: { value: bigint };
  }> => {
    const result = await _refetchBaseBalance();
    // useReadContract returns bigint directly, not { value: bigint }
    return {
      status: result.status,
      data: result.data !== undefined ? { value: result.data } : undefined,
    };
  }, [_refetchBaseBalance]);

  const nativeBalanceQuery = useFreeBalance(
    api,
    selectedAccount?.address as SS58Address,
  );

  const refetchNativeBalance = useCallback(async (): Promise<{
    status: string;
    data?: { value: bigint };
  }> => {
    const result = await nativeBalanceQuery.refetch();
    return {
      status: result.status,
      data: result.data ? { value: result.data } : undefined,
    };
  }, [nativeBalanceQuery]);

  const _nativeBalance = useMemo(
    () =>
      nativeBalanceQuery.data ? { value: nativeBalanceQuery.data } : undefined,
    [nativeBalanceQuery.data],
  );

  const _baseBalanceWrapped = useMemo(
    () => (baseBalance !== undefined ? { value: baseBalance } : undefined),
    [baseBalance],
  );

  const executeBaseToNative = useCallback(
    async (amount: string) => {
      if (!selectedAccount || !evmAddress || !walletClient || !chain) {
        throw new Error("Wallets not properly connected");
      }

      // Execute step 1 - create history entry when transaction enters confirming state
      const [step1Error, _] = await tryAsync(
        executeBaseToNativeStep1({
          amount,
          evmAddress,
          chain,
          switchChain: switchChainAsync,
          triggerHyperlaneTransfer,
          warpCore,
          refetchTorusEvmBalance,
          refetchBaseBalance,
          updateBridgeState,
          addTransaction,
          getExplorerUrl,
          onTransactionConfirming: (txHash, baselineBalance) => {
            // Check if we're retrying an existing transaction
            if (currentTransactionIdRef.current) {
              // Update existing history entry (retry case)
              updateHistoryTransaction(currentTransactionIdRef.current, {
                status: "pending",
                currentStep: SimpleBridgeStep.STEP_1_CONFIRMING,
                step1TxHash: txHash,
                step1BaselineBalance: baselineBalance.toString(),
                errorMessage: undefined,
                errorStep: undefined,
              });
            } else {
              // Create new history entry when transaction is signed and submitted
              const newTransactionId = addToHistory({
                direction: "base-to-native",
                amount,
                status: "pending",
                currentStep: SimpleBridgeStep.STEP_1_CONFIRMING,
                step1TxHash: txHash,
                baseAddress: evmAddress,
                nativeAddress: selectedAccount.address,
                canRetry: true,
                step1BaselineBalance: baselineBalance.toString(),
              });
              currentTransactionIdRef.current = newTransactionId;

              // Notify that transaction was created (for URL update / F5 recovery)
              onTransactionCreatedRef.current?.(newTransactionId);
            }
          },
        }),
      );

      if (step1Error !== undefined) {
        // If user rejected in step 1, nothing was signed so no history entry exists
        if (step1Error instanceof UserRejectedError) {
          updateBridgeState({
            step: SimpleBridgeStep.ERROR,
            errorMessage: "Transaction cancelled by user",
          });
          return;
        }
        // If we have a transaction ID, update history with error
        if (currentTransactionIdRef.current) {
          updateHistoryTransaction(currentTransactionIdRef.current, {
            status: "error",
            currentStep: SimpleBridgeStep.ERROR,
            errorMessage: step1Error.message,
            errorStep: 1,
            canRetry: true,
          });
        }
        throw step1Error;
      }

      // Update history to step 2 preparing
      if (currentTransactionIdRef.current) {
        const step1Tx = transactions.find((tx) => tx.step === 1);
        updateHistoryTransaction(currentTransactionIdRef.current, {
          status: "pending",
          currentStep: SimpleBridgeStep.STEP_2_PREPARING,
          step1TxHash: step1Tx?.txHash,
        });
      }

      // Execute step 2 with progress tracking
      const [step2Error, __] = await tryAsync(
        executeBaseToNativeStep2({
          amount,
          selectedAccount: { address: selectedAccount.address as SS58Address },
          walletClient,
          chain,
          torusEvmChainId,
          switchChain: switchChainAsync,
          refetchTorusEvmBalance,
          refetchNativeBalance,
          wagmiConfig,
          updateBridgeState,
          addTransaction,
          getExplorerUrl,
          onStepProgress: (step) => {
            if (currentTransactionIdRef.current) {
              updateHistoryTransaction(currentTransactionIdRef.current, {
                currentStep: step,
              });
            }
          },
          onStep2Confirming: (txHash, baselineBalance) => {
            if (currentTransactionIdRef.current) {
              updateHistoryTransaction(currentTransactionIdRef.current, {
                step2TxHash: txHash,
                step2BaselineBalance: baselineBalance.toString(),
              });
            }
          },
        }),
      );

      if (step2Error !== undefined) {
        // Update history on error
        if (currentTransactionIdRef.current) {
          const step2Tx = transactions.find((tx) => tx.step === 2);
          updateHistoryTransaction(currentTransactionIdRef.current, {
            status: "error",
            currentStep: SimpleBridgeStep.ERROR,
            errorMessage: step2Error.message,
            errorStep: 2,
            step2TxHash: step2Tx?.txHash,
            canRetry: true,
          });
        }
        // Stop execution if user rejected the transaction
        if (step2Error instanceof UserRejectedError) {
          updateBridgeState({
            step: SimpleBridgeStep.ERROR,
            errorMessage: "Transaction cancelled by user",
          });
          return;
        }
        throw step2Error;
      }

      // Update history after step 2 complete
      if (currentTransactionIdRef.current) {
        const step2Tx = transactions.find((tx) => tx.step === 2);
        updateHistoryTransaction(currentTransactionIdRef.current, {
          status: "completed",
          currentStep: SimpleBridgeStep.COMPLETE,
          step2TxHash: step2Tx?.txHash,
          canRetry: false,
          errorMessage: undefined,
          errorStep: undefined,
        });
      }

      toast({
        title: "Transfer Complete!",
        description: "Successfully transferred Base TORUS to Torus",
      });
    },
    [
      selectedAccount,
      evmAddress,
      walletClient,
      chain,
      warpCore,
      triggerHyperlaneTransfer,
      refetchTorusEvmBalance,
      refetchNativeBalance,
      refetchBaseBalance,
      wagmiConfig,
      updateBridgeState,
      addTransaction,
      getExplorerUrl,
      toast,
      switchChainAsync,
      torusEvmChainId,
      transactions,
      updateHistoryTransaction,
      addToHistory,
    ],
  );

  const executeNativeToBase = useCallback(
    async (amount: string) => {
      if (!selectedAccount || !evmAddress || !api || !walletClient) {
        throw new Error("Wallets not properly connected");
      }

      // Execute step 1 - create history entry when transaction enters confirming state
      const [step1Error, _] = await tryAsync(
        executeNativeToBaseStep1({
          amount,
          evmAddress,
          selectedAccount: { address: selectedAccount.address as SS58Address },
          api,
          sendTx,
          refetchTorusEvmBalance,
          refetchNativeBalance,
          updateBridgeState,
          addTransaction,
          getExplorerUrl,
          onTransactionConfirming: (txHash, baselineBalance) => {
            // Check if we're retrying an existing transaction
            if (currentTransactionIdRef.current) {
              // Update existing history entry (retry case)
              updateHistoryTransaction(currentTransactionIdRef.current, {
                status: "pending",
                currentStep: SimpleBridgeStep.STEP_1_CONFIRMING,
                step1TxHash: txHash,
                step1BaselineBalance: baselineBalance.toString(),
                errorMessage: undefined,
                errorStep: undefined,
              });
            } else {
              // Create new history entry when transaction is signed and submitted
              const newTransactionId = addToHistory({
                direction: "native-to-base",
                amount,
                status: "pending",
                currentStep: SimpleBridgeStep.STEP_1_CONFIRMING,
                step1TxHash: txHash,
                baseAddress: evmAddress,
                nativeAddress: selectedAccount.address,
                canRetry: true,
                step1BaselineBalance: baselineBalance.toString(),
              });
              currentTransactionIdRef.current = newTransactionId;

              // Notify that transaction was created (for URL update / F5 recovery)
              onTransactionCreatedRef.current?.(newTransactionId);
            }
          },
        }),
      );

      if (step1Error !== undefined) {
        // If user rejected in step 1, nothing was signed so no history entry exists
        if (step1Error instanceof UserRejectedError) {
          updateBridgeState({
            step: SimpleBridgeStep.ERROR,
            errorMessage: "Transaction cancelled by user",
          });
          return;
        }
        // If we have a transaction ID, update history with error
        if (currentTransactionIdRef.current) {
          updateHistoryTransaction(currentTransactionIdRef.current, {
            status: "error",
            currentStep: SimpleBridgeStep.ERROR,
            errorMessage: step1Error.message,
            errorStep: 1,
            canRetry: true,
          });
        }
        throw step1Error;
      }

      // Update history to step 2 preparing
      if (currentTransactionIdRef.current) {
        const step1Tx = transactions.find((tx) => tx.step === 1);
        updateHistoryTransaction(currentTransactionIdRef.current, {
          status: "pending",
          currentStep: SimpleBridgeStep.STEP_2_PREPARING,
          step1TxHash: step1Tx?.txHash,
        });
      }

      // Execute step 2 with progress tracking
      const [step2Error, __] = await tryAsync(
        executeNativeToBaseStep2({
          amount,
          evmAddress,
          torusEvmChainId,
          chainId: chain?.id,
          walletClient,
          switchChain: switchChainAsync,
          triggerHyperlaneTransfer,
          warpCore,
          accounts,
          refetchBaseBalance,
          refetchTorusEvmBalance,
          updateBridgeState,
          addTransaction,
          getExplorerUrl,
          onStepProgress: (step) => {
            if (currentTransactionIdRef.current) {
              updateHistoryTransaction(currentTransactionIdRef.current, {
                currentStep: step,
              });
            }
          },
          onStep2Confirming: (txHash, baselineBalance) => {
            if (currentTransactionIdRef.current) {
              updateHistoryTransaction(currentTransactionIdRef.current, {
                step2TxHash: txHash,
                step2BaselineBalance: baselineBalance.toString(),
              });
            }
          },
        }),
      );

      if (step2Error !== undefined) {
        // Update history on error
        if (currentTransactionIdRef.current) {
          const step2Tx = transactions.find((tx) => tx.step === 2);
          updateHistoryTransaction(currentTransactionIdRef.current, {
            status: "error",
            currentStep: SimpleBridgeStep.ERROR,
            errorMessage: step2Error.message,
            errorStep: 2,
            step2TxHash: step2Tx?.txHash,
            canRetry: true,
          });
        }
        // Stop execution if user rejected the transaction
        if (step2Error instanceof UserRejectedError) {
          updateBridgeState({
            step: SimpleBridgeStep.ERROR,
            errorMessage: "Transaction cancelled by user",
          });
          return;
        }
        throw step2Error;
      }

      // Update history after step 2 complete
      if (currentTransactionIdRef.current) {
        const step2Tx = transactions.find((tx) => tx.step === 2);
        updateHistoryTransaction(currentTransactionIdRef.current, {
          status: "completed",
          currentStep: SimpleBridgeStep.COMPLETE,
          step2TxHash: step2Tx?.txHash,
          canRetry: false,
          errorMessage: undefined,
          errorStep: undefined,
        });
      }

      toast({
        title: "Transfer Complete!",
        description: "Successfully transferred Torus to Base TORUS",
      });
    },
    [
      selectedAccount,
      evmAddress,
      api,
      walletClient,
      sendTx,
      triggerHyperlaneTransfer,
      refetchTorusEvmBalance,
      refetchNativeBalance,
      updateBridgeState,
      addTransaction,
      toast,
      refetchBaseBalance,
      switchChainAsync,
      chain?.id,
      getExplorerUrl,
      torusEvmChainId,
      warpCore,
      accounts,
      transactions,
      updateHistoryTransaction,
      addToHistory,
    ],
  );

  const retryBaseToNativeStep2 = useCallback(
    async (amount: string) => {
      if (!evmAddress || !walletClient || !chain) {
        throw new Error("EVM wallet not connected");
      }
      if (!selectedAccount) {
        throw new Error(
          "Torus wallet not connected. Required for destination address.",
        );
      }

      setTransactions((prev) =>
        prev.map((tx) =>
          tx.step === 2
            ? {
                ...tx,
                status: "STARTING" as const,
                message: "Retrying withdrawal...",
              }
            : tx,
        ),
      );

      await executeBaseToNativeStep2({
        amount,
        selectedAccount: { address: selectedAccount.address as SS58Address },
        walletClient,
        chain,
        torusEvmChainId,
        switchChain: switchChainAsync,
        refetchTorusEvmBalance,
        refetchNativeBalance,
        wagmiConfig,
        updateBridgeState,
        addTransaction,
        getExplorerUrl,
      });

      // Update history after step 2 complete (for retry)
      if (currentTransactionIdRef.current) {
        const step2Tx = transactions.find((tx) => tx.step === 2);
        updateHistoryTransaction(currentTransactionIdRef.current, {
          status: "completed",
          currentStep: SimpleBridgeStep.COMPLETE,
          step2TxHash: step2Tx?.txHash,
          canRetry: false,
          errorMessage: undefined,
          errorStep: undefined,
        });
      }

      toast({
        title: "Transfer Complete!",
        description: "Successfully transferred Base TORUS to Torus",
      });
    },
    [
      selectedAccount,
      evmAddress,
      walletClient,
      chain,
      refetchTorusEvmBalance,
      refetchNativeBalance,
      wagmiConfig,
      updateBridgeState,
      addTransaction,
      getExplorerUrl,
      toast,
      torusEvmChainId,
      switchChainAsync,
      setTransactions,
      transactions,
      updateHistoryTransaction,
    ],
  );

  const retryNativeToBaseStep2 = useCallback(
    async (amount: string) => {
      if (!evmAddress || !walletClient) {
        throw new Error("EVM wallet not properly connected");
      }

      setTransactions((prev) =>
        prev.map((tx) =>
          tx.step === 2
            ? {
                ...tx,
                status: "STARTING" as const,
                message: "Retrying transfer...",
              }
            : tx,
        ),
      );

      await executeNativeToBaseStep2({
        amount,
        evmAddress,
        torusEvmChainId,
        chainId: chain?.id,
        walletClient,
        switchChain: switchChainAsync,
        triggerHyperlaneTransfer,
        warpCore,
        accounts,
        refetchBaseBalance,
        refetchTorusEvmBalance,
        updateBridgeState,
        addTransaction,
        getExplorerUrl,
      });

      // Update history after step 2 complete (for retry)
      if (currentTransactionIdRef.current) {
        const step2Tx = transactions.find((tx) => tx.step === 2);
        updateHistoryTransaction(currentTransactionIdRef.current, {
          status: "completed",
          currentStep: SimpleBridgeStep.COMPLETE,
          step2TxHash: step2Tx?.txHash,
          canRetry: false,
          errorMessage: undefined,
          errorStep: undefined,
        });
      }

      toast({
        title: "Transfer Complete!",
        description: "Successfully transferred Torus to Base TORUS",
      });
    },
    [
      evmAddress,
      walletClient,
      triggerHyperlaneTransfer,
      refetchTorusEvmBalance,
      updateBridgeState,
      addTransaction,
      toast,
      torusEvmChainId,
      chain?.id,
      switchChainAsync,
      refetchBaseBalance,
      getExplorerUrl,
      setTransactions,
      warpCore,
      accounts,
      transactions,
      updateHistoryTransaction,
    ],
  );

  const executeTransfer = useCallback(
    async (
      direction: SimpleBridgeDirection,
      amount: string,
      onTransactionCreated?: (txId: string) => void,
    ) => {
      updateBridgeState({
        step: SimpleBridgeStep.IDLE,
        direction,
        amount,
        errorMessage: undefined,
      });
      setTransactions([]);

      // Reset transaction ID - will be set after step 1 completes
      currentTransactionIdRef.current = null;

      // Store callback for URL update after step 1 completes
      onTransactionCreatedRef.current = onTransactionCreated ?? null;

      try {
        if (direction === "base-to-native") {
          await executeBaseToNative(amount);
        } else {
          await executeNativeToBase(amount);
        }
      } catch (error) {
        // Check if the error was already handled by the individual flow
        // by seeing if a transaction entry exists (meaning the flow progressed).
        // The ref is modified by onTransactionConfirming callback during the await above.
        const transactionId = currentTransactionIdRef.current as string | null;
        const hasTransactionEntry = transactionId !== null;

        if (!hasTransactionEntry) {
          // Error happened before any transaction was created
          // (e.g., wallet not connected, validation failed)
          const errorMessage =
            error instanceof Error ? error.message : "Transfer failed";
          updateBridgeState({
            step: SimpleBridgeStep.ERROR,
            errorMessage,
          });
          addTransaction({
            step: 1,
            status: "ERROR",
            chainName: direction === "base-to-native" ? "Base" : "Torus",
            message: errorMessage,
          });
        }
        // If hasTransactionEntry is true, the error was already handled by the flow
        // and the history was already updated with the error details
      } finally {
        // Clear callback reference after transfer completes or fails
        onTransactionCreatedRef.current = null;
      }
    },
    [
      executeBaseToNative,
      executeNativeToBase,
      updateBridgeState,
      setTransactions,
      addTransaction,
    ],
  );

  const retryFromFailedStep = useCallback(async () => {
    if (!bridgeState.direction || !bridgeState.amount) return;

    const failedTransaction = transactions.find((tx) => tx.status === "ERROR");
    if (!failedTransaction) return;

    const { direction, amount } = bridgeState;

    try {
      // Clear error message and error details on retry start
      updateBridgeState({ errorMessage: undefined });
      clearErrorDetails();

      // Reset the failed transaction status to allow UI to show progress
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.step === failedTransaction.step
            ? { ...tx, status: "STARTING" as const, errorDetails: undefined }
            : tx,
        ),
      );

      if (failedTransaction.step === 1) {
        if (direction === "base-to-native") {
          await executeBaseToNative(amount);
        } else {
          await executeNativeToBase(amount);
        }
      } else {
        if (direction === "base-to-native") {
          await retryBaseToNativeStep2(amount);
        } else {
          await retryNativeToBaseStep2(amount);
        }
      }
    } catch (error) {
      console.error("Retry failed:", error);
      updateBridgeState({
        step: SimpleBridgeStep.ERROR,
        errorMessage: error instanceof Error ? error.message : "Retry failed",
      });
    }
  }, [
    bridgeState,
    transactions,
    executeBaseToNative,
    executeNativeToBase,
    retryBaseToNativeStep2,
    retryNativeToBaseStep2,
    updateBridgeState,
    clearErrorDetails,
    setTransactions,
  ]);

  // Wrapper for Quick Send EVM → Native
  // Note: Quick Send does not save to history as it's a one-time operation
  const executeQuickSendToNative = useCallback(
    async (amount: string) => {
      // Initialize transactions array for Step 2
      setTransactions([
        {
          step: 1 as const,
          status: "SUCCESS" as const,
          chainName: "Base",
          message: "Already on Torus EVM",
        },
        {
          step: 2 as const,
          status: null,
          chainName: "Torus EVM",
        },
      ]);

      // Initialize bridge state
      updateBridgeState({
        direction: "base-to-native",
        amount,
        step: SimpleBridgeStep.STEP_2_PREPARING,
      });

      await retryBaseToNativeStep2(amount);
    },
    [retryBaseToNativeStep2, setTransactions, updateBridgeState],
  );

  // Wrapper for Quick Send EVM → Base
  // Note: Quick Send does not save to history as it's a one-time operation
  const executeQuickSendToBase = useCallback(
    async (amount: string) => {
      // Initialize transactions array for Step 2
      setTransactions([
        {
          step: 1 as const,
          status: "SUCCESS" as const,
          chainName: "Torus",
          message: "Already on Torus EVM",
        },
        {
          step: 2 as const,
          status: null,
          chainName: "Torus EVM",
        },
      ]);

      // Initialize bridge state
      updateBridgeState({
        direction: "native-to-base",
        amount,
        step: SimpleBridgeStep.STEP_2_PREPARING,
      });

      await retryNativeToBaseStep2(amount);
    },
    [retryNativeToBaseStep2, setTransactions, updateBridgeState],
  );

  const setCurrentTransactionId = useCallback((id: string | null) => {
    currentTransactionIdRef.current = id;
  }, []);

  // Resume step 1 polling on F5 recovery when at STEP_1_CONFIRMING
  const resumeStep1Polling = useCallback(
    async (
      transaction: {
        direction: SimpleBridgeDirection;
        amount: string;
        step1BaselineBalance?: string;
      },
      onComplete: () => void,
      onError: (error: Error) => void,
    ) => {
      const { direction, amount, step1BaselineBalance } = transaction;

      // Parse baseline balance from history (stored as string)
      const baselineBalance = step1BaselineBalance
        ? BigInt(step1BaselineBalance)
        : 0n;
      const expectedIncrease = toNano(amount.trim());

      if (direction === "base-to-native") {
        // Polling for Torus EVM balance (destination for base-to-native step 1)
        const pollingResult = await pollEvmBalance(
          refetchTorusEvmBalance,
          baselineBalance,
          expectedIncrease,
          "Base → Torus EVM (F5 recovery)",
        );

        if (!pollingResult.success) {
          onError(
            new Error(
              pollingResult.errorMessage ?? "Transfer confirmation failed",
            ),
          );
          return;
        }

        // Refetch Base balance to reflect the debit
        await refetchBaseBalance();

        updateBridgeState({ step: SimpleBridgeStep.STEP_1_COMPLETE });
        addTransaction({
          step: 1,
          status: "SUCCESS",
          chainName: "Base",
          message: "Transfer complete (F5 recovery)",
        });

        // Update history to step1_complete
        if (currentTransactionIdRef.current) {
          updateHistoryTransaction(currentTransactionIdRef.current, {
            status: "step1_complete",
            currentStep: SimpleBridgeStep.STEP_1_COMPLETE,
          });
        }

        onComplete();
      } else {
        // Polling for Torus EVM balance (destination for native-to-base step 1)
        const pollingResult = await pollEvmBalance(
          refetchTorusEvmBalance,
          baselineBalance,
          expectedIncrease,
          "Native → Torus EVM (F5 recovery)",
        );

        if (!pollingResult.success) {
          onError(
            new Error(
              pollingResult.errorMessage ?? "Transfer confirmation failed",
            ),
          );
          return;
        }

        // Refetch Native balance to reflect the debit
        await refetchNativeBalance();

        updateBridgeState({ step: SimpleBridgeStep.STEP_1_COMPLETE });
        addTransaction({
          step: 1,
          status: "SUCCESS",
          chainName: "Torus",
          message: "Bridge complete (F5 recovery)",
        });

        // Update history to step1_complete
        if (currentTransactionIdRef.current) {
          updateHistoryTransaction(currentTransactionIdRef.current, {
            status: "step1_complete",
            currentStep: SimpleBridgeStep.STEP_1_COMPLETE,
          });
        }

        onComplete();
      }
    },
    [
      refetchTorusEvmBalance,
      refetchBaseBalance,
      refetchNativeBalance,
      updateBridgeState,
      addTransaction,
      updateHistoryTransaction,
    ],
  );

  // Resume step 2 polling on F5 recovery when at STEP_2_CONFIRMING
  const resumeStep2Polling = useCallback(
    async (
      transaction: {
        direction: SimpleBridgeDirection;
        amount: string;
        step2BaselineBalance?: string;
        step2TxHash?: string;
      },
      onComplete: () => void,
      onError: (error: Error) => void,
    ) => {
      const { direction, amount, step2BaselineBalance, step2TxHash } =
        transaction;

      // Parse baseline balance from history (stored as string)
      const baselineBalance = step2BaselineBalance
        ? BigInt(step2BaselineBalance)
        : 0n;
      const expectedIncrease = toNano(amount.trim());

      if (direction === "base-to-native") {
        // Step 2 of base-to-native: Torus EVM → Native
        // Polling for Native balance (destination for step 2)
        const pollingResult = await pollEvmBalance(
          refetchNativeBalance,
          baselineBalance,
          expectedIncrease,
          "Torus EVM → Native (F5 recovery)",
        );

        if (!pollingResult.success) {
          onError(
            new Error(
              pollingResult.errorMessage ?? "Withdrawal confirmation failed",
            ),
          );
          return;
        }

        // Refetch Torus EVM balance to reflect the debit
        await refetchTorusEvmBalance();

        updateBridgeState({ step: SimpleBridgeStep.COMPLETE });
        addTransaction({
          step: 2,
          status: "SUCCESS",
          chainName: "Torus",
          message: "Withdrawal complete (F5 recovery)",
          txHash: step2TxHash,
          explorerUrl: step2TxHash
            ? getExplorerUrl(step2TxHash, "Torus")
            : undefined,
        });

        // Update history to completed
        if (currentTransactionIdRef.current) {
          updateHistoryTransaction(currentTransactionIdRef.current, {
            status: "completed",
            currentStep: SimpleBridgeStep.COMPLETE,
            canRetry: false,
          });
        }

        toast({
          title: "Transfer Complete!",
          description:
            "Successfully transferred Base TORUS to Torus (recovered)",
        });

        onComplete();
      } else {
        // Step 2 of native-to-base: Torus EVM → Base
        // Polling for Base balance (destination for step 2)
        // Use anyChange mode because fees make exact amount unpredictable
        const pollingResult = await pollEvmBalance(
          refetchBaseBalance,
          baselineBalance,
          expectedIncrease,
          "Torus EVM → Base (F5 recovery)",
          true, // anyChange = true
        );

        if (!pollingResult.success) {
          onError(
            new Error(
              pollingResult.errorMessage ?? "Transfer confirmation failed",
            ),
          );
          return;
        }

        // Refetch Torus EVM balance to reflect the debit
        await refetchTorusEvmBalance();

        updateBridgeState({ step: SimpleBridgeStep.COMPLETE });
        addTransaction({
          step: 2,
          status: "SUCCESS",
          chainName: "Base",
          message: "Transfer complete (F5 recovery)",
          txHash: step2TxHash,
          explorerUrl: step2TxHash
            ? getExplorerUrl(step2TxHash, "Base")
            : undefined,
        });

        // Update history to completed
        if (currentTransactionIdRef.current) {
          updateHistoryTransaction(currentTransactionIdRef.current, {
            status: "completed",
            currentStep: SimpleBridgeStep.COMPLETE,
            canRetry: false,
          });
        }

        toast({
          title: "Transfer Complete!",
          description:
            "Successfully transferred Torus to Base TORUS (recovered)",
        });

        onComplete();
      }
    },
    [
      refetchTorusEvmBalance,
      refetchBaseBalance,
      refetchNativeBalance,
      updateBridgeState,
      addTransaction,
      updateHistoryTransaction,
      getExplorerUrl,
      toast,
    ],
  );

  return {
    bridgeState,
    transactions,
    executeTransfer,
    resetTransfer,
    retryFromFailedStep,
    getExplorerUrl,
    setTransactions,
    updateBridgeState,
    setCurrentTransactionId,
    isTransferInProgress:
      bridgeState.step !== SimpleBridgeStep.IDLE &&
      bridgeState.step !== SimpleBridgeStep.COMPLETE &&
      bridgeState.step !== SimpleBridgeStep.ERROR,
    // Expose Step 2 functions for Quick Send from EVM
    executeEvmToNative: executeQuickSendToNative,
    executeEvmToBase: executeQuickSendToBase,
    // Expose for F5 recovery
    resumeStep1Polling,
    resumeStep2Polling,
  };
}
