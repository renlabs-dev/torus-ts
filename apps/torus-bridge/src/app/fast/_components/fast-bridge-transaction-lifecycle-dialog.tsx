"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@torus-ts/ui/components/alert-dialog";
import { Button } from "@torus-ts/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@torus-ts/ui/components/dialog";
import { env } from "~/env";
import { logger } from "~/utils/logger";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTransactionLifecycleSteps } from "../hooks/use-transaction-lifecycle-steps";
import { TransactionStepItem } from "./fast-bridge-transaction-step-item";
import type {
  SimpleBridgeDirection,
  SimpleBridgeTransaction,
} from "./fast-bridge-types";
import { SimpleBridgeStep } from "./fast-bridge-types";

interface TransactionLifecycleDialogProps {
  isOpen: boolean;
  onClose: (force?: boolean) => void;
  direction: SimpleBridgeDirection;
  currentStep: SimpleBridgeStep;
  transactions: SimpleBridgeTransaction[];
  amount: string;
  onRetry?: () => void;
}

function getCurrentMessage(currentStep: SimpleBridgeStep) {
  if (
    currentStep === SimpleBridgeStep.STEP_1_PREPARING ||
    currentStep === SimpleBridgeStep.STEP_1_SIGNING
  ) {
    return "Please check your wallet and sign the transaction";
  }

  if (currentStep === SimpleBridgeStep.STEP_1_CONFIRMING) {
    return "Transaction submitted! Waiting for network confirmation...";
  }

  if (currentStep === SimpleBridgeStep.STEP_1_COMPLETE) {
    return "First step complete! Preparing second transaction...";
  }

  if (
    currentStep === SimpleBridgeStep.STEP_2_PREPARING ||
    currentStep === SimpleBridgeStep.STEP_2_SWITCHING ||
    currentStep === SimpleBridgeStep.STEP_2_SIGNING
  ) {
    return "Please check your wallet and sign the second transaction";
  }

  if (currentStep === SimpleBridgeStep.STEP_2_CONFIRMING) {
    return "Final transaction submitted! Almost done...";
  }

  if (currentStep === SimpleBridgeStep.COMPLETE) {
    return "Transfer complete! All transactions successful.";
  }

  if (currentStep === SimpleBridgeStep.ERROR) {
    return "Transaction failed. Please try again.";
  }

  return "Initializing transfer...";
}

export function TransactionLifecycleDialog({
  isOpen,
  onClose,
  direction,
  currentStep,
  transactions,
  amount,
  onRetry,
}: TransactionLifecycleDialogProps) {
  const isBaseToNative = direction === "base-to-native";
  const [showSignatureWarning, setShowSignatureWarning] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const openedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      openedAtRef.current = Date.now();
    } else {
      openedAtRef.current = null;
    }
  }, [isOpen]);

  const isJustOpened = useCallback(() => {
    if (!openedAtRef.current) return true;
    return Date.now() - openedAtRef.current < 500;
  }, []);

  const isCurrentlySigning =
    currentStep === SimpleBridgeStep.STEP_1_SIGNING ||
    currentStep === SimpleBridgeStep.STEP_2_SIGNING;

  useEffect(() => {
    if (!isCurrentlySigning) {
      return;
    }

    const timer = setTimeout(() => {
      setShowSignatureWarning(true);
    }, 30000);

    return () => {
      clearTimeout(timer);
      setShowSignatureWarning(false);
    };
  }, [isCurrentlySigning]);

  const lifecycleSteps = useTransactionLifecycleSteps(
    direction,
    currentStep,
    transactions,
    amount,
  );

  const isCompleted = currentStep === SimpleBridgeStep.COMPLETE;
  const hasError =
    currentStep === SimpleBridgeStep.ERROR ||
    transactions.some((tx) => tx.status === "ERROR");

  useEffect(() => {
    if (env("NEXT_PUBLIC_TORUS_CHAIN_ENV") === "mainnet") {
      return;
    }

    logger.debug("Dialog State Debug:", {
      currentStep,
      hasError,
      transactions: transactions.map((t) => ({
        step: t.step,
        status: t.status,
        message: t.message,
      })),
      direction,
      lifecycleSteps: lifecycleSteps.map((s) => ({
        id: s.id,
        status: s.status,
      })),
    });
  }, [currentStep, hasError, transactions, direction, lifecycleSteps]);

  const isInProgress = !hasError && !isCompleted;

  const handleCloseAttempt = useCallback(() => {
    if (isJustOpened()) return;

    if (isInProgress) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  }, [isInProgress, isJustOpened, onClose]);

  const handleConfirmClose = useCallback(() => {
    setShowCloseConfirm(false);
    onClose(true);
  }, [onClose]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        handleCloseAttempt();
      }
    },
    [handleCloseAttempt],
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[85vh] max-w-2xl flex-col p-0"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          handleCloseAttempt();
        }}
        onPointerDownOutside={(e) => {
          e.preventDefault();
          handleCloseAttempt();
        }}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        onFocusOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2">
            Transfer Progress
            <span className="text-muted-foreground text-sm font-normal">
              ({amount} TORUS -{" "}
              {isBaseToNative ? "Base → Native" : "Native → Base"})
            </span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Monitor the progress of your token transfer between chains.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm font-medium">
              {getCurrentMessage(currentStep)}
            </p>
          </div>

          <div className="space-y-4">
            {lifecycleSteps.map((step, index) => (
              <TransactionStepItem
                key={step.id}
                {...step}
                showSignatureWarning={showSignatureWarning}
                amount={amount}
                isLast={index === lifecycleSteps.length - 1}
              />
            ))}
          </div>
        </div>

        {(hasError || isCompleted) && (
          <div className="bg-background flex shrink-0 justify-end gap-3 border-t px-6 py-4">
            {hasError && onRetry && (
              <Button onClick={onRetry} variant="outline">
                Retry Transfer
              </Button>
            )}

            {isCompleted && (
              <Button onClick={() => onClose()} variant="outline">
                Close
              </Button>
            )}
          </div>
        )}
      </DialogContent>

      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              Your transaction is still in progress. If you close now, you may
              need to retry or recover the transaction later from the history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-primary text-primary-foreground hover:bg-primary/90">
              Continue Transaction
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClose}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              Close Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
