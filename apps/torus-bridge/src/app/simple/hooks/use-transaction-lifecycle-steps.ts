import { useCallback, useMemo } from "react";
import type {
  SimpleBridgeDirection,
  SimpleBridgeTransaction,
} from "../_components/simple-bridge-types";
import { SimpleBridgeStep } from "../_components/simple-bridge-types";

type StepStatus = "pending" | "active" | "completed" | "error" | "waiting";

interface LifecycleStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: StepStatus;
  estimatedTime?: string;
  txHash?: string;
  explorerUrl?: string;
  isSignatureRequired?: boolean;
  errorDetails?: string;
}

export function useTransactionLifecycleSteps(
  direction: SimpleBridgeDirection,
  currentStep: SimpleBridgeStep,
  transactions: SimpleBridgeTransaction[],
  amount: string,
) {
  const isBaseToNative = direction === "base-to-native";
  const step1Transaction = transactions.find((tx) => tx.step === 1);
  const step2Transaction = transactions.find((tx) => tx.step === 2);

  const getErrorStepStatus = useCallback(
    (stepId: string): StepStatus | null => {
      const isStep1 = stepId.startsWith("step1");
      const isStep2 = stepId.startsWith("step2");

      if (step2Transaction?.status === "ERROR") {
        if (isStep1) {
          return "completed";
        }

        if (isStep2) {
          const errorPhase = step2Transaction.errorPhase;
          if (errorPhase === "sign" && stepId === "step2-sign") return "error";
          if (errorPhase === "confirm" && stepId === "step2-confirm")
            return "error";
          if (errorPhase === "confirm" && stepId === "step2-sign")
            return "completed";

          if (!errorPhase) {
            if (stepId === "step2-sign") return "error";
            if (stepId === "step2-confirm") return "pending";
          }

          return "pending";
        }
      }

      if (step1Transaction?.status === "ERROR" && isStep1) {
        const errorPhase = step1Transaction.errorPhase;
        if (errorPhase === "sign" && stepId === "step1-sign") return "error";
        if (errorPhase === "confirm" && stepId === "step1-confirm")
          return "error";
        if (errorPhase === "confirm" && stepId === "step1-sign")
          return "completed";

        if (!errorPhase) {
          if (stepId === "step1-sign") return "error";
          if (stepId === "step1-confirm") return "pending";
        }

        return "pending";
      }

      if (step1Transaction?.status === "ERROR" && isStep2) {
        return "pending";
      }

      return null;
    },
    [step1Transaction, step2Transaction],
  );

  const getStep1Status = useCallback(
    (stepId: string): StepStatus => {
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
    },
    [currentStep],
  );

  const getStep2Status = useCallback(
    (stepId: string): StepStatus => {
      if (
        currentStep === SimpleBridgeStep.IDLE ||
        currentStep === SimpleBridgeStep.STEP_1_PREPARING ||
        currentStep === SimpleBridgeStep.STEP_1_SIGNING ||
        currentStep === SimpleBridgeStep.STEP_1_CONFIRMING ||
        currentStep === SimpleBridgeStep.STEP_1_COMPLETE
      ) {
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
    },
    [currentStep],
  );

  const getStepStatus = useCallback(
    (stepId: string): StepStatus => {
      const isStep1 = stepId.startsWith("step1");
      const isStep2 = stepId.startsWith("step2");

      if (currentStep === SimpleBridgeStep.ERROR) {
        const errorStatus = getErrorStepStatus(stepId);
        if (errorStatus) return errorStatus;
      }

      if (isStep1) {
        return getStep1Status(stepId);
      }

      if (isStep2) {
        return getStep2Status(stepId);
      }

      return "pending";
    },
    [currentStep, getErrorStepStatus, getStep1Status, getStep2Status],
  );

  const steps = useMemo((): LifecycleStep[] => {
    const baseSteps = isBaseToNative
      ? [
          {
            id: "step1-sign",
            title: "Sign Base Transaction",
            description: "Please sign the transaction in your Base wallet",
            icon: null,
            status: getStepStatus("step1-sign"),
            isSignatureRequired: true,
            errorDetails: step1Transaction?.errorDetails,
          },
          {
            id: "step1-confirm",
            title: "Base Transaction Confirming",
            description: "Waiting for Base network confirmation",
            icon: null,
            status: getStepStatus("step1-confirm"),
            estimatedTime: "~1-2 minutes",
            txHash: step1Transaction?.txHash,
            explorerUrl: step1Transaction?.explorerUrl,
          },
          {
            id: "step2-sign",
            title: "Sign Withdrawal Transaction",
            description:
              "Please sign the withdrawal in your EVM wallet (Torus EVM)",
            icon: null,
            status: getStepStatus("step2-sign"),
            isSignatureRequired: true,
            errorDetails: step2Transaction?.errorDetails,
          },
          {
            id: "step2-confirm",
            title: "Withdrawal Confirming",
            description: "Waiting for Native Torus confirmation",
            icon: null,
            status: getStepStatus("step2-confirm"),
            estimatedTime: "~30-60 seconds",
            txHash: step2Transaction?.txHash,
            explorerUrl: step2Transaction?.explorerUrl,
          },
        ]
      : [
          {
            id: "step1-sign",
            title: "Sign Native Transaction",
            description: "Please sign the transaction in your Torus wallet",
            icon: null,
            status: getStepStatus("step1-sign"),
            isSignatureRequired: true,
            errorDetails: step1Transaction?.errorDetails,
          },
          {
            id: "step1-confirm",
            title: "Native Transaction Confirming",
            description: "Waiting for Native Torus confirmation",
            icon: null,
            status: getStepStatus("step1-confirm"),
            estimatedTime: "~30-60 seconds",
            txHash: step1Transaction?.txHash,
            explorerUrl: step1Transaction?.explorerUrl,
          },
          {
            id: "step2-sign",
            title: "Sign Base Transaction",
            description: "Please sign the transaction in your Base wallet",
            icon: null,
            status: getStepStatus("step2-sign"),
            isSignatureRequired: true,
            errorDetails: step2Transaction?.errorDetails,
          },
          {
            id: "step2-confirm",
            title: "Base Transaction Confirming",
            description: "Waiting for Base network confirmation",
            icon: null,
            status: getStepStatus("step2-confirm"),
            estimatedTime: "~1-2 minutes",
            txHash: step2Transaction?.txHash,
            explorerUrl: step2Transaction?.explorerUrl,
          },
        ];

    if (currentStep === SimpleBridgeStep.COMPLETE) {
      baseSteps.push({
        id: "success",
        title: "🎉 Transfer Successful",
        description: `Congratulations! Your ${amount} TORUS tokens have been successfully bridged from ${isBaseToNative ? "Base to Native" : "Native to Base"}. Check your wallet balances.`,
        icon: null,
        status: "completed" as StepStatus,
        isSignatureRequired: false,
        errorDetails: undefined,
      });
    }

    return baseSteps;
  }, [
    isBaseToNative,
    currentStep,
    step1Transaction,
    step2Transaction,
    amount,
    getStepStatus,
  ]);

  return steps;
}
