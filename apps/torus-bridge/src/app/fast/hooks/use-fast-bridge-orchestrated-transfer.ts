"use client";

import { useAccounts } from "@hyperlane-xyz/widgets";
import type { SS58Address } from "@torus-network/sdk/types";
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
    deleteTransaction: deleteHistoryTransaction,
  } = useFastBridgeTransactionHistory();

  const currentTransactionIdRef = useRef<string | null>(null);

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
  const { data: torusEvmBalance, refetch: _refetchTorusEvmBalance } =
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

  const nativeBalance = useMemo(
    () =>
      nativeBalanceQuery.data ? { value: nativeBalanceQuery.data } : undefined,
    [nativeBalanceQuery.data],
  );

  const baseBalanceWrapped = useMemo(
    () => (baseBalance !== undefined ? { value: baseBalance } : undefined),
    [baseBalance],
  );

  const executeBaseToNative = useCallback(
    async (amount: string) => {
      if (!selectedAccount || !evmAddress || !walletClient || !chain) {
        throw new Error("Wallets not properly connected");
      }

      // Execute step 1
      const [step1Error, _] = await tryAsync(
        executeBaseToNativeStep1({
          amount,
          evmAddress,
          chain,
          switchChain: switchChainAsync,
          triggerHyperlaneTransfer,
          warpCore,
          refetchTorusEvmBalance,
          torusEvmBalance,
          refetchBaseBalance,
          updateBridgeState,
          addTransaction,
          getExplorerUrl,
        }),
      );

      if (step1Error !== undefined) {
        // If user rejected in step 1, delete the history entry (they never signed)
        if (step1Error instanceof UserRejectedError) {
          if (currentTransactionIdRef.current) {
            deleteHistoryTransaction(currentTransactionIdRef.current);
            currentTransactionIdRef.current = null;
          }
          updateBridgeState({
            step: SimpleBridgeStep.ERROR,
            errorMessage: "Transaction cancelled by user",
          });
          return;
        }

        // Update history on other errors (after user signed but something failed)
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

      // Update history after step 1 complete
      if (currentTransactionIdRef.current) {
        const step1Tx = transactions.find((tx) => tx.step === 1);
        updateHistoryTransaction(currentTransactionIdRef.current, {
          status: "step1_complete",
          currentStep: SimpleBridgeStep.STEP_2_PREPARING,
          step1TxHash: step1Tx?.txHash,
        });
      }

      // Execute step 2
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
          nativeBalance,
          wagmiConfig,
          updateBridgeState,
          addTransaction,
          getExplorerUrl,
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
        description: "Successfully transferred Base TORUS to Native TORUS",
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
      nativeBalance,
      wagmiConfig,
      updateBridgeState,
      addTransaction,
      getExplorerUrl,
      toast,
      torusEvmBalance,
      switchChainAsync,
      torusEvmChainId,
      transactions,
      updateHistoryTransaction,
      deleteHistoryTransaction,
    ],
  );

  const executeNativeToBase = useCallback(
    async (amount: string) => {
      if (!selectedAccount || !evmAddress || !api || !walletClient) {
        throw new Error("Wallets not properly connected");
      }

      // Execute step 1
      const [step1Error, _] = await tryAsync(
        executeNativeToBaseStep1({
          amount,
          evmAddress,
          selectedAccount: { address: selectedAccount.address as SS58Address },
          api,
          sendTx,
          refetchTorusEvmBalance,
          torusEvmBalance,
          refetchNativeBalance,
          updateBridgeState,
          addTransaction,
          getExplorerUrl,
        }),
      );

      if (step1Error !== undefined) {
        // If user rejected in step 1, delete the history entry (they never signed)
        if (step1Error instanceof UserRejectedError) {
          if (currentTransactionIdRef.current) {
            deleteHistoryTransaction(currentTransactionIdRef.current);
            currentTransactionIdRef.current = null;
          }
          updateBridgeState({
            step: SimpleBridgeStep.ERROR,
            errorMessage: "Transaction cancelled by user",
          });
          return;
        }

        // Update history on other errors (after user signed but something failed)
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

      // Update history after step 1 complete
      if (currentTransactionIdRef.current) {
        const step1Tx = transactions.find((tx) => tx.step === 1);
        updateHistoryTransaction(currentTransactionIdRef.current, {
          status: "step1_complete",
          currentStep: SimpleBridgeStep.STEP_2_PREPARING,
          step1TxHash: step1Tx?.txHash,
        });
      }

      // Execute step 2
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
          baseBalance: baseBalanceWrapped,
          refetchTorusEvmBalance,
          updateBridgeState,
          addTransaction,
          getExplorerUrl,
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
        description: "Successfully transferred Native TORUS to Base TORUS",
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
      torusEvmBalance,
      updateBridgeState,
      addTransaction,
      toast,
      baseBalanceWrapped,
      refetchBaseBalance,
      switchChainAsync,
      chain?.id,
      getExplorerUrl,
      torusEvmChainId,
      warpCore,
      accounts,
      transactions,
      updateHistoryTransaction,
      deleteHistoryTransaction,
    ],
  );

  const retryBaseToNativeStep2 = useCallback(
    async (amount: string) => {
      if (!selectedAccount || !evmAddress || !walletClient || !chain) {
        throw new Error("Wallets not properly connected");
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
        nativeBalance,
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
        description: "Successfully transferred Base TORUS to Native TORUS",
      });
    },
    [
      selectedAccount,
      evmAddress,
      walletClient,
      chain,
      refetchTorusEvmBalance,
      refetchNativeBalance,
      nativeBalance,
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
        baseBalance: baseBalanceWrapped,
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
        description: "Successfully transferred Native TORUS to Base TORUS",
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
      baseBalanceWrapped,
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

      // Create history entry
      const historyId = addToHistory({
        direction,
        amount,
        status: "pending",
        currentStep: SimpleBridgeStep.STEP_1_PREPARING,
        canRetry: false,
        baseAddress: evmAddress,
        nativeAddress: selectedAccount?.address,
      });
      currentTransactionIdRef.current = historyId;

      // Set URL state immediately after creating history entry (for F5 recovery)
      onTransactionCreated?.(historyId);

      try {
        if (direction === "base-to-native") {
          await executeBaseToNative(amount);
        } else {
          await executeNativeToBase(amount);
        }
      } catch {
        // Error handling is done in individual flows
        // Just ensure we keep the transaction ID for retry
      }
    },
    [
      executeBaseToNative,
      executeNativeToBase,
      updateBridgeState,
      setTransactions,
      addToHistory,
      evmAddress,
      selectedAccount?.address,
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
          chainName: "Torus Native",
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

  const setCurrentTransactionId = useCallback((id: string) => {
    currentTransactionIdRef.current = id;
  }, []);

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
  };
}
