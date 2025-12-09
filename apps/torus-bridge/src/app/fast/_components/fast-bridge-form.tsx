"use client";

import type { SS58Address } from "@torus-network/sdk/types";
import { formatToken } from "@torus-network/torus-utils/torus/token";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import {
  useFreeBalance,
  useGetTorusPrice,
} from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { TorusToUSD } from "@torus-ts/ui/components/apr/torus-to-usd";
import { Badge } from "@torus-ts/ui/components/badge";
import { Button } from "@torus-ts/ui/components/button";
import { Card, CardContent } from "@torus-ts/ui/components/card";
import { Input, InputReadonly } from "@torus-ts/ui/components/input";
import { Label } from "@torus-ts/ui/components/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { contractAddresses, getChainValuesOnEnv } from "~/config";
import { env } from "~/env";
import { ArrowLeftRight, History, Info, Zap } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { erc20Abi } from "viem";
import { useBalance, useReadContract } from "wagmi";
import { useDualWallet } from "../hooks/use-fast-bridge-dual-wallet";
import { useOrchestratedTransfer } from "../hooks/use-fast-bridge-orchestrated-transfer";
import { useFastBridgeTransactionHistory } from "../hooks/use-fast-bridge-transaction-history";
import { useFastBridgeTransactionUrlState } from "../hooks/use-fast-bridge-transaction-url-state";
import { DualWalletConnector } from "./fast-bridge-dual-wallet-connector";
import { FractionButtons } from "./fast-bridge-fraction-buttons";
import { PendingTransactionDialog } from "./fast-bridge-pending-transaction-dialog";
import { QuickSendEvmDialog } from "./fast-bridge-quick-send-evm-dialog";
import { TransactionHistoryDialog } from "./fast-bridge-transaction-history-dialog";
import { TransactionLifecycleDialog } from "./fast-bridge-transaction-lifecycle-dialog";
import type {
  FastBridgeTransactionHistoryItem,
  SimpleBridgeDirection,
  SimpleBridgeTransaction,
} from "./fast-bridge-types";
import { SimpleBridgeStep } from "./fast-bridge-types";

const BASE_GAS_RESERVE = 10n ** 16n; // 0.01 ETH
const NATIVE_GAS_RESERVE = 10n ** 18n; // 1 TORUS
const TORUS_EVM_GAS_RESERVE = 10n ** 16n; // 0.01 TORUS for gas fees (aligned with standard bridge)
const TORUS_EVM_MIN_BALANCE = 2n * 10n ** 16n; // 0.02 TORUS minimum for Quick Send (gas + dust)

function formatWeiToDecimalString(amount: bigint, decimals = 18): string {
  const amountStr = amount.toString();
  if (amountStr === "0") return "0";

  // Pad with leading zeros if needed to reach decimal places
  const paddedAmount = amountStr.padStart(decimals + 1, "0");
  const integerPart = paddedAmount.slice(0, -decimals) || "0";
  const fractionalPart = paddedAmount.slice(-decimals).replace(/0+$/, "");

  if (fractionalPart) {
    return `${integerPart}.${fractionalPart}`;
  }
  return integerPart;
}

function parseDecimalToBigInt(amountStr: string): bigint {
  if (!amountStr || amountStr.trim() === "") return 0n;

  const trimmed = amountStr.trim().replace(/^\+/, "");
  if (!/^\d*\.?\d*$/.test(trimmed)) return 0n;

  const [whole = "0", fraction = ""] = trimmed.split(".");
  const paddedFraction = fraction.padEnd(18, "0").slice(0, 18);
  const combined = whole + paddedFraction;

  return BigInt(combined);
}

