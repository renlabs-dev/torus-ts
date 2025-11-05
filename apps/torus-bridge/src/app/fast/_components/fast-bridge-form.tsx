"use client";

import type { SS58Address } from "@torus-network/sdk/types";
import { formatToken } from "@torus-network/torus-utils/torus/token";
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
import { contractAddresses, getChainValuesOnEnv } from "~/config";
import { env } from "~/env";
import { ArrowLeftRight, History, Info, Zap } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { erc20Abi } from "viem";
import { useBalance, useReadContract } from "wagmi";
import { useDualWallet } from "../hooks/use-fast-bridge-dual-wallet";
import { useOrchestratedTransfer } from "../hooks/use-fast-bridge-orchestrated-transfer";
import { useFastBridgeTransactionHistory } from "../hooks/use-fast-bridge-transaction-history";
import { useFastBridgeTransactionUrlState } from "../hooks/use-fast-bridge-transaction-url-state";
import { DualWalletConnector } from "./fast-bridge-dual-wallet-connector";
import { FractionButtons } from "./fast-bridge-fraction-buttons";
import { QuickSendEvmDialog } from "./fast-bridge-quick-send-evm-dialog";
import { TransactionHistoryDialog } from "./fast-bridge-transaction-history-dialog";
import { TransactionLifecycleDialog } from "./fast-bridge-transaction-lifecycle-dialog";
import type {
  FastBridgeTransactionHistoryItem,
  SimpleBridgeDirection,
  SimpleBridgeTransaction,
} from "./fast-bridge-types";
import { SimpleBridgeStep } from "./fast-bridge-types";

