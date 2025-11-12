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

  // Save original amount to display consistently
  const [originalAmount, setOriginalAmount] = useState<bigint>(0n);
  const [originalDestination, setOriginalDestination] = useState<string>("");
  const initialBalanceRef = useRef<bigint | null>(null);

  // Monitor EVM balance to auto-complete when transfer is detected
  useEffect(() => {
    if (status === "sending" && currentEvmBalance !== undefined) {
      // Save initial balance on first check
      if (initialBalanceRef.current === null) {
        initialBalanceRef.current = currentEvmBalance;
        return;
      }

      // Calculate how much balance has decreased
      const balanceDecrease = initialBalanceRef.current - currentEvmBalance;

      // Gas reserve is 0.005 TORUS (in 12 decimals, which equals 5 * 10^15 wei)
      const gasReserveWei = 5n * 10n ** 15n;

      // Expected decrease is the original amount minus gas reserve
      const expectedDecrease = originalAmount - gasReserveWei;

      // Detection logic:
      // 1. If balance is now very small (< 0.01 TORUS = 10^16 wei), consider it complete
      // 2. OR if balance decreased by at least 80% of expected amount
      const dustThreshold = 10n ** 16n; // 0.01 TORUS in wei
      const minExpectedDecrease = (expectedDecrease * 8n) / 10n; // 80%

      const isBalanceNearZero = currentEvmBalance < dustThreshold;
      const hasDecreasedEnough = balanceDecrease >= minExpectedDecrease;

      if (isBalanceNearZero || hasDecreasedEnough) {
        // Force refresh all balances
        if (refetchBalances) {
          refetchBalances().catch(console.error);
        }

        // Show success immediately
        setStatus("success");
        initialBalanceRef.current = null;
      }
    }
  }, [currentEvmBalance, status, refetchBalances, originalAmount]);

  const handleSend = async (destination: "native" | "base") => {
    setSelectedDestination(destination);
    setStatus("sending");
    setErrorMessage("");

    // Save original values for consistent display
    setOriginalAmount(evmBalance);
    setOriginalDestination(destination === "native" ? "Torus Native" : "Base Chain");

    try {
      // Send the exact amount shown in the dialog (evmBalance)
      if (destination === "native") {
        await onSendToNative(evmBalance);
      } else {
        await onSendToBase(evmBalance);
      }

      // Note: The useEffect monitoring currentEvmBalance will handle completion
      // when balance decreases, so we don't manually complete here
    } catch (error) {
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
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <div className="text-center">
              <h3 className="mb-2 text-xl font-semibold">Sending Transaction</h3>
              <p className="text-muted-foreground text-sm">
                Transferring <span className="font-semibold">{formatAmount(originalAmount)} TORUS</span> to{" "}
                <span className="font-semibold">{originalDestination}</span>
              </p>
              <p className="text-muted-foreground mt-4 text-sm">
                Please confirm the transaction in your wallet and wait for completion...
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
