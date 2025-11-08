"use client";

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

interface QuickSendEvmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  evmBalance: bigint;
  onSendToNative: (amount: bigint) => Promise<void>;
  onSendToBase: (amount: bigint) => Promise<void>;
  formatAmount: (amount: bigint) => string;
  currentEvmBalance?: bigint;
  refetchBalances?: () => Promise<void>;
}

type TransferStatus = "idle" | "sending" | "success" | "error";

export function QuickSendEvmDialog({
  isOpen,
  onClose,
  evmBalance,
  onSendToNative,
  onSendToBase,
  formatAmount,
  currentEvmBalance,
  refetchBalances,
}: QuickSendEvmDialogProps) {
  const [status, setStatus] = useState<TransferStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [selectedDestination, setSelectedDestination] = useState<
    "native" | "base" | null
  >(null);
  const [progress, setProgress] = useState(0);
  const [transactionSigned, setTransactionSigned] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save original amount to display consistently
  const [originalAmount, setOriginalAmount] = useState<bigint>(0n);
  const [originalDestination, setOriginalDestination] = useState<string>("");
  const initialBalanceRef = useRef<bigint | null>(null);

  // Monitor EVM balance to auto-complete when transfer is detected
  useEffect(() => {
    if (transactionSigned && currentEvmBalance !== undefined && status === "sending") {
      // Save initial balance on first check
      if (initialBalanceRef.current === null) {
        initialBalanceRef.current = currentEvmBalance;
        return;
      }

      // Calculate how much balance has decreased
      const balanceDecrease = initialBalanceRef.current - currentEvmBalance;
      const expectedDecrease = originalAmount - (5n * 10n ** 15n); // Original amount minus gas reserve

      // If balance decreased by at least 90% of expected amount, consider it complete
      // This handles cases where there's dust remaining or slight differences
      const minExpectedDecrease = (expectedDecrease * 9n) / 10n; // 90%

      if (balanceDecrease >= minExpectedDecrease) {
        // Clear any ongoing progress animations
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        if (progressTimeoutRef.current) {
          clearTimeout(progressTimeoutRef.current);
          progressTimeoutRef.current = null;
        }

        // Force refresh all balances
        if (refetchBalances) {
          refetchBalances().catch(console.error);
        }

        // Jump to 100% and show success immediately
        setProgress(100);
        setStatus("success");
        setTransactionSigned(false);
        initialBalanceRef.current = null;
      }
    }
  }, [currentEvmBalance, transactionSigned, status, refetchBalances, originalAmount]);

  const animateProgress = () => {
    setProgress(0);

    // Smooth continuous progress with gradual slowdown
    // 0-20%: Fast (~3 seconds)
    // 20-50%: Medium (~5 seconds)
    // 50-80%: Slow (~8 seconds)
    // 80-95%: Very slow (~10 seconds)
    // Never reaches 100% (only balance detection does that)

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 20) {
          // Fast phase: 0-20% in ~3 seconds
          return Math.min(prev + Math.random() * 1.5 + 1, 20);
        } else if (prev < 50) {
          // Medium phase: 20-50% in ~5 seconds
          return Math.min(prev + Math.random() * 0.8 + 0.4, 50);
        } else if (prev < 80) {
          // Slow phase: 50-80% in ~8 seconds
          return Math.min(prev + Math.random() * 0.4 + 0.2, 80);
        } else if (prev < 95) {
          // Very slow phase: 80-95% in ~10 seconds
          return Math.min(prev + Math.random() * 0.15 + 0.05, 95);
        }
        // Stay at 95%, waiting for balance detection
        return prev;
      });
    }, 200); // Check every 200ms for smooth animation

    progressIntervalRef.current = progressInterval;

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  };

  const handleSend = async (destination: "native" | "base") => {
    setSelectedDestination(destination);
    setStatus("sending");
    setErrorMessage("");
    setTransactionSigned(false);

    // Save original values for consistent display
    setOriginalAmount(evmBalance);
    setOriginalDestination(destination === "native" ? "Torus Native" : "Base Chain");

    let cleanup: (() => void) | null = null;

    try {
      // Send the exact amount shown in the dialog (evmBalance)
      if (destination === "native") {
        await onSendToNative(evmBalance);
      } else {
        await onSendToBase(evmBalance);
      }

      // Transaction signed successfully, start progress animation
      setTransactionSigned(true);
      cleanup = animateProgress();

      // Note: The useEffect monitoring currentEvmBalance will handle completion
      // when balance reaches 0, so we don't manually complete here
    } catch (error) {
      if (cleanup) cleanup();
      setTransactionSigned(false);

      const errorMsg = error instanceof Error ? error.message : "Transfer failed";

      if (
        errorMsg.includes("User rejected") ||
        errorMsg.includes("user rejected") ||
        errorMsg.includes("User denied") ||
        errorMsg.includes("user denied") ||
        errorMsg.includes("rejected") ||
        errorMsg.includes("cancelled") ||
        errorMsg.includes("canceled")
      ) {
        setStatus("error");
        setErrorMessage("You cancelled the transaction");
        return;
      }

      if (
        errorMsg.includes("locked") ||
        errorMsg.includes("Locked") ||
        errorMsg.includes("unlock")
      ) {
        setStatus("error");
        setErrorMessage("Your wallet is locked. Please unlock it and try again.");
        return;
      }

      setStatus("error");
      setErrorMessage(errorMsg);
    }
  };

  const handleClose = () => {
    if (status !== "sending") {
      setStatus("idle");
      setErrorMessage("");
      setSelectedDestination(null);
      setTransactionSigned(false);
      setProgress(0);
      setOriginalAmount(0n);
      setOriginalDestination("");
      initialBalanceRef.current = null;

      // Clear any pending intervals/timeouts
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (progressTimeoutRef.current) {
        clearTimeout(progressTimeoutRef.current);
        progressTimeoutRef.current = null;
      }

      onClose();
    }
  };

  if (status === "sending") {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="bg-primary/10 flex h-24 w-24 items-center justify-center rounded-full">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <div className="text-center">
              <h3 className="mb-2 text-xl font-semibold">Sending Transaction</h3>
              <p className="text-muted-foreground text-sm">
                Transferring <span className="font-semibold">{formatAmount(originalAmount)} TORUS</span> to{" "}
                <span className="font-semibold">{originalDestination}</span>
              </p>
            </div>

            {/* Only show progress bar after transaction is signed */}
            {transactionSigned ? (
              <div className="w-full space-y-3">
                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-muted-foreground text-center text-sm">
                  Transaction confirmed, processing transfer...
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-center text-sm">
                Please confirm the transaction in your wallet
              </p>
            )}
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
                Successfully sent <span className="font-semibold">{formatAmount(originalAmount)} TORUS</span> to{" "}
                <span className="font-semibold">{originalDestination}</span>
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
                  {selectedDestination === "native" ? "Torus Native" : "Base Chain"}
                </span>
              </p>
              {errorMessage && (
                <div className="bg-muted/50 mt-4 rounded-md p-3">
                  <p className="text-sm break-words">{errorMessage}</p>
                </div>
              )}
            </div>
            <div className="flex w-full gap-3">
              <Button variant="outline" onClick={handleClose} size="lg" className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() =>
                  handleSend(selectedDestination === "native" ? "native" : "base")
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
            <Zap className="h-5 w-5 text-primary" />
            Quick Send EVM
          </DialogTitle>
          <DialogDescription className="text-sm">
            Send your entire EVM balance to Native or Base in one click. Gas fees are automatically reserved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Card className="border-border p-6 opacity-60">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Image
                  src="/assets/icons/balance/torus-evm.svg"
                  alt="Torus EVM"
                  width={24}
                  height={24}
                  className="flex-shrink-0"
                />
                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Total EVM Balance
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{formatAmount(evmBalance)}</span>
                <span className="text-muted-foreground text-lg font-medium">TORUS</span>
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Select Destination Chain</h3>

            <div className="grid gap-3 md:grid-cols-2">
              <Card
                className={cn(
                  "border-border group cursor-pointer transition-all hover:border-primary hover:shadow-md",
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
                      <h4 className="mb-1 text-lg font-semibold">Torus Native</h4>
                      <p className="text-muted-foreground text-xs">
                        Send to Torus Native chain
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Select
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={cn(
                  "border-border group cursor-pointer transition-all hover:border-primary hover:shadow-md",
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
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground"
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