const BASE_GAS_RESERVE = 10n ** 16n;
const NATIVE_GAS_RESERVE = 10n ** 18n;
const TORUS_EVM_GAS_RESERVE = 5n * 10n ** 15n; // 0.005 TORUS for gas fees

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
  } = useOrchestratedTransfer();

  const { getTransactions, getTransactionById } =
    useFastBridgeTransactionHistory();
  const allTransactions = getTransactions();
  const errorCount = allTransactions.filter(
    (tx) => tx.status === "error",
  ).length;

  const {
    setTransactionInUrl,
    getTransactionFromUrl,
    clearTransactionFromUrl,
  } = useFastBridgeTransactionUrlState();

  const { selectedAccount, api } = useTorus();
  const nativeBalance = useFreeBalance(
    api,
    selectedAccount?.address as SS58Address,
  );

  const { data: usdPrice } = useGetTorusPrice();

  const baseTorusAddress =
    contractAddresses.base[env("NEXT_PUBLIC_TORUS_CHAIN_ENV")].torusErc20;

  const evmAddress = connectionState.evmWallet.address as
    | `0x${string}`
    | undefined;

  const { data: baseBalance } = useReadContract({
    chainId: chainIds.base,
    address: baseTorusAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: evmAddress ? [evmAddress] : undefined,
    query: {
      enabled: Boolean(evmAddress),
    },
  });

  const getChainValues = getChainValuesOnEnv(
    env("NEXT_PUBLIC_TORUS_CHAIN_ENV"),
  );
  const { chainId: torusEvmChainId } = getChainValues("torus");

  const { data: torusEvmBalance } = useBalance({
    address: evmAddress,
    chainId: torusEvmChainId,
  });

  const walletsReady = areWalletsReady(direction);

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

  const handleSendToNative = useCallback(async () => {
    if (!torusEvmBalance || !walletsReady) return;

    const evmBalance = torusEvmBalance.value;
    const maxAmount =
      evmBalance > TORUS_EVM_GAS_RESERVE
        ? evmBalance - TORUS_EVM_GAS_RESERVE
        : 0n;

    if (maxAmount <= 0n) {
      return;
    }

    setShowQuickSendDialog(false);
    setDirection("base-to-native");
    const amountStr = formatWeiToDecimalString(maxAmount);
    setAmountFrom(amountStr);
    setShowTransactionDialog(true);

    try {
      await executeTransfer("base-to-native", amountStr);
    } catch (error) {
      console.error("Send to Native failed:", error);
    }
  }, [torusEvmBalance, walletsReady, executeTransfer]);

  const handleSendToBase = useCallback(async () => {
    if (!torusEvmBalance || !walletsReady) return;

    const evmBalance = torusEvmBalance.value;
    const maxAmount =
      evmBalance > TORUS_EVM_GAS_RESERVE
        ? evmBalance - TORUS_EVM_GAS_RESERVE
        : 0n;

    if (maxAmount <= 0n) {
      return;
    }

    setShowQuickSendDialog(false);
    setDirection("native-to-base");
    const amountStr = formatWeiToDecimalString(maxAmount);
    setAmountFrom(amountStr);
    setShowTransactionDialog(true);

    try {
      await executeTransfer("native-to-base", amountStr);
    } catch (error) {
      console.error("Send to Base failed:", error);
    }
  }, [torusEvmBalance, walletsReady, executeTransfer]);

  const handleSubmit = useCallback(async () => {
    if (!amountFrom || !walletsReady) return;

    setShowTransactionDialog(true);
    try {
      await executeTransfer(direction, amountFrom);
    } catch (error) {
      console.error("Transfer failed:", error);
      // Dialog stays open to show ERROR state from hook
    }
  }, [amountFrom, walletsReady, executeTransfer, direction]);

  const handleCloseDialog = useCallback(() => {
    if (
      bridgeState.step === SimpleBridgeStep.COMPLETE ||
      bridgeState.step === SimpleBridgeStep.ERROR
    ) {
      setShowTransactionDialog(false);
      clearTransactionFromUrl(); // Clear URL state
      // Clear the form when transaction is complete or has error
      if (bridgeState.step === SimpleBridgeStep.COMPLETE) {
        setAmountFrom("");
      }
    }
  }, [bridgeState.step, clearTransactionFromUrl]);

  const handleRetryFromHistory = useCallback(
    (transaction: FastBridgeTransactionHistoryItem) => {
      setShowHistoryDialog(false);
      setDirection(transaction.direction);
      setAmountFrom(transaction.amount);

      // Set URL state for recovery
      setTransactionInUrl(transaction.id);

      // Restore transaction state to show in lifecycle dialog
      const restoredTransactions: SimpleBridgeTransaction[] = [];

      // Add step 1 if we have the hash
      if (transaction.step1TxHash) {
        restoredTransactions.push({
          step: 1,
          txHash: transaction.step1TxHash,
          status: transaction.errorStep === 1 ? "ERROR" : "SUCCESS",
          chainName:
            transaction.direction === "base-to-native"
              ? "Base"
              : "Torus Native",
          explorerUrl: getExplorerUrl(
            transaction.step1TxHash,
            transaction.direction === "base-to-native"
              ? "Base"
              : "Torus Native",
          ),
          message:
            transaction.errorStep === 1
              ? transaction.errorMessage
              : "Transaction confirmed",
          errorDetails:
            transaction.errorStep === 1 ? transaction.errorMessage : undefined,
        });
      }

      // Add step 2 if we have the hash or if error was at step 2
      if (transaction.step2TxHash || transaction.errorStep === 2) {
        restoredTransactions.push({
          step: 2,
          txHash: transaction.step2TxHash,
          status:
            transaction.errorStep === 2
              ? "ERROR"
              : transaction.step2TxHash
                ? "SUCCESS"
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
                : undefined,
          errorDetails:
            transaction.errorStep === 2 ? transaction.errorMessage : undefined,
        });
      }

      // Restore the transactions to the shared state
      setTransactions(restoredTransactions);

      // Open dialog showing the error state
      setShowTransactionDialog(true);
    },
    [getExplorerUrl, setTransactions, setTransactionInUrl],
  );

  // Check for transaction ID in URL on mount (F5 recovery)
  useEffect(() => {
    const txId = getTransactionFromUrl();
    if (txId) {
      const transaction = getTransactionById(txId);
      if (transaction?.status === "error") {
        // Auto-restore the transaction
        handleRetryFromHistory(transaction);
      }
    }
  }, [getTransactionFromUrl, getTransactionById, handleRetryFromHistory]);

  const getChainInfo = (isFrom: boolean) => {
    const isBaseToNative = direction === "base-to-native";
    const showBase = isBaseToNative === isFrom;

    const formatAddress = (address?: string) => {
      if (!address) return "No address";
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const formatBalance = (balance?: bigint) => {
      if (!balance) return "0 TORUS";
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
    torusEvmBalance && torusEvmBalance.value > TORUS_EVM_GAS_RESERVE;

  return (
    <div className="mx-auto w-full space-y-6">
      <div className="flex items-center justify-end">
        <div className="flex gap-2">
          {hasEvmBalance && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuickSendDialog(true)}
              disabled={isTransferInProgress}
            >
              <Zap className="mr-2 h-4 w-4" />
              Quick EVM
            </Button>
          )}
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
                <InputReadonly
                  label="TORUS"
                  value={renderChainValue(fromChain, true)}
                  className="w-full"
                />
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
                    Account:{" "}
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
                <InputReadonly
                  label="TORUS"
                  value={renderChainValue(toChain, true)}
                  className="w-full"
                />
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
                    Account:{" "}
                    <span className="font-bold">{toChain.address}</span>
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
        evmBalance={
          torusEvmBalance && torusEvmBalance.value > TORUS_EVM_GAS_RESERVE
            ? torusEvmBalance.value - TORUS_EVM_GAS_RESERVE
            : 0n
        }
        nativeBalance={nativeBalance.data ?? 0n}
        baseBalance={baseBalance ?? 0n}
        onSendToNative={handleSendToNative}
        onSendToBase={handleSendToBase}
        formatAmount={formatWeiToDecimalString}
        isTransferInProgress={isTransferInProgress}
      />
    </div>
  );
}
