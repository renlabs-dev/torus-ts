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
import {
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2,
  Network,
  Wallet,
} from "lucide-react";
import { useEffect } from "react";
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

  const createBaseToNativeSteps = (): LifecycleStep[] => [
    {
      id: "step1-prepare",
      title: "Preparing Base Transfer",
      description: "Setting up Hyperlane transfer from Base to Torus EVM",
      icon: <Network className="h-4 w-4" />,
      status: getStepStatus("step1-prepare"),
    },
    {
      id: "step1-sign",
      title: "Sign Base Transaction",
      description: "Please sign the transaction in your Base wallet",
      icon: <Wallet className="h-4 w-4" />,
      status: getStepStatus("step1-sign"),
      isSignatureRequired: true,
    },
    {
      id: "step1-confirm",
      title: "Base Transaction Confirming",
      description: "Waiting for Base network confirmation",
      icon: <Clock className="h-4 w-4" />,
      status: getStepStatus("step1-confirm"),
      estimatedTime: "~2-3 minutes",
      txHash: step1Transaction?.txHash,
      explorerUrl: step1Transaction?.explorerUrl,
    },
    {
      id: "step2-prepare",
      title: "Preparing Withdrawal",
      description: "Setting up withdrawal from Torus EVM to Native Torus",
      icon: <Network className="h-4 w-4" />,
      status: getStepStatus("step2-prepare"),
    },
    {
      id: "step2-switch",
      title: "Switch to Torus EVM",
      description: "Connecting to the Torus EVM network for the next step",
      icon: <Network className="h-4 w-4" />,
      status: getStepStatus("step2-switch"),
    },
    {
      id: "step2-sign",
      title: "Sign Withdrawal Transaction",
      description: "Please sign the withdrawal in your EVM wallet (Torus EVM)",
      icon: <Wallet className="h-4 w-4" />,
      status: getStepStatus("step2-sign"),
      isSignatureRequired: true,
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
      id: "step1-prepare",
      title: "Preparing Native Transfer",
      description: "Setting up bridge from Native Torus to Torus EVM",
      icon: <Network className="h-4 w-4" />,
      status: getStepStatus("step1-prepare"),
    },
    {
      id: "step1-sign",
      title: "Sign Native Transaction",
      description: "Please sign the transaction in your Torus wallet",
      icon: <Wallet className="h-4 w-4" />,
      status: getStepStatus("step1-sign"),
      isSignatureRequired: true,
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
      id: "step2-prepare",
      title: "Preparing Base Transfer",
      description: "Setting up Hyperlane transfer from Torus EVM to Base",
      icon: <Network className="h-4 w-4" />,
      status: getStepStatus("step2-prepare"),
    },
    {
      id: "step2-switch",
      title: "Switch to Torus EVM",
      description: "Connecting to the Torus EVM network for the next step",
      icon: <Network className="h-4 w-4" />,
      status: getStepStatus("step2-switch"),
    },
    {
      id: "step2-sign",
      title: "Sign Base Transaction",
      description: "Please sign the transaction in your Base wallet",
      icon: <Wallet className="h-4 w-4" />,
      status: getStepStatus("step2-sign"),
      isSignatureRequired: true,
    },
    {
      id: "step2-confirm",
      title: "Base Transaction Confirming",
      description: "Waiting for Base network confirmation",
      icon: <Clock className="h-4 w-4" />,
      status: getStepStatus("step2-confirm"),
      estimatedTime: "~2-3 minutes",
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
        title: "Transfer Successful",
        description: `Congratulations! Your ${amount} TORUS tokens have been successfully bridged from ${isBaseToNative ? "Base to Native" : "Native to Base"}. Check your wallet balances.`,
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        status: "completed",
      });
    }

    return steps;
  };

  function getErrorStepStatus(stepId: string): StepStatus | null {
    const isStep1 = stepId.startsWith("step1");
    const isStep2 = stepId.startsWith("step2");
    const transaction = transactions.find(
      (tx) => tx.step === (isStep1 ? 1 : 2),
    );

    if (!transaction || transaction.status !== "ERROR") {
      return null;
    }

    if (transaction.step === 1 && isStep1) {
      if (stepId === "step1-sign") return "error";
      if (stepId === "step1-prepare") return "completed";
      if (stepId === "step1-confirm") return "pending";
    }

    if (transaction.step === 2 && isStep2) {
      if (stepId === "step2-sign") return "error";
      if (stepId === "step2-prepare") return "completed";
      if (stepId === "step2-confirm") return "pending";
    }

    if (transaction.step === 1 && isStep2) return "pending";
    if (transaction.step === 2 && isStep1) return "completed";

    return null;
  }

  function getStep1Status(stepId: string): StepStatus {
    if (currentStep === SimpleBridgeStep.IDLE) return "pending";

    if (currentStep === SimpleBridgeStep.STEP_1_PREPARING) {
      return stepId === "step1-prepare" ? "active" : "pending";
    }

    if (currentStep === SimpleBridgeStep.STEP_1_SIGNING) {
      if (stepId === "step1-prepare") return "completed";
      if (stepId === "step1-sign") return "active";
      return "pending";
    }

    if (currentStep === SimpleBridgeStep.STEP_1_CONFIRMING) {
      if (stepId === "step1-prepare" || stepId === "step1-sign") {
        return "completed";
      }
      if (stepId === "step1-confirm") return "active";
      return "pending";
    }

    if (
      currentStep === SimpleBridgeStep.STEP_1_COMPLETE ||
      currentStep === SimpleBridgeStep.STEP_2_PREPARING ||
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
      return stepId === "step2-prepare" ? "waiting" : "pending";
    }

    if (currentStep === SimpleBridgeStep.STEP_2_PREPARING) {
      return stepId === "step2-prepare" ? "active" : "pending";
    }

    if (currentStep === SimpleBridgeStep.STEP_2_SIGNING) {
      if (stepId === "step2-prepare") return "completed";
      if (stepId === "step2-sign") return "active";
      return "pending";
    }

    if (currentStep === SimpleBridgeStep.STEP_2_CONFIRMING) {
      if (stepId === "step2-prepare" || stepId === "step2-sign") {
        return "completed";
      }
      if (stepId === "step2-confirm") return "active";
      return "pending";
    }

    if (currentStep === SimpleBridgeStep.COMPLETE) {
      return "completed";
    }

    return "pending";
  }

  function getSwitchStepStatus(): StepStatus {
    if (currentStep === SimpleBridgeStep.STEP_2_SWITCHING) {
      return "active";
    }

    if (
      currentStep === SimpleBridgeStep.STEP_2_PREPARING ||
      currentStep === SimpleBridgeStep.STEP_2_SIGNING ||
      currentStep === SimpleBridgeStep.STEP_2_CONFIRMING ||
      currentStep === SimpleBridgeStep.COMPLETE
    ) {
      return "completed";
    }

    const tx = transactions.find((t) => t.step === 2);
    if (
      currentStep === SimpleBridgeStep.ERROR &&
      tx?.status === "ERROR" &&
      tx.metadata?.type === "switch"
    ) {
      return "error";
    }

    return "pending";
  }

  function getStepStatus(stepId: string): StepStatus {
    if (currentStep === SimpleBridgeStep.ERROR) {
      const errorStatus = getErrorStepStatus(stepId);
      if (errorStatus) return errorStatus;
    }

    if (stepId === "step2-switch") {
      return getSwitchStepStatus();
    }

    const isStep1 = stepId.startsWith("step1");
    if (isStep1) {
      return getStep1Status(stepId);
    }

    const isStep2 = stepId.startsWith("step2");
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
    if (currentStep === SimpleBridgeStep.STEP_1_PREPARING) {
      return "Setting up your first transaction...";
    }

    if (currentStep === SimpleBridgeStep.STEP_1_SIGNING) {
      return "🔐 Please check your wallet and sign the transaction";
    }

    if (currentStep === SimpleBridgeStep.STEP_1_CONFIRMING) {
      return "Transaction submitted! Waiting for network confirmation...";
    }

    if (currentStep === SimpleBridgeStep.STEP_1_COMPLETE) {
      return "First step complete! Preparing second transaction...";
    }

    if (currentStep === SimpleBridgeStep.STEP_2_PREPARING) {
      return "Setting up your second transaction...";
    }

    if (currentStep === SimpleBridgeStep.STEP_2_SIGNING) {
      return "🔐 Please check your wallet and sign the second transaction";
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

    if (currentStep === SimpleBridgeStep.STEP_2_SWITCHING) {
      return "Switching to Torus EVM – check your wallet for the network switch prompt";
    }

    return "Initializing transfer...";
  };

  const lifecycleSteps = getLifecycleSteps();
  const isCompleted = currentStep === SimpleBridgeStep.COMPLETE;
  const hasError = currentStep === SimpleBridgeStep.ERROR;

  useEffect(() => {
    // if (env("NODE_ENV") !== "development") {
    //   return;
    // }

    console.log("Dialog State Debug:", {
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
    if (!open && currentStep === SimpleBridgeStep.ERROR) {
      onClose();
    }
  };

  const getStepConnectorColor = (status: StepStatus) => {
    if (status === "completed") return "bg-green-500";
    if (status === "active") return "bg-blue-500";
    return "bg-gray-300";
  };

  const shouldShowSignatureWarning =
    currentStep === SimpleBridgeStep.STEP_1_SIGNING ||
    currentStep === SimpleBridgeStep.STEP_2_SIGNING;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
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

        <div className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm font-medium">{getCurrentMessage()}</p>
            {shouldShowSignatureWarning && (
              <p className="text-muted-foreground mt-2 text-xs">
                Please stay on this page until the transfer is complete
              </p>
            )}
          </div>

          <div className="space-y-4">
            {lifecycleSteps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  {getStatusIcon(step.status)}
                  {index < lifecycleSteps.length - 1 && (
                    <div
                      className={`mt-2 h-8 w-px ${getStepConnectorColor(step.status)}`}
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {step.icon}
                      <h3
                        className={`font-medium ${getStatusColor(step.status)}`}
                      >
                        {step.title}
                      </h3>
                      {step.isSignatureRequired && step.status === "active" && (
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">
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

                  {(step.status === "active" || step.status === "completed") &&
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
                                  : "Torus EVM"}
                              </strong>
                            </div>
                            <div>
                              Transaction ID:{" "}
                              <span className="font-mono text-xs">
                                {step.txHash.slice(0, 10)}...
                                {step.txHash.slice(-4)}
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

                  {step.txHash && step.explorerUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1 text-xs"
                        onClick={() => window.open(step.explorerUrl, "_blank")}
                      >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        View Transaction
                      </Button>
                    </div>
                  )}

                  {step.id === "step2-switch" && step.status === "error" && (
                    <div className="text-xs text-red-600">
                      Switch failed – retry to connect to Torus EVM
                    </div>
                  )}

                  {step.id === "success" && (
                    <Accordion type="single" collapsible className="mt-2">
                      <AccordionItem value="success-details">
                        <AccordionTrigger className="text-sm">
                          <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                          View Transfer Summary
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2 text-sm">
                          <div>Overview: Full flow completed successfully.</div>
                          <div>
                            Step 1 ({isBaseToNative ? "Base" : "Native"} Tx):{" "}
                            {step1Transaction?.status === "SUCCESS" &&
                            step1Transaction.txHash !== undefined ? (
                              <span className="font-mono text-xs">
                                {step1Transaction.txHash.slice(0, 10)}...
                              </span>
                            ) : (
                              "Processed – search explorer"
                            )}
                          </div>
                          <div>
                            Step 2 ({isBaseToNative ? "Torus EVM" : "Base"} Tx):{" "}
                            {step2Transaction?.status === "SUCCESS" &&
                            step2Transaction.txHash !== undefined ? (
                              <span className="font-mono text-xs">
                                {step2Transaction.txHash.slice(0, 10)}...
                              </span>
                            ) : (
                              "Processed"
                            )}
                          </div>
                          <div>
                            Total Fees:{" "}
                            <em>Estimated ~0.002 ETH (Step 1 + Step 2)</em>
                          </div>
                          <div>Time: Approximately 3-5 minutes.</div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              /* links to both explorers */
                            }}
                            className="mt-2 w-full justify-start"
                          >
                            <ExternalLink className="mr-1 h-3 w-3" />
                            View All Transactions
                          </Button>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
