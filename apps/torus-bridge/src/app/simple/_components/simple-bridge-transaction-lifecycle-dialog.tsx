"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@torus-ts/ui/components/accordion";
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
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import type {
  SimpleBridgeDirection,
  SimpleBridgeTransaction,
} from "./simple-bridge-types";
import { SimpleBridgeStep } from "./simple-bridge-types";

interface TransactionLifecycleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  direction: SimpleBridgeDirection;
  currentStep: SimpleBridgeStep;
  transactions: SimpleBridgeTransaction[];
  amount: string;
  onRetry?: () => void;
}

interface LifecycleStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "pending" | "active" | "completed" | "error" | "waiting";
  estimatedTime?: string;
  txHash?: string;
  explorerUrl?: string;
  isSignatureRequired?: boolean;
  errorDetails?: string;
}

type StepStatus = "pending" | "active" | "completed" | "error" | "waiting";

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
  const step1Transaction = transactions.find((tx) => tx.step === 1);
  const step2Transaction = transactions.find((tx) => tx.step === 2);

  const [showSignatureWarning, setShowSignatureWarning] = useState(false);

  const isCurrentlySigning =
    currentStep === SimpleBridgeStep.STEP_1_SIGNING ||
    currentStep === SimpleBridgeStep.STEP_2_SIGNING;

  // Manage signature warning timer
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    if (isCurrentlySigning) {
      // Start timer to show warning after 30 seconds
      timer = setTimeout(() => {
        setShowSignatureWarning(true);
      }, 30000);
    } else {
      // Reset warning immediately when not signing
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowSignatureWarning(false);
    }

    return () => {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    };
  }, [isCurrentlySigning]);

  const createBaseToNativeSteps = (): LifecycleStep[] => [
    {
      id: "step1-sign",
      title: "Sign Base Transaction",
      description: "Please sign the transaction in your Base wallet",
      icon: <Wallet className="h-4 w-4" />,
      status: getStepStatus("step1-sign"),
      isSignatureRequired: true,
      errorDetails: step1Transaction?.errorDetails,
    },
    {
      id: "step1-confirm",
      title: "Base Transaction Confirming",
      description: "Waiting for Base network confirmation",
      icon: <Clock className="h-4 w-4" />,
      status: getStepStatus("step1-confirm"),
      estimatedTime: "~1-2 minutes",
      txHash: step1Transaction?.txHash,
      explorerUrl: step1Transaction?.explorerUrl,
    },
    {
      id: "step2-sign",
      title: "Sign Withdrawal Transaction",
      description: "Please sign the withdrawal in your EVM wallet (Torus EVM)",
      icon: <Wallet className="h-4 w-4" />,
      status: getStepStatus("step2-sign"),
      isSignatureRequired: true,
      errorDetails: step2Transaction?.errorDetails,
    },
    {
      id: "step2-confirm",
      title: "Withdrawal Confirming",
      description: "Waiting for Native Torus confirmation",
      icon: <Clock className="h-4 w-4" />,
      status: getStepStatus("step2-confirm"),
      estimatedTime: "~30-60 seconds",
      txHash: step2Transaction?.txHash,
      explorerUrl: step2Transaction?.explorerUrl,
    },
  ];

  const createNativeToBaseSteps = (): LifecycleStep[] => [
    {
      id: "step1-sign",
      title: "Sign Native Transaction",
      description: "Please sign the transaction in your Torus wallet",
      icon: <Wallet className="h-4 w-4" />,
      status: getStepStatus("step1-sign"),
      isSignatureRequired: true,
      errorDetails: step1Transaction?.errorDetails,
    },
    {
      id: "step1-confirm",
      title: "Native Transaction Confirming",
      description: "Waiting for Native Torus confirmation",
      icon: <Clock className="h-4 w-4" />,
      status: getStepStatus("step1-confirm"),
      estimatedTime: "~30-60 seconds",
      txHash: step1Transaction?.txHash,
      explorerUrl: step1Transaction?.explorerUrl,
    },
    {
      id: "step2-sign",
      title: "Sign Base Transaction",
      description: "Please sign the transaction in your Base wallet",
      icon: <Wallet className="h-4 w-4" />,
      status: getStepStatus("step2-sign"),
      isSignatureRequired: true,
      errorDetails: step2Transaction?.errorDetails,
    },
    {
      id: "step2-confirm",
      title: "Base Transaction Confirming",
      description: "Waiting for Base network confirmation",
      icon: <Clock className="h-4 w-4" />,
      status: getStepStatus("step2-confirm"),
      estimatedTime: "~1-2 minutes",
      txHash: step2Transaction?.txHash,
      explorerUrl: step2Transaction?.explorerUrl,
    },
  ];

  const getLifecycleSteps = (): LifecycleStep[] => {
    const steps = isBaseToNative
      ? createBaseToNativeSteps()
      : createNativeToBaseSteps();

    if (currentStep === SimpleBridgeStep.COMPLETE) {
      steps.push({
        id: "success",
        title: "🎉 Transfer Successful",
        description: `Congratulations! Your ${amount} TORUS tokens have been successfully bridged from ${isBaseToNative ? "Base to Native" : "Native to Base"}. Check your wallet balances.`,
        icon: null,
        status: "completed",
      });
    }

    return steps;
  };

  function getErrorStepStatus(stepId: string): StepStatus | null {
    const isStep1 = stepId.startsWith("step1");
    const isStep2 = stepId.startsWith("step2");
    const step2Transaction = transactions.find((tx) => tx.step === 2);
    const step1Transaction = transactions.find((tx) => tx.step === 1);

    // Check if step 2 has an error
    if (step2Transaction?.status === "ERROR") {
      // All step 1 items should be green when step 2 fails
      if (isStep1) {
        return "completed";
      }

      // Step 2 handling - check errorPhase to determine which substep failed
      if (isStep2) {
        const errorPhase = step2Transaction.errorPhase;
        if (errorPhase === "sign" && stepId === "step2-sign") return "error";
        if (errorPhase === "confirm" && stepId === "step2-confirm")
          return "error";
        // Fallback to existing behavior if errorPhase not set
        if (!errorPhase) {
          if (stepId === "step2-sign") return "error";
          if (stepId === "step2-confirm") return "pending";
        }
        // If errorPhase is set but doesn't match current stepId, mark as pending
        return "pending";
      }
    }

    // Check if step 1 has an error
    if (step1Transaction?.status === "ERROR" && isStep1) {
      const errorPhase = step1Transaction.errorPhase;
      if (errorPhase === "sign" && stepId === "step1-sign") return "error";
      if (errorPhase === "confirm" && stepId === "step1-confirm")
        return "error";
      // Fallback to existing behavior if errorPhase not set
      if (!errorPhase) {
        if (stepId === "step1-sign") return "error";
        if (stepId === "step1-confirm") return "pending";
      }
      // If errorPhase is set but doesn't match current stepId, mark as pending
      return "pending";
    }

    // Step 1 error means step 2 is all pending
    if (step1Transaction?.status === "ERROR" && isStep2) {
      return "pending";
    }

    return null;
  }

  function getStep1Status(stepId: string): StepStatus {
    if (currentStep === SimpleBridgeStep.IDLE) return "pending";

    if (
      currentStep === SimpleBridgeStep.STEP_1_PREPARING ||
      currentStep === SimpleBridgeStep.STEP_1_SIGNING
    ) {
      if (stepId === "step1-sign") return "active";
      return "pending";
    }

    if (currentStep === SimpleBridgeStep.STEP_1_CONFIRMING) {
      if (stepId === "step1-sign") return "completed";
      if (stepId === "step1-confirm") return "active";
      return "pending";
    }

    if (
      currentStep === SimpleBridgeStep.STEP_1_COMPLETE ||
      currentStep === SimpleBridgeStep.STEP_2_PREPARING ||
      currentStep === SimpleBridgeStep.STEP_2_SWITCHING ||
      currentStep === SimpleBridgeStep.STEP_2_SIGNING ||
      currentStep === SimpleBridgeStep.STEP_2_CONFIRMING ||
      currentStep === SimpleBridgeStep.COMPLETE
    ) {
      return "completed";
    }

    return "pending";
  }

  function getStep2Status(stepId: string): StepStatus {
    if (
      currentStep === SimpleBridgeStep.IDLE ||
      currentStep === SimpleBridgeStep.STEP_1_PREPARING ||
      currentStep === SimpleBridgeStep.STEP_1_SIGNING ||
      currentStep === SimpleBridgeStep.STEP_1_CONFIRMING
    ) {
      return "pending";
    }

    if (currentStep === SimpleBridgeStep.STEP_1_COMPLETE) {
      return "pending";
    }

    if (
      currentStep === SimpleBridgeStep.STEP_2_PREPARING ||
      currentStep === SimpleBridgeStep.STEP_2_SWITCHING ||
      currentStep === SimpleBridgeStep.STEP_2_SIGNING
    ) {
      if (stepId === "step2-sign") return "active";
      return "pending";
    }

    if (currentStep === SimpleBridgeStep.STEP_2_CONFIRMING) {
      if (stepId === "step2-sign") return "completed";
      if (stepId === "step2-confirm") return "active";
      return "pending";
    }

    if (currentStep === SimpleBridgeStep.COMPLETE) {
      return "completed";
    }

    return "pending";
  }

  function getStepStatus(stepId: string): StepStatus {
    // Declare once at top
    const isStep1 = stepId.startsWith("step1");
    const isStep2 = stepId.startsWith("step2");

    if (currentStep === SimpleBridgeStep.ERROR) {
      const errorStatus = getErrorStepStatus(stepId);
      if (errorStatus) return errorStatus;
    }

    // Use the declared isStep1/isStep2
    if (isStep1) {
      return getStep1Status(stepId);
    }

    if (isStep2) {
      return getStep2Status(stepId);
    }

    return "pending";
  }

  const getStatusIcon = (status: StepStatus) => {
    if (status === "completed") {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }

    if (status === "active") {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }

    if (status === "waiting") {
      return <Clock className="h-5 w-5 text-yellow-500" />;
    }

    if (status === "error") {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }

    return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
  };

  const getStatusColor = (status: StepStatus) => {
    if (status === "completed") return "text-green-600";
    if (status === "active") return "text-blue-600";
    if (status === "waiting") return "text-yellow-600";
    if (status === "error") return "text-red-600";
    return "text-gray-500";
  };

  const getCurrentMessage = () => {
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
      return "🎉 Transfer complete! All transactions successful.";
    }

    if (currentStep === SimpleBridgeStep.ERROR) {
      return "❌ Transaction failed. Please try again.";
    }

    return "Initializing transfer...";
  };

  const lifecycleSteps = getLifecycleSteps();
  const isCompleted = currentStep === SimpleBridgeStep.COMPLETE;
  const hasError =
    currentStep === SimpleBridgeStep.ERROR ||
    transactions.some((tx) => tx.status === "ERROR");

  useEffect(() => {
    if (env("NODE_ENV") !== "development") {
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

  const handleOpenChange = (open: boolean) => {
    // Always allow explicit close via X button or when complete
    if (!open) {
      onClose();
    }
  };

  const getStepConnectorColor = (status: StepStatus) => {
    if (status === "completed") return "bg-green-500";
    if (status === "active") return "bg-blue-500";
    if (status === "error") return "bg-red-500";
    return "bg-gray-300";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[85vh] max-w-2xl flex-col p-0"
        onEscapeKeyDown={(e) => {
          // Prevent closing on Escape when there's an error
          if (hasError) {
            e.preventDefault();
          }
        }}
        onPointerDownOutside={(e) => {
          // Prevent closing on outside click when there's an error
          if (hasError) {
            e.preventDefault();
          }
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
            <p className="text-sm font-medium">{getCurrentMessage()}</p>
          </div>

          <div className="space-y-4">
            {lifecycleSteps.map((step, index) => (
              <div key={step.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex-shrink-0">
                    {getStatusIcon(step.status)}
                  </div>
                  {index < lifecycleSteps.length - 1 && (
                    <div
                      className={`mt-2 w-px flex-1 ${getStepConnectorColor(step.status)}`}
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {step.icon && (
                        <span className={`mr-2 ${getStatusColor(step.status)}`}>
                          {step.icon}
                        </span>
                      )}
                      <h3
                        className={`font-medium ${getStatusColor(step.status)}`}
                      >
                        {step.title}
                      </h3>
                      {step.isSignatureRequired && step.status === "active" && (
                        <span className="rounded-full border border-blue-200 bg-transparent px-2 py-1 text-xs text-blue-600">
                          Signature Required
                        </span>
                      )}
                    </div>
                    {step.estimatedTime && (
                      <span className="text-muted-foreground text-xs">
                        {step.estimatedTime}
                      </span>
                    )}
                  </div>

                  <p className="text-muted-foreground mt-1 text-sm">
                    {step.description}
                  </p>

                  {/* Signature Warning Message */}
                  {showSignatureWarning &&
                    step.isSignatureRequired &&
                    step.status === "active" && (
                      <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-200 bg-transparent p-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                        <div className="flex-1">
                          <p className="text-sm text-amber-700">
                            Please check your wallet and approve the transaction
                            signature
                          </p>
                        </div>
                      </div>
                    )}

                  {step.status === "error" && step.errorDetails && (
                    <div className="mt-2 rounded-md border border-red-500 bg-transparent p-3">
                      <p className="text-sm font-medium text-red-600">
                        {step.errorDetails}
                      </p>
                    </div>
                  )}

                  {step.status === "completed" &&
                    step.txHash &&
                    step.explorerUrl && (
                      <Accordion type="single" collapsible className="mt-2">
                        <AccordionItem value="details">
                          <AccordionTrigger className="text-sm">
                            <ExternalLink className="mr-1 h-3 w-3" />
                            View Transaction Details
                          </AccordionTrigger>
                          <AccordionContent className="space-y-2 text-sm">
                            <div>
                              Amount: <strong>{amount} TORUS</strong>
                            </div>
                            <div>
                              Network:{" "}
                              <strong>
                                {step.title.includes("Base")
                                  ? "Base"
                                  : step.title.includes("Native")
                                    ? "Torus Native"
                                    : "Torus EVM"}
                              </strong>
                            </div>
                            <div>
                              Transaction ID:{" "}
                              <span className="font-mono text-xs">
                                {step.txHash.slice(0, 10)}...
                                {step.txHash.slice(-8)}
                              </span>
                            </div>
                            <div>
                              Gas Fees:{" "}
                              <em>
                                Estimated ~0.001 ETH (actual varies by network)
                              </em>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(step.explorerUrl, "_blank");
                              }}
                              className="mt-2 w-full justify-start"
                            >
                              <ExternalLink className="mr-1 h-3 w-3" />
                              View on Explorer
                            </Button>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
                </div>
              </div>
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
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
