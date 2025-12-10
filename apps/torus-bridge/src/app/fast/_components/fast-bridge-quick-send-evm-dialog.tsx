"use client";

import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { Button } from "@torus-ts/ui/components/button";
import { Card, CardContent } from "@torus-ts/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@torus-ts/ui/components/dialog";
import { cn } from "@torus-ts/ui/lib/utils";
import { AlertCircle, Check, CheckCircle2, Loader2, Zap } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  formatErrorForUser,
  isUserRejectionError,
} from "../hooks/fast-bridge-helpers";

interface QuickSendEvmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  evmBalance: bigint;
  onSendToNative: (amount: bigint) => Promise<void>;
  onSendToBase: (amount: bigint) => Promise<void>;
  formatAmount: (amount: bigint) => string;
  currentEvmBalance?: bigint;
  refetchBalances?: () => Promise<void>;
  onRecoverySuccess?: () => void;
}

type TransferStatus = "idle" | "sending" | "success" | "error";

// Gas reserve for EVM transactions: 0.01 TORUS (aligned with standard bridge)
const GAS_RESERVE_WEI = 10n ** 16n;

// Dust threshold: 0.01 TORUS - balance below this is considered "near zero"
const DUST_THRESHOLD_WEI = 10n ** 16n;

// Balance decrease detection: require at least 80% of expected transfer
const BALANCE_DECREASE_THRESHOLD_NUMERATOR = 8n;
const BALANCE_DECREASE_THRESHOLD_DENOMINATOR = 10n;

