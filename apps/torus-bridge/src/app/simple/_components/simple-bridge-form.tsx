"use client";

import type { SS58Address } from "@torus-network/sdk/types";
import { formatToken } from "@torus-network/torus-utils/torus/token";
import { useFreeBalance } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
import { Card, CardContent } from "@torus-ts/ui/components/card";
import { Input, InputReadonly } from "@torus-ts/ui/components/input";
import { Label } from "@torus-ts/ui/components/label";
import { contractAddresses } from "~/config";
import { env } from "~/env";
import { ArrowLeftRight, Info } from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { erc20Abi } from "viem";
import { useReadContract } from "wagmi";
import { useDualWallet } from "../hooks/use-simple-bridge-dual-wallet";
import { useOrchestratedTransfer } from "../hooks/use-simple-bridge-orchestrated-transfer";
import { DualWalletConnector } from "./simple-bridge-dual-wallet-connector";
import { FractionButtons } from "./simple-bridge-fraction-buttons";
import { TransactionLifecycleDialog } from "./simple-bridge-transaction-lifecycle-dialog";
import type { SimpleBridgeDirection } from "./simple-bridge-types";
import { SimpleBridgeStep } from "./simple-bridge-types";

export function SimpleBridgeForm() {
  const [direction, setDirection] =
    useState<SimpleBridgeDirection>("base-to-native");
  const [amountFrom, setAmountFrom] = useState<string>("");
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);

  const { areWalletsReady, connectionState, chainIds } = useDualWallet();
  const {
    bridgeState,
    transactions,
    executeTransfer,
    resetTransfer: _resetTransfer,
    retryFromFailedStep,
    isTransferInProgress,
  } = useOrchestratedTransfer();

  const { selectedAccount, api } = useTorus();
  const nativeBalance = useFreeBalance(
    api,
    selectedAccount?.address as SS58Address,
  );

  const baseTorusAddress =
    contractAddresses.base[env("NEXT_PUBLIC_TORUS_CHAIN_ENV")].torusErc20;

  const { data: baseBalance } = useReadContract({
    chainId: chainIds.base,
    address: baseTorusAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: connectionState.evmWallet.address
      ? [connectionState.evmWallet.address as `0x${string}`]
      : undefined,
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
        const maxAmount = baseBalance - BigInt(1e16); // Reserve 0.01 tokens for gas
        // Use pure BigInt arithmetic to avoid precision loss
        const fractionNumerator = BigInt(Math.floor(fraction * 1_000_000));
        const fractionAmount =
          (maxAmount * fractionNumerator) / BigInt(1_000_000);
        const fractionAmountString = (Number(fractionAmount) / 1e18).toFixed(
          18,
        );
        setAmountFrom(fractionAmountString.replace(/\.?0+$/, ""));
      } else if (direction === "native-to-base" && nativeBalance.data) {
        const maxAmount = nativeBalance.data - BigInt(1e18); // Reserve 1 token for gas
        // Use pure BigInt arithmetic to avoid precision loss
        const fractionNumerator = BigInt(Math.floor(fraction * 1_000_000));
        const fractionAmount =
          (maxAmount * fractionNumerator) / BigInt(1_000_000);
        const fractionAmountString = (Number(fractionAmount) / 1e18).toFixed(
          18,
        );
        setAmountFrom(fractionAmountString.replace(/\.?0+$/, ""));
      }
    },
    [direction, baseBalance, nativeBalance.data],
  );

  const handleMaxClick = useCallback(() => {
    handleFractionClick(1.0); // All = 100%
  }, [handleFractionClick]);

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
      // Clear the form when transaction is complete or has error
      if (bridgeState.step === SimpleBridgeStep.COMPLETE) {
        setAmountFrom("");
      }
    }
  }, [bridgeState.step]);

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

    const amountBigInt = BigInt(Math.floor(parseFloat(amountFrom) * 1e18));

    // Validate sufficient balance for Base to Native
    if (direction === "base-to-native") {
      if (!baseBalance) return false;
      const requiredBalance = amountBigInt + BigInt(1e16); // 0.01 tokens for gas
      return baseBalance >= requiredBalance;
    }

    // Validate sufficient balance for Native to Base
    if (!nativeBalance.data) return false;
    const requiredBalance = amountBigInt + BigInt(1e18); // 1 token for gas
    return nativeBalance.data >= requiredBalance;
  }, [walletsReady, amountFrom, direction, baseBalance, nativeBalance.data]);

  const getButtonText = () => {
    if (isTransferInProgress) return "Processing...";
    if (!walletsReady) return "Connect Wallets";
    if (!amountFrom) return "Enter Amount";
    if (parseFloat(amountFrom) <= 0) return "Invalid Amount";

    const amountBigInt = BigInt(Math.floor(parseFloat(amountFrom) * 1e18));

    // Check for insufficient balance - Base to Native
    if (direction === "base-to-native") {
      if (!baseBalance) return "Loading Balance...";
      const requiredBalance = amountBigInt + BigInt(1e16);
      if (baseBalance < requiredBalance) return "Insufficient Balance";
    }

    // Check for insufficient balance - Native to Base
    if (direction === "native-to-base") {
      if (!nativeBalance.data) return "Loading Balance...";
      const requiredBalance = amountBigInt + BigInt(1e18);
      if (nativeBalance.data < requiredBalance) return "Insufficient Balance";
    }

    // Return specific transaction description based on direction
    return direction === "base-to-native"
      ? "Submit Base to Torus Transaction"
      : "Submit Torus to Base Transaction";
  };

  const hasInsufficientBalance = () => {
    if (!amountFrom || parseFloat(amountFrom) <= 0) return false;

    const amountBigInt = BigInt(Math.floor(parseFloat(amountFrom) * 1e18));

    // Check for insufficient balance - Base to Native
    if (direction === "base-to-native") {
      if (!baseBalance) return false;
      const requiredBalance = amountBigInt + BigInt(1e16);
      return baseBalance < requiredBalance;
    }

    // Check for insufficient balance - Native to Base
    if (!nativeBalance.data) return false;
    const requiredBalance = amountBigInt + BigInt(1e18);
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

  return (
    <div className="mx-auto w-full space-y-6">
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
                <div className="text-muted-foreground flex items-center justify-between text-xs">
                  <span>
                    Balance:{" "}
                    <span className="font-bold">{fromChain.balance}</span>
                  </span>
                  <span className="text-muted-foreground">|</span>
                  <span>
                    Account:{" "}
                    <span className="font-bold">{fromChain.address}</span>
                  </span>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-center">
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
                <div className="text-muted-foreground flex items-center justify-between text-xs">
                  <span>
                    Balance:{" "}
                    <span className="font-bold">{toChain.balance}</span>
                  </span>
                  <span className="text-muted-foreground">|</span>
                  <span>
                    Account:{" "}
                    <span className="font-bold">{toChain.address}</span>
                  </span>
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
              <div className="text-muted-foreground mb-4 flex items-center gap-2 text-xs font-normal">
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
    </div>
  );
}
