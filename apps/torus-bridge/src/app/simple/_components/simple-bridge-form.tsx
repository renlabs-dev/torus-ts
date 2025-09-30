"use client";

import type { SS58Address } from "@torus-network/sdk/types";
import { formatToken } from "@torus-network/torus-utils/torus/token";
import { useFreeBalance } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
import { Card, CardContent } from "@torus-ts/ui/components/card";
import { Input } from "@torus-ts/ui/components/input";
import { Label } from "@torus-ts/ui/components/label";
import { contractAddresses } from "~/config";
import { env } from "~/env";
import { ArrowLeftRight } from "lucide-react";
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
  const [amount, setAmount] = useState<string>("");
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
    setAmount("");
  }, [isTransferInProgress]);

  const handleFractionClick = useCallback(
    (fraction: number) => {
      if (direction === "base-to-native" && baseBalance) {
        const maxAmount = baseBalance - BigInt(1e16); // Reserve 0.01 tokens for gas
        const fractionAmount = BigInt(Math.floor(Number(maxAmount) * fraction));
        const fractionAmountString = (Number(fractionAmount) / 1e18).toFixed(
          18,
        );
        setAmount(fractionAmountString.replace(/\.?0+$/, ""));
      } else if (direction === "native-to-base" && nativeBalance.data) {
        const maxAmount = nativeBalance.data - BigInt(1e18); // Reserve 1 token for gas
        const fractionAmount = BigInt(Math.floor(Number(maxAmount) * fraction));
        const fractionAmountString = (Number(fractionAmount) / 1e18).toFixed(
          18,
        );
        setAmount(fractionAmountString.replace(/\.?0+$/, ""));
      }
    },
    [direction, baseBalance, nativeBalance.data],
  );

  const handleMaxClick = useCallback(() => {
    handleFractionClick(1.0); // All = 100%
  }, [handleFractionClick]);

  const handleSubmit = useCallback(async () => {
    if (!amount || !walletsReady) return;

    setShowTransactionDialog(true);
    try {
      await executeTransfer(direction, amount);
    } catch (error) {
      console.error("Transfer failed:", error);
      // Dialog stays open to show ERROR state from hook
    }
  }, [amount, walletsReady, executeTransfer, direction]);

  const handleCloseDialog = useCallback(() => {
    if (
      bridgeState.step === SimpleBridgeStep.COMPLETE ||
      bridgeState.step === SimpleBridgeStep.ERROR
    ) {
      setShowTransactionDialog(false);
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
    if (!amount) return false;
    if (parseFloat(amount) <= 0) return false;

    const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 1e18));

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
  }, [walletsReady, amount, direction, baseBalance, nativeBalance.data]);

  const getButtonText = () => {
    if (isTransferInProgress) return "Processing...";
    if (!walletsReady) return "Connect Wallets";
    if (!amount) return "Enter Amount";
    if (parseFloat(amount) <= 0) return "Invalid Amount";

    const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 1e18));

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

    return `Transfer ${amount} TORUS`;
  };

  const getAmountPlaceholder = () => {
    return direction === "base-to-native"
      ? "Enter Base TORUS amount"
      : "Enter Native TORUS amount";
  };

  return (
    <div className="mx-auto w-full space-y-6">
      {!walletsReady && <DualWalletConnector direction={direction} />}

      {walletsReady && (
        <Card className="w-full">
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <Label className="text-sm font-medium">From</Label>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Image
                        src={fromChain.icon}
                        alt={fromChain.name}
                        width={24}
                        height={24}
                      />
                      <div>
                        <p className="font-medium">{fromChain.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {fromChain.balance}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {fromChain.address}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center pt-6">
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
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Image
                        src={toChain.icon}
                        alt={toChain.name}
                        width={24}
                        height={24}
                      />
                      <div>
                        <p className="font-medium">{toChain.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {toChain.balance}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {toChain.address}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="space-y-2">
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={getAmountPlaceholder()}
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
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isTransferInProgress}
              className="w-full"
              size="lg"
            >
              {getButtonText()}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Transaction Lifecycle Dialog */}
      <TransactionLifecycleDialog
        isOpen={showTransactionDialog}
        onClose={handleCloseDialog}
        direction={direction}
        currentStep={bridgeState.step}
        transactions={transactions}
        amount={amount}
        onRetry={retryFromFailedStep}
      />
    </div>
  );
}
