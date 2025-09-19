"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@torus-ts/ui/components/card";
import { Button } from "@torus-ts/ui/components/button";
import {
  CheckCircle,
  Clock,
  Loader2,
  ArrowRight,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import type {
  SimpleBridgeDirection,
  SimpleBridgeTransaction
} from "./simple-bridge-types";
import { SimpleBridgeStep } from "./simple-bridge-types";

interface ProgressStepperProps {
  direction: SimpleBridgeDirection;
  currentStep: SimpleBridgeStep;
  transactions: SimpleBridgeTransaction[];
  onRetry?: () => void;
  className?: string;
}

export function ProgressStepper({
  direction,
  currentStep,
  transactions,
  onRetry,
  className = ""
}: ProgressStepperProps) {

  const getStepInfo = (step: 1 | 2) => {
    const isBaseToNative = direction === "base-to-native";

    if (step === 1) {
      return {
        title: isBaseToNative ? "Base → Torus EVM" : "Native → Torus EVM",
        description: isBaseToNative
          ? "Transfer tokens from Base to Torus EVM via Hyperlane"
          : "Bridge tokens from Native Torus to Torus EVM",
        chainName: isBaseToNative ? "Base" : "Torus Native",
        estimatedTime: isBaseToNative ? "2-3 minutes" : "30-60 seconds",
      };
    } else {
      return {
        title: isBaseToNative ? "Torus EVM → Native" : "Torus EVM → Base",
        description: isBaseToNative
          ? "Withdraw tokens from Torus EVM to Native Torus"
          : "Transfer tokens from Torus EVM to Base via Hyperlane",
        chainName: isBaseToNative ? "Torus EVM" : "Torus EVM",
        estimatedTime: isBaseToNative ? "30-60 seconds" : "2-3 minutes",
      };
    }
  };

  const getStepStatus = (step: 1 | 2) => {
    const transaction = transactions.find(tx => tx.step === step);

    if (step === 1) {
      switch (currentStep) {
        case SimpleBridgeStep.IDLE:
          return "pending";
        case SimpleBridgeStep.STEP_1_PREPARING:
        case SimpleBridgeStep.STEP_1_SIGNING:
        case SimpleBridgeStep.STEP_1_CONFIRMING:
          return "active";
        case SimpleBridgeStep.STEP_1_COMPLETE:
        case SimpleBridgeStep.STEP_2_PREPARING:
        case SimpleBridgeStep.STEP_2_SIGNING:
        case SimpleBridgeStep.STEP_2_CONFIRMING:
        case SimpleBridgeStep.COMPLETE:
          return "completed";
        case SimpleBridgeStep.ERROR:
          return transaction?.status === "ERROR" ? "error" : "pending";
        default:
          return "pending";
      }
    } else {
      switch (currentStep) {
        case SimpleBridgeStep.IDLE:
        case SimpleBridgeStep.STEP_1_PREPARING:
        case SimpleBridgeStep.STEP_1_SIGNING:
        case SimpleBridgeStep.STEP_1_CONFIRMING:
          return "pending";
        case SimpleBridgeStep.STEP_1_COMPLETE:
          return "waiting";
        case SimpleBridgeStep.STEP_2_PREPARING:
        case SimpleBridgeStep.STEP_2_SIGNING:
        case SimpleBridgeStep.STEP_2_CONFIRMING:
          return "active";
        case SimpleBridgeStep.COMPLETE:
          return "completed";
        case SimpleBridgeStep.ERROR:
          return transaction?.status === "ERROR" ? "error" : "pending";
        default:
          return "pending";
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "active":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case "waiting":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusLabel = (step: 1 | 2) => {
    const status = getStepStatus(step);
    const transaction = transactions.find(tx => tx.step === step);

    switch (status) {
      case "completed":
        return "Complete";
      case "active":
        return transaction?.message || "Processing...";
      case "waiting":
        return "Waiting for Step 1...";
      case "error":
        return transaction?.message || "Failed";
      default:
        return "Pending";
    }
  };

  const getCurrentStepMessage = () => {
    switch (currentStep) {
      case SimpleBridgeStep.STEP_1_PREPARING:
        return "Preparing first transaction...";
      case SimpleBridgeStep.STEP_1_SIGNING:
        return "Please sign the transaction in your wallet";
      case SimpleBridgeStep.STEP_1_CONFIRMING:
        return "Waiting for transaction confirmation...";
      case SimpleBridgeStep.STEP_1_COMPLETE:
        return "First transaction complete. Preparing second transaction...";
      case SimpleBridgeStep.STEP_2_PREPARING:
        return "Preparing second transaction...";
      case SimpleBridgeStep.STEP_2_SIGNING:
        return "Please sign the second transaction in your wallet";
      case SimpleBridgeStep.STEP_2_CONFIRMING:
        return "Waiting for final confirmation...";
      case SimpleBridgeStep.COMPLETE:
        return "Transfer complete! Both transactions successful.";
      case SimpleBridgeStep.ERROR:
        return "Transaction failed. Please try again.";
      default:
        return "";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Transaction Progress
        </CardTitle>
        {getCurrentStepMessage() && (
          <p className="text-sm text-muted-foreground">
            {getCurrentStepMessage()}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1 */}
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center">
            {getStatusIcon(getStepStatus(1))}
            <div className={`h-8 w-px ${
              getStepStatus(2) === "pending" ? "bg-gray-300" : "bg-blue-500"
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{getStepInfo(1).title}</h3>
              <span className="text-sm text-muted-foreground">
                {getStepInfo(1).estimatedTime}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {getStepInfo(1).description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-medium">
                Status: {getStatusLabel(1)}
              </span>
              {transactions[0]?.txHash && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-xs"
                  onClick={() => {
                    if (transactions[0]?.explorerUrl) {
                      window.open(transactions[0].explorerUrl, "_blank");
                    }
                  }}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Arrow Between Steps */}
        <div className="flex items-center justify-center">
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Step 2 */}
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center">
            {getStatusIcon(getStepStatus(2))}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{getStepInfo(2).title}</h3>
              <span className="text-sm text-muted-foreground">
                {getStepInfo(2).estimatedTime}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {getStepInfo(2).description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-medium">
                Status: {getStatusLabel(2)}
              </span>
              {transactions[1]?.txHash && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-xs"
                  onClick={() => {
                    if (transactions[1]?.explorerUrl) {
                      window.open(transactions[1].explorerUrl, "_blank");
                    }
                  }}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Error State with Retry */}
        {currentStep === SimpleBridgeStep.ERROR && onRetry && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="font-medium text-red-700">
                  Transaction Failed
                </span>
              </div>
              <Button onClick={onRetry} variant="outline" size="sm">
                Retry
              </Button>
            </div>
            <p className="text-sm text-red-600 mt-2">
              The transaction failed to complete. You can retry or check the transaction details above.
            </p>
          </div>
        )}

        {/* Success State */}
        {currentStep === SimpleBridgeStep.COMPLETE && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium text-green-700">
                Transfer Complete!
              </span>
            </div>
            <p className="text-sm text-green-600 mt-2">
              Your tokens have been successfully transferred. Both transactions are confirmed.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}