export function FastBridgeForm() {
  const [direction, setDirection] =
    useState<SimpleBridgeDirection>("base-to-native");
  const [amountFrom, setAmountFrom] = useState<string>("");
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showQuickSendDialog, setShowQuickSendDialog] = useState(false);
  const [showPendingDialog, setShowPendingDialog] = useState(false);
  const [pendingActionCallback, setPendingActionCallback] = useState<
    (() => void) | null
  >(null);

  const { toast } = useToast();
  const { areWalletsReady, connectionState, chainIds } = useDualWallet();
  const {
    bridgeState,
    transactions,
    executeTransfer,
    resetTransfer: _resetTransfer,
    retryFromFailedStep,
    isTransferInProgress,
    getExplorerUrl,
    setTransactions,
    updateBridgeState,
    setCurrentTransactionId,
    executeEvmToNative,
    executeEvmToBase,
    resumeStep1Polling,
    resumeStep2Polling,
  } = useOrchestratedTransfer();

  const {
    getTransactionById,
    getTransactions,
    getPendingTransaction,
    deleteTransaction,
    markFailedAsRecoveredViaEvmRecover,
  } = useFastBridgeTransactionHistory();
  const errorCount = getTransactions().filter(
    (tx) => tx.status === "error",
  ).length;
  const pendingTransaction = getPendingTransaction();

  const {
    setTransactionInUrl,
    getTransactionFromUrl,
    clearTransactionFromUrl,
  } = useFastBridgeTransactionUrlState();

  const { selectedAccount, api } = useTorus();
  const nativeBalanceQuery = useFreeBalance(
    api,
    selectedAccount?.address as SS58Address,
  );
  const nativeBalance = nativeBalanceQuery;

  const { data: usdPrice } = useGetTorusPrice();

  const baseTorusAddress =
    contractAddresses.base[env("NEXT_PUBLIC_TORUS_CHAIN_ENV")].torusErc20;

  const evmAddress = connectionState.evmWallet.address as
    | `0x${string}`
    | undefined;

  const baseBalanceQuery = useReadContract({
    chainId: chainIds.base,
    address: baseTorusAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: evmAddress ? [evmAddress] : undefined,
    query: {
      enabled: Boolean(evmAddress),
    },
  });
  const { data: baseBalance } = baseBalanceQuery;

  const getChainValues = getChainValuesOnEnv(
    env("NEXT_PUBLIC_TORUS_CHAIN_ENV"),
  );
  const { chainId: torusEvmChainId } = getChainValues("torus");

  const torusEvmBalanceQuery = useBalance({
    address: evmAddress,
    chainId: torusEvmChainId,
  });
  const { data: torusEvmBalance } = torusEvmBalanceQuery;

  const walletsReady = areWalletsReady(direction);

  const refetchAllBalances = useCallback(async () => {
    await Promise.all([
      nativeBalanceQuery.refetch(),
      baseBalanceQuery.refetch(),
      torusEvmBalanceQuery.refetch(),
    ]);
  }, [nativeBalanceQuery, baseBalanceQuery, torusEvmBalanceQuery]);

  const toggleDirection = useCallback(() => {
    if (isTransferInProgress) return;

    setDirection((prev) =>
      prev === "base-to-native" ? "native-to-base" : "base-to-native",
    );
    setAmountFrom("");
  }, [isTransferInProgress]);

  const handleFractionClick = useCallback(
    (fraction: number) => {
      if (direction === "base-to-native" && baseBalance) {
        const maxAmount =
          baseBalance > BASE_GAS_RESERVE ? baseBalance - BASE_GAS_RESERVE : 0n;
        const fractionNumerator = BigInt(Math.floor(fraction * 1_000_000));
        const fractionAmount = (maxAmount * fractionNumerator) / 1_000_000n;
        setAmountFrom(formatWeiToDecimalString(fractionAmount));
      } else if (direction === "native-to-base" && nativeBalance.data) {
        const maxAmount =
          nativeBalance.data > NATIVE_GAS_RESERVE
            ? nativeBalance.data - NATIVE_GAS_RESERVE
            : 0n;
        const fractionNumerator = BigInt(Math.floor(fraction * 1_000_000));
        const fractionAmount = (maxAmount * fractionNumerator) / 1_000_000n;
        setAmountFrom(formatWeiToDecimalString(fractionAmount));
      }
    },
    [direction, baseBalance, nativeBalance.data],
  );

  const handleMaxClick = useCallback(() => {
    handleFractionClick(1.0); // All = 100%
  }, [handleFractionClick]);

  // EVM Recover only requires EVM wallet connection (not Torus Native)
  const isEvmWalletReady = connectionState.evmWallet.isConnected;

  const handleSendToNative = useCallback(
    async (amount: bigint) => {
      // EVM Recover only needs EVM wallet connected
      if (!isEvmWalletReady) {
        throw new Error("EVM wallet not connected");
      }

      if (amount <= TORUS_EVM_GAS_RESERVE) {
        throw new Error("Insufficient balance for gas fees");
      }

      // EVM to Native: Gas is paid in TORUS (native token of Torus EVM chain)
      // Reserve gas fees before sending
      const amountToSend = amount - TORUS_EVM_GAS_RESERVE;
      const amountStr = formatWeiToDecimalString(amountToSend);

      // Quick Send from EVM to Native: Execute only Step 2 of base-to-native flow
      // This withdraws directly from Torus EVM to Native
      await executeEvmToNative(amountStr);
    },
    [isEvmWalletReady, executeEvmToNative],
  );

  const handleSendToBase = useCallback(
    async (amount: bigint) => {
      // EVM Recover only needs EVM wallet connected
      if (!isEvmWalletReady) {
        throw new Error("EVM wallet not connected");
      }

      if (amount <= TORUS_EVM_GAS_RESERVE) {
        throw new Error("Insufficient balance for gas fees");
      }

      // Subtract gas reserve from the amount to send
      const amountToSend = amount - TORUS_EVM_GAS_RESERVE;
      const amountStr = formatWeiToDecimalString(amountToSend);

      // Quick Send from EVM to Base: Execute only Step 2 of native-to-base flow
      // This deposits from Torus EVM to Base
      await executeEvmToBase(amountStr);
    },
    [isEvmWalletReady, executeEvmToBase],
  );

  const startNewTransfer = useCallback(async () => {
    // Guard against concurrent transfers - prevents double-click issues
    if (!amountFrom || !walletsReady || isTransferInProgress) return;

    // Reset any previous state before starting new transfer
    clearTransactionFromUrl();
    setCurrentTransactionId(null);

    setShowTransactionDialog(true);
    const [error, _] = await tryAsync(
      executeTransfer(direction, amountFrom, setTransactionInUrl),
    );
    if (error !== undefined) {
      console.error("Transfer failed:", error);
      // Dialog stays open to show ERROR state from hook
    }
  }, [
    amountFrom,
    walletsReady,
    isTransferInProgress,
    executeTransfer,
    direction,
    setTransactionInUrl,
    clearTransactionFromUrl,
    setCurrentTransactionId,
  ]);

  const handleSubmit = useCallback(() => {
    // Guard against concurrent transfers - prevents double-click issues
    if (!amountFrom || !walletsReady || isTransferInProgress) return;

    // Check for pending transaction
    if (pendingTransaction) {
      // Store the callback to execute after user confirms deletion
      setPendingActionCallback(() => startNewTransfer);
      setShowPendingDialog(true);
      return;
    }

    void startNewTransfer();
  }, [
    amountFrom,
    walletsReady,
    isTransferInProgress,
    pendingTransaction,
    startNewTransfer,
  ]);

  const handleDeleteAndStartNew = useCallback(
    (transactionId: string) => {
      deleteTransaction(transactionId);
      clearTransactionFromUrl();
      // Execute the stored callback after deletion
      if (pendingActionCallback) {
        pendingActionCallback();
        setPendingActionCallback(null);
      }
    },
    [deleteTransaction, clearTransactionFromUrl, pendingActionCallback],
  );

  const handleCloseDialog = useCallback(() => {
    // Only allow closing when completed or error
    if (
      bridgeState.step !== SimpleBridgeStep.COMPLETE &&
      bridgeState.step !== SimpleBridgeStep.ERROR
    ) {
      return;
    }

    setShowTransactionDialog(false);
    clearTransactionFromUrl();
    setCurrentTransactionId(null);

    // Reset F5 recovery flag so next transaction can be recovered
    f5RecoveryExecutedRef.current = false;

    if (bridgeState.step === SimpleBridgeStep.COMPLETE) {
      setAmountFrom("");
    }

    // Reset bridge state to avoid stale state when starting new transfer
    updateBridgeState({
      step: SimpleBridgeStep.IDLE,
      errorMessage: undefined,
    });
    setTransactions([]);
  }, [
    bridgeState.step,
    clearTransactionFromUrl,
    setCurrentTransactionId,
    updateBridgeState,
    setTransactions,
  ]);

  const handleRetryFromHistory = useCallback(
    (transaction: FastBridgeTransactionHistoryItem) => {
      setShowHistoryDialog(false);
      setDirection(transaction.direction);
      setAmountFrom(transaction.amount);

      // Set URL state for recovery
      setTransactionInUrl(transaction.id);

      // Set transaction ID so the orchestrator can update history when retry succeeds
      setCurrentTransactionId(transaction.id);

      // Determine the appropriate step to restore based on status and currentStep
      let stepToRestore = transaction.currentStep;
      if (transaction.status === "error") {
        stepToRestore = SimpleBridgeStep.ERROR;
      }

      // Restore bridge state to the current step (ERROR, or whatever step it was at)
      // This allows continuing from pending/step1_complete, not just errors
      updateBridgeState({
        step: stepToRestore,
        direction: transaction.direction,
        amount: transaction.amount,
        errorMessage: transaction.errorMessage,
      });

      // Restore transaction state to show in lifecycle dialog
      const restoredTransactions: SimpleBridgeTransaction[] = [];

      // Helper to determine error phase based on the currentStep at time of error
      const getErrorPhase = (
        errorStep: 1 | 2 | undefined,
        currentStep: SimpleBridgeStep,
      ): "sign" | "confirm" | undefined => {
        if (!errorStep) return undefined;

        // Map currentStep to error phase
        if (errorStep === 1) {
          if (
            currentStep === SimpleBridgeStep.STEP_1_SIGNING ||
            currentStep === SimpleBridgeStep.STEP_1_PREPARING
          ) {
            return "sign";
          }
          if (currentStep === SimpleBridgeStep.STEP_1_CONFIRMING) {
            return "confirm";
          }
        }
        if (errorStep === 2) {
          if (
            currentStep === SimpleBridgeStep.STEP_2_SIGNING ||
            currentStep === SimpleBridgeStep.STEP_2_PREPARING ||
            currentStep === SimpleBridgeStep.STEP_2_SWITCHING
          ) {
            return "sign";
          }
          if (currentStep === SimpleBridgeStep.STEP_2_CONFIRMING) {
            return "confirm";
          }
        }

        // Default: assume sign phase if currentStep is ERROR (most common case)
        return "sign";
      };

      // Determine step 1 status based on current step and error state
      const isStep1Confirming =
        transaction.currentStep === SimpleBridgeStep.STEP_1_CONFIRMING;
      const isStep1Complete =
        transaction.currentStep === SimpleBridgeStep.STEP_1_COMPLETE ||
        transaction.currentStep === SimpleBridgeStep.STEP_2_PREPARING ||
        transaction.currentStep === SimpleBridgeStep.STEP_2_SWITCHING ||
        transaction.currentStep === SimpleBridgeStep.STEP_2_SIGNING ||
        transaction.currentStep === SimpleBridgeStep.STEP_2_CONFIRMING ||
        transaction.status === "step1_complete" ||
        transaction.errorStep === 2; // If error at step 2, step 1 was complete

      // Always add step 1 transaction to show progress
      restoredTransactions.push({
        step: 1,
        txHash: transaction.step1TxHash,
        status:
          transaction.errorStep === 1
            ? "ERROR"
            : isStep1Complete
              ? "SUCCESS"
              : isStep1Confirming
                ? "CONFIRMING"
                : null,
        chainName:
          transaction.direction === "base-to-native" ? "Base" : "Torus Native",
        explorerUrl: transaction.step1TxHash
          ? getExplorerUrl(
              transaction.step1TxHash,
              transaction.direction === "base-to-native"
                ? "Base"
                : "Torus Native",
            )
          : undefined,
        message:
          transaction.errorStep === 1
            ? transaction.errorMessage
            : isStep1Complete
              ? "Transaction confirmed"
              : isStep1Confirming
                ? "Waiting for confirmation..."
                : undefined,
        errorDetails:
          transaction.errorStep === 1 ? transaction.errorMessage : undefined,
        errorPhase:
          transaction.errorStep === 1
            ? getErrorPhase(1, transaction.currentStep)
            : undefined,
      });

      // Determine step 2 status
      const isStep2Confirming =
        transaction.currentStep === SimpleBridgeStep.STEP_2_CONFIRMING;
      const isStep2Signing =
        transaction.currentStep === SimpleBridgeStep.STEP_2_SIGNING ||
        transaction.currentStep === SimpleBridgeStep.STEP_2_PREPARING ||
        transaction.currentStep === SimpleBridgeStep.STEP_2_SWITCHING ||
        transaction.currentStep === SimpleBridgeStep.STEP_1_COMPLETE;

      // Add step 2 transaction if we've progressed past step 1 or have error at step 2
      if (isStep1Complete || transaction.errorStep === 2) {
        restoredTransactions.push({
          step: 2,
          txHash: transaction.step2TxHash,
          status:
            transaction.errorStep === 2
              ? "ERROR"
              : transaction.step2TxHash
                ? "SUCCESS"
                : isStep2Confirming
                  ? "CONFIRMING"
                  : isStep2Signing
                    ? "SIGNING"
                    : null,
          chainName: "Torus EVM",
          explorerUrl: transaction.step2TxHash
            ? getExplorerUrl(transaction.step2TxHash, "Torus EVM")
            : undefined,
          message:
            transaction.errorStep === 2
              ? transaction.errorMessage
              : transaction.step2TxHash
                ? "Transaction confirmed"
                : isStep2Confirming
                  ? "Waiting for confirmation..."
                  : isStep2Signing
                    ? "Please sign the transaction"
                    : undefined,
          errorDetails:
            transaction.errorStep === 2 ? transaction.errorMessage : undefined,
          errorPhase:
            transaction.errorStep === 2
              ? getErrorPhase(2, transaction.currentStep)
              : undefined,
        });
      }

      // Restore the transactions to the shared state
      setTransactions(restoredTransactions);

      // Open dialog showing the current state
      setShowTransactionDialog(true);

      // Handle F5 recovery based on currentStep
      // Case 1: STEP_1_CONFIRMING - resume polling for step 1 balance confirmation
      if (transaction.currentStep === SimpleBridgeStep.STEP_1_CONFIRMING) {
        void resumeStep1Polling(
          transaction,
          () => {
            // After step 1 completes, proceed to step 2 would be handled by user action (retry)
          },
          (error) => {
            console.error("[F5 Recovery] Step 1 polling failed:", error);
            updateBridgeState({
              step: SimpleBridgeStep.ERROR,
              errorMessage: error.message,
            });
          },
        );
      }

      // Case 2: STEP_2_SIGNING/STEP_2_PREPARING/STEP_2_SWITCHING - re-trigger wallet call
      // User needs to click retry to initiate the signing flow again
      // The UI will show the correct state and retry button will work

      // Case 3: STEP_2_CONFIRMING - resume polling for step 2 balance confirmation
      if (transaction.currentStep === SimpleBridgeStep.STEP_2_CONFIRMING) {
        void resumeStep2Polling(
          transaction,
          () => {
            // Transfer complete - UI will update automatically
          },
          (error) => {
            console.error("[F5 Recovery] Step 2 polling failed:", error);
            updateBridgeState({
              step: SimpleBridgeStep.ERROR,
              errorMessage: error.message,
            });
          },
        );
      }
    },
    [
      getExplorerUrl,
      setTransactions,
      setTransactionInUrl,
      updateBridgeState,
      setCurrentTransactionId,
      resumeStep1Polling,
      resumeStep2Polling,
    ],
  );

  // Store the latest handleRetryFromHistory in a ref to avoid stale closures in F5 recovery
  const handleRetryFromHistoryRef = useRef(handleRetryFromHistory);
  useEffect(() => {
    handleRetryFromHistoryRef.current = handleRetryFromHistory;
  }, [handleRetryFromHistory]);

  // Track if F5 recovery has already run to prevent re-running when URL changes during transfer
  const f5RecoveryExecutedRef = useRef(false);

  // Check for transaction ID in URL on mount (F5 recovery)
  // Uses ref flag to ensure this only runs once on mount, not when URL changes during transfer
  useEffect(() => {
    // Skip if F5 recovery already executed (prevents re-triggering when URL updates during transfer)
    if (f5RecoveryExecutedRef.current) {
      return;
    }
    f5RecoveryExecutedRef.current = true;

    const txId = getTransactionFromUrl();

    if (txId) {
      const transaction = getTransactionById(txId);

      if (!transaction) {
        // Transaction not found in store - show toast and redirect
        clearTransactionFromUrl();
        toast({
          title: "Transaction not found",
          description:
            "The transaction you are looking for does not exist or has been cleared from history.",
          variant: "destructive",
        });
        return;
      }

      if (transaction.status !== "completed") {
        try {
          handleRetryFromHistoryRef.current(transaction);
        } catch (error) {
          console.error("[F5 Recovery] Failed to restore transaction:", error);
          clearTransactionFromUrl();
        }
      }
    }
  }, [
    getTransactionFromUrl,
    getTransactionById,
    clearTransactionFromUrl,
    toast,
  ]);

  const getChainInfo = (isFrom: boolean) => {
    const isBaseToNative = direction === "base-to-native";
    const showBase = isBaseToNative === isFrom;

    const formatAddress = (address?: string) => {
      if (!address) return "No address";
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const formatBalance = (balance?: bigint) => {
      if (balance === undefined) return "0 TORUS";
      return `${formatToken(balance)} TORUS`;
    };

    const baseWalletAddress = connectionState.evmWallet.address;
    const torusWalletAddress = connectionState.torusWallet.address;

    if (showBase) {
      return {
        name: "Base",
        icon: "/assets/icons/bridge/torus-base-simple.svg",
        balance: formatBalance(baseBalance),
        address: formatAddress(baseWalletAddress),
      };
    }

    return {
      name: "Torus Native",
      icon: "/assets/icons/bridge/torus-native-simple.svg",
      balance: formatBalance(nativeBalance.data),
      address: formatAddress(torusWalletAddress),
    };
  };

  const fromChain = getChainInfo(true);
  const toChain = getChainInfo(false);

  const isFormValid = useMemo(() => {
    if (!walletsReady) return false;
    if (!amountFrom) return false;
    if (parseFloat(amountFrom) <= 0) return false;

    const amountBigInt = parseDecimalToBigInt(amountFrom);

    // Validate sufficient balance for Base to Native
    if (direction === "base-to-native") {
      if (!baseBalance) return false;
      const requiredBalance = amountBigInt + BASE_GAS_RESERVE;
      return baseBalance >= requiredBalance;
    }

    // Validate sufficient balance for Native to Base
    if (!nativeBalance.data) return false;
    const requiredBalance = amountBigInt + NATIVE_GAS_RESERVE;
    return nativeBalance.data >= requiredBalance;
  }, [walletsReady, amountFrom, direction, baseBalance, nativeBalance.data]);

  const getButtonText = () => {
    if (isTransferInProgress) return "Processing...";
    if (!walletsReady) return "Connect Wallets";
    if (!amountFrom) return "Enter Amount";
    if (parseFloat(amountFrom) <= 0) return "Invalid Amount";

    const amountBigInt = parseDecimalToBigInt(amountFrom);

    // Check for insufficient balance - Base to Native
    if (direction === "base-to-native") {
      if (!baseBalance) return "Loading Balance...";
      const requiredBalance = amountBigInt + BASE_GAS_RESERVE;
      if (baseBalance < requiredBalance) return "Insufficient Balance";
    }

    // Check for insufficient balance - Native to Base
    if (direction === "native-to-base") {
      if (!nativeBalance.data) return "Loading Balance...";
      const requiredBalance = amountBigInt + NATIVE_GAS_RESERVE;
      if (nativeBalance.data < requiredBalance) return "Insufficient Balance";
    }

    // Return specific transaction description based on direction
    return direction === "base-to-native"
      ? "Submit Base to Torus Transaction"
      : "Submit Torus to Base Transaction";
  };

  const hasInsufficientBalance = () => {
    if (!amountFrom || parseFloat(amountFrom) <= 0) return false;

    const amountBigInt = parseDecimalToBigInt(amountFrom);

    // Check for insufficient balance - Base to Native
    if (direction === "base-to-native") {
      if (!baseBalance) return false;
      const requiredBalance = amountBigInt + BASE_GAS_RESERVE;
      return baseBalance < requiredBalance;
    }

    // Check for insufficient balance - Native to Base
    if (!nativeBalance.data) return false;
    const requiredBalance = amountBigInt + NATIVE_GAS_RESERVE;
    return nativeBalance.data < requiredBalance;
  };

  const renderChainValue = (
    chain: typeof fromChain,
    showBaseFormat: boolean = false,
  ) => {
    if (showBaseFormat && chain.name === "Base") {
      return (
        <div className="flex items-center gap-2">
          <Image src={chain.icon} alt={chain.name} width={20} height={20} />
          <span className="text-foreground font-medium">
            <span className="font-bold">$BASE</span> Base mainnet
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Image src={chain.icon} alt={chain.name} width={20} height={20} />
        <span className="text-foreground font-medium">
          <span className="font-bold">$TORUS</span>{" "}
          {chain.name.replace("Torus Native", "Native")}
        </span>
      </div>
    );
  };

  const hasEvmBalance =
    torusEvmBalance && torusEvmBalance.value > TORUS_EVM_MIN_BALANCE;

  return (
    <div className="mx-auto w-full space-y-6">
      <div className="-mt-[3.5rem] flex items-center justify-end">
        <div className="flex gap-2">
          <TooltipProvider delayDuration={500}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={
                    !hasEvmBalance || isTransferInProgress
                      ? "cursor-not-allowed"
                      : ""
                  }
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQuickSendDialog(true)}
                    disabled={!hasEvmBalance || isTransferInProgress}
                    className={
                      !hasEvmBalance || isTransferInProgress
                        ? "pointer-events-none"
                        : ""
                    }
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    EVM Recover
                  </Button>
                </span>
              </TooltipTrigger>
              {!hasEvmBalance && (
                <TooltipContent>
                  <p className="text-sm">
                    Recover is only available when you have TORUS in your EVM
                    wallet
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistoryDialog(true)}
            className="relative"
          >
            <History className="mr-2 h-4 w-4" />
            History
            {errorCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold"
              >
                {errorCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {!walletsReady && <DualWalletConnector direction={direction} />}

      {walletsReady && (
        <Card className="w-full">
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <Label className="text-sm font-medium">From</Label>
                <InputReadonly label="TORUS" className="w-full">
                  {renderChainValue(fromChain, true)}
                </InputReadonly>
                <div className="text-muted-foreground flex flex-col gap-1 text-xs">
                  <div>
                    Balance:{" "}
                    <span className="font-bold">
                      {fromChain.balance}
                      {usdPrice && (
                        <span className="text-muted-foreground ml-1 font-normal">
                          (
                          <TorusToUSD
                            torusAmount={
                              direction === "base-to-native"
                                ? (baseBalance ?? 0n)
                                : (nativeBalance.data ?? 0n)
                            }
                            usdPrice={usdPrice}
                            decimals={2}
                          />
                          )
                        </span>
                      )}
                    </span>
                  </div>
                  <div>
                    Wallet:{" "}
                    <span className="font-bold">{fromChain.address}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center lg:-mt-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleDirection}
                  disabled={isTransferInProgress}
                  className="rounded-full"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 space-y-2">
                <Label className="text-sm font-medium">To</Label>
                <InputReadonly label="TORUS" className="w-full">
                  {renderChainValue(toChain, true)}
                </InputReadonly>
                <div className="text-muted-foreground flex flex-col gap-1 text-xs">
                  <div>
                    Balance:{" "}
                    <span className="font-bold">
                      {toChain.balance}
                      {usdPrice && (
                        <span className="text-muted-foreground ml-1 font-normal">
                          (
                          <TorusToUSD
                            torusAmount={
                              direction === "base-to-native"
                                ? (nativeBalance.data ?? 0n)
                                : (baseBalance ?? 0n)
                            }
                            usdPrice={usdPrice}
                            decimals={2}
                          />
                          )
                        </span>
                      )}
                    </span>
                  </div>
                  <div>
                    Wallet: <span className="font-bold">{toChain.address}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Amount</Label>
              <Input
                type="number"
                value={amountFrom}
                onChange={(e) => setAmountFrom(e.target.value)}
                placeholder="0.00"
                disabled={isTransferInProgress}
                className="w-full"
              />
              <FractionButtons
                handleFractionClick={handleFractionClick}
                walletsReady={walletsReady}
                isTransferInProgress={isTransferInProgress}
                handleMaxClick={handleMaxClick}
              />
            </div>

            <div className="flex flex-col gap-1">
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid || isTransferInProgress}
                className={`w-full ${hasInsufficientBalance() ? "bg-red-600 text-white hover:bg-red-700" : ""}`}
                size="lg"
              >
                {getButtonText()}
              </Button>
              <div className="text-muted-foreground flex items-center gap-2 text-xs font-normal">
                <Info className="h-3.5 w-3.5 align-middle" />
                <span className="align-middle text-[12px] font-normal leading-5 tracking-normal">
                  This transaction will ask for multiple signatures
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <TransactionLifecycleDialog
        isOpen={showTransactionDialog}
        onClose={handleCloseDialog}
        direction={direction}
        currentStep={bridgeState.step}
        transactions={transactions}
        amount={amountFrom}
        onRetry={retryFromFailedStep}
      />

      <TransactionHistoryDialog
        isOpen={showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
        onContinue={handleRetryFromHistory}
        getExplorerUrl={getExplorerUrl}
      />

      <QuickSendEvmDialog
        isOpen={showQuickSendDialog}
        onClose={() => setShowQuickSendDialog(false)}
        evmBalance={torusEvmBalance?.value ?? 0n}
        currentEvmBalance={torusEvmBalance?.value ?? 0n}
        onSendToNative={handleSendToNative}
        onSendToBase={handleSendToBase}
        formatAmount={formatToken}
        refetchBalances={refetchAllBalances}
        onRecoverySuccess={markFailedAsRecoveredViaEvmRecover}
      />

      {pendingTransaction && (
        <PendingTransactionDialog
          isOpen={showPendingDialog}
          onClose={() => {
            setShowPendingDialog(false);
            setPendingActionCallback(null);
          }}
          pendingTransaction={pendingTransaction}
          onResume={handleRetryFromHistory}
          onDeleteAndStartNew={handleDeleteAndStartNew}
        />
      )}
    </div>
  );
}