export function QuickSendEvmDialog({
  isOpen,
  onClose,
  evmBalance,
  onSendToNative,
  onSendToBase,
  formatAmount,
  currentEvmBalance,
  refetchBalances,
  onRecoverySuccess,
}: QuickSendEvmDialogProps) {
  const [status, setStatus] = useState<TransferStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [selectedDestination, setSelectedDestination] = useState<
    "native" | "base" | null
  >(null);

  // Save original amount to display consistently
  const [originalAmount, setOriginalAmount] = useState<bigint>(0n);
  const [originalDestination, setOriginalDestination] = useState<string>("");
  const initialBalanceRef = useRef<bigint | null>(null);

  // Monitor EVM balance to auto-complete when transfer is detected
  useEffect(() => {
    if (status !== "sending" || currentEvmBalance === undefined) {
      return;
    }

    // Save initial balance on first check
    if (initialBalanceRef.current === null) {
      initialBalanceRef.current = currentEvmBalance;
      return;
    }

    // Calculate how much balance has decreased
    const balanceDecrease = initialBalanceRef.current - currentEvmBalance;

    // Expected decrease is the original amount minus gas reserve
    const expectedDecrease =
      originalAmount > GAS_RESERVE_WEI ? originalAmount - GAS_RESERVE_WEI : 0n;

    // Detection logic:
    // 1. If balance is now very small (dust threshold), consider it complete
    // 2. OR if balance decreased by at least 80% of expected amount
    const minExpectedDecrease =
      (expectedDecrease * BALANCE_DECREASE_THRESHOLD_NUMERATOR) /
      BALANCE_DECREASE_THRESHOLD_DENOMINATOR;

    const isBalanceNearZero = currentEvmBalance < DUST_THRESHOLD_WEI;
    const hasDecreasedEnough = balanceDecrease >= minExpectedDecrease;

    if (isBalanceNearZero || hasDecreasedEnough) {
      // Force refresh all balances (fire and forget, don't block success)
      if (refetchBalances) {
        refetchBalances().catch((err) => {
          console.warn("Failed to refetch balances after transfer:", err);
        });
      }

      // Mark failed transactions as recovered
      if (onRecoverySuccess) {
        onRecoverySuccess();
      }

      setStatus("success");
      initialBalanceRef.current = null;
    }
  }, [
    currentEvmBalance,
    status,
    refetchBalances,
    originalAmount,
    onRecoverySuccess,
  ]);

  const handleSend = async (destination: "native" | "base") => {
    setSelectedDestination(destination);
    setStatus("sending");
    setErrorMessage("");

    // Save the full balance for display (user understands gas will be deducted)
    setOriginalAmount(evmBalance);
    setOriginalDestination(
      destination === "native" ? "Torus Native" : "Base Chain",
    );

    // Send the full balance - the handler will subtract gas reserve
    const sendPromise =
      destination === "native"
        ? onSendToNative(evmBalance)
        : onSendToBase(evmBalance);

    const [error, _] = await tryAsync(sendPromise);
    if (error !== undefined) {
      setStatus("error");

      if (isUserRejectionError(error)) {
        setErrorMessage("You cancelled the transaction");
        return;
      }

      setErrorMessage(formatErrorForUser(error));
    }

    // Note: The useEffect monitoring currentEvmBalance will handle completion
    // when balance decreases, so we don't manually complete here
  };

  const handleClose = () => {
    if (status !== "sending") {
      setStatus("idle");
      setErrorMessage("");
      setSelectedDestination(null);
      setOriginalAmount(0n);
      setOriginalDestination("");
      initialBalanceRef.current = null;
      onClose();
    }
  };

  if (status === "sending") {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="bg-primary/10 flex h-24 w-24 items-center justify-center rounded-full">
              <Loader2 className="text-primary h-12 w-12 animate-spin" />
            </div>
            <div className="text-center">
              <h3 className="mb-2 text-xl font-semibold">
                Sending Transaction
              </h3>
              <p className="text-muted-foreground text-sm">
                Transferring{" "}
                <span className="font-semibold">
                  {formatAmount(originalAmount)} TORUS
                </span>{" "}
                to <span className="font-semibold">{originalDestination}</span>
              </p>
              <p className="text-muted-foreground mt-4 text-sm">
                Please confirm the transaction in your wallet and wait for
                completion...
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (status === "success") {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <div className="text-center">
              <h3 className="mb-2 text-xl font-semibold text-green-500">
                Transfer Complete!
              </h3>
              <p className="text-muted-foreground text-sm">
                Successfully sent{" "}
                <span className="font-semibold">
                  {formatAmount(originalAmount)} TORUS
                </span>{" "}
                to <span className="font-semibold">{originalDestination}</span>
              </p>
            </div>
            <Button onClick={handleClose} size="lg" className="w-full">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (status === "error") {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <div className="text-center">
              <h3 className="mb-2 text-xl font-semibold text-red-500">
                Transfer Failed
              </h3>
              <p className="text-muted-foreground text-sm">
                Failed to send to{" "}
                <span className="font-semibold">
                  {selectedDestination === "native"
                    ? "Torus Native"
                    : "Base Chain"}
                </span>
              </p>
              {errorMessage && (
                <div className="bg-muted/50 mt-4 rounded-md p-3">
                  <p className="whitespace-pre-line break-words text-sm">
                    {errorMessage}
                  </p>
                </div>
              )}
            </div>
            <div className="flex w-full gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                size="lg"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  handleSend(
                    selectedDestination === "native" ? "native" : "base",
                  )
                }
                size="lg"
                className="flex-1"
              >
                Retry
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Zap className="text-primary h-5 w-5" />
            EVM Recover
          </DialogTitle>
          <DialogDescription className="text-sm">
            Recover your EVM balance by transferring it to Torus Native or Base
            chain. Gas fees are automatically reserved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Card className="border-border p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Image
                  src="/assets/icons/balance/torus-evm.svg"
                  alt="Torus EVM"
                  width={24}
                  height={24}
                  className="flex-shrink-0"
                />
                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  EVM Balance
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">
                  {formatAmount(evmBalance)}
                </span>
                <span className="text-muted-foreground text-lg font-medium">
                  TORUS
                </span>
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Select Destination Chain</h3>

            <div className="grid gap-3 md:grid-cols-2">
              <Card
                className={cn(
                  "border-border hover:border-primary group cursor-pointer transition-all hover:shadow-md",
                )}
                onClick={() => handleSend("native")}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <Image
                      src="/assets/icons/balance/torus-native.svg"
                      alt="Torus Native"
                      width={64}
                      height={64}
                      className="flex-shrink-0"
                    />
                    <div>
                      <h4 className="mb-1 text-lg font-semibold">
                        Torus Native
                      </h4>
                      <p className="text-muted-foreground text-xs">
                        Send to Torus Native chain
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="pointer-events-none w-full"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Select
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={cn(
                  "border-border hover:border-primary group cursor-pointer transition-all hover:shadow-md",
                )}
                onClick={() => handleSend("base")}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <Image
                      src="/assets/icons/balance/torus-base.svg"
                      alt="Base"
                      width={64}
                      height={64}
                      className="flex-shrink-0"
                    />
                    <div>
                      <h4 className="mb-1 text-lg font-semibold">Base Chain</h4>
                      <p className="text-muted-foreground text-xs">
                        Send to Base mainnet
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="pointer-events-none w-full"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Select
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
