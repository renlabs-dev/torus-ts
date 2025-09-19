"use client";

import type { SS58Address } from "@torus-network/sdk/types";
import { useFreeBalance } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import { Input } from "@torus-ts/ui/components/input";
import { Label } from "@torus-ts/ui/components/label";
import { ArrowDown, ArrowLeftRight } from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { useBalance } from "wagmi";
import { DualWalletConnector } from "./dual-wallet-connector";
import { useDualWallet } from "./hooks/use-dual-wallet";
import { useOrchestratedTransfer } from "./hooks/use-orchestrated-transfer";
import { ProgressStepper } from "./progress-stepper";
import type { SimpleBridgeDirection } from "./simple-bridge-types";
import { SimpleBridgeStep } from "./simple-bridge-types";

export function SimpleBridgeForm() {
  const [direction, setDirection] =
    useState<SimpleBridgeDirection>("base-to-native");
  const [amount, setAmount] = useState<string>("");

  const { areWalletsReady, connectionState, chainIds } = useDualWallet();
  const {
    bridgeState,
    transactions,
    executeTransfer,
    resetTransfer,
    isTransferInProgress,
  } = useOrchestratedTransfer();

  // Balance hooks
  const { selectedAccount, api } = useTorus();
  const nativeBalance = useFreeBalance(
    api,
    selectedAccount?.address as SS58Address,
  );

  const { data: baseBalance } = useBalance({
    address: connectionState.evmWallet.address as `0x${string}`,
    chainId: chainIds.base,
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
      if (direction === "base-to-native" && baseBalance?.value) {
        const maxAmount = baseBalance.value - BigInt(1e16); // Reserve 0.01 tokens for gas
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

    await executeTransfer(direction, amount);
  }, [amount, walletsReady, executeTransfer, direction]);

  const handleRetry = useCallback(() => {
    if (amount) {
      void executeTransfer(direction, amount);
    }
  }, [amount, direction, executeTransfer]);

  const handleReset = useCallback(() => {
    resetTransfer();
    setAmount("");
  }, [resetTransfer]);

  const getChainInfo = (isFrom: boolean) => {
    const isBaseToNative = direction === "base-to-native";
    const showBase = isBaseToNative === isFrom;

    return {
      name: showBase ? "Base" : "Torus Native",
      icon: showBase
        ? "/torus-base-balance-icon.svg"
        : "/torus-balance-icon.svg",
      balance: showBase
        ? baseBalance
          ? `${(Number(baseBalance.value) / 1e18).toFixed(4)} TORUS`
          : "0 TORUS"
        : nativeBalance.data
          ? `${(Number(nativeBalance.data) / 1e18).toFixed(4)} TORUS`
          : "0 TORUS",
    };
  };

  const fromChain = getChainInfo(true);
  const toChain = getChainInfo(false);

  const isFormValid = useMemo(() => {
    return walletsReady && amount && parseFloat(amount) > 0;
  }, [walletsReady, amount]);

  // If transfer is in progress or completed, show progress
  if (bridgeState.step !== SimpleBridgeStep.IDLE) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <ProgressStepper
          direction={direction}
          currentStep={bridgeState.step}
          transactions={transactions}
          onRetry={
            bridgeState.step === SimpleBridgeStep.ERROR
              ? handleRetry
              : undefined
          }
        />

        {(bridgeState.step === SimpleBridgeStep.COMPLETE ||
          bridgeState.step === SimpleBridgeStep.ERROR) && (
          <div className="flex justify-center">
            <Button onClick={handleReset} variant="outline">
              Start New Transfer
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {/* Wallet Connection - Only show when wallets are not ready */}
      {!walletsReady && <DualWalletConnector direction={direction} />}

      {/* Transfer Form - Only show when wallets are connected */}
      {walletsReady && (
        <Card className="w-full">
          <CardContent className="space-y-6 pt-6">
            {/* Chain Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {/* From Chain */}
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
                      </div>
                    </div>
                  </div>
                </div>

                {/* Swap Button - Centered */}
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

                {/* To Chain */}
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
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="space-y-2">
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={
                    direction === "base-to-native"
                      ? "Enter Base TORUS amount"
                      : "Enter Native TORUS amount"
                  }
                  disabled={!walletsReady || isTransferInProgress}
                  className="w-full"
                />
                {/* Amount Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    type="button"
                    onClick={() => handleFractionClick(0.25)}
                    variant="outline"
                    disabled={!walletsReady || isTransferInProgress}
                    size="sm"
                    className="text-xs"
                  >
                    1/4
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleFractionClick(0.33)}
                    variant="outline"
                    disabled={!walletsReady || isTransferInProgress}
                    size="sm"
                    className="text-xs"
                  >
                    1/3
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleFractionClick(0.5)}
                    variant="outline"
                    disabled={!walletsReady || isTransferInProgress}
                    size="sm"
                    className="text-xs"
                  >
                    1/2
                  </Button>
                  <Button
                    type="button"
                    onClick={handleMaxClick}
                    variant="outline"
                    disabled={!walletsReady || isTransferInProgress}
                    size="sm"
                    className="text-xs"
                  >
                    All
                  </Button>
                </div>
              </div>
            </div>

            {/* Transaction Info */}
            <div className="bg-muted/50 space-y-3 rounded-lg p-4">
              <h3 className="text-sm font-medium">Transaction Details</h3>
              <div className="text-muted-foreground space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Transfer Type:</span>
                  <span>2-Step Bridge</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Time:</span>
                  <span>3-5 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Signatures Required:</span>
                  <span>2 transactions</span>
                </div>
              </div>

              {/* Important Warning */}
              <div className="border-yellow-600 bg-yellow-50 border-l-4 p-3">
                <div className="flex items-start">
                  <div className="ml-1">
                    <p className="text-yellow-800 text-xs font-medium">
                      ⚠️ Important: Stay on this page during the transfer process
                    </p>
                    <p className="text-yellow-700 mt-1 text-xs">
                      Do not close or navigate away from this tab. The process requires your attention for both transaction signatures.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isTransferInProgress}
              className="w-full"
              size="lg"
            >
              {isTransferInProgress
                ? "Processing..."
                : !walletsReady
                  ? "Connect Wallets"
                  : !amount
                    ? "Enter Amount"
                    : `Transfer ${amount} TORUS`}
            </Button>

            {/* Connection Status - Info only since wallets show automatically when not connected */}
            {!walletsReady && (
              <div className="text-muted-foreground text-center text-sm">
                Connect both wallets above to continue
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
