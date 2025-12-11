import { useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import type {
  SimpleBridgeDirection,
  SimpleBridgeTransaction,
} from "../_components/fast-bridge-types";
import { SimpleBridgeStep } from "../_components/fast-bridge-types";
import { formatErrorForUser } from "./fast-bridge-helpers";

/**
 * Formats error details for display in the transaction step item.
 * Returns undefined if there are no error details.
 */
function getFormattedErrorDetails(
  errorDetails: string | undefined,
): string | undefined {
  if (!errorDetails) return undefined;
  return formatErrorForUser(new Error(errorDetails));
}

type StepStatus = "pending" | "active" | "completed" | "error" | "waiting";

interface LifecycleStep {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
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

      // Case 1: Step 2 has explicit ERROR status
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

      // Case 2: Step 1 has explicit ERROR status
      if (step1Transaction?.status === "ERROR") {
        if (isStep1) {
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

        if (isStep2) {
          return "pending";
        }
      }

      // Case 3: currentStep is ERROR but no explicit ERROR status in transactions
      // This happens when restoring from history - infer status from transaction data
      if (currentStep === SimpleBridgeStep.ERROR) {
        // Check if step 1 is complete based on having step 2 data or step 1 SUCCESS
        const step1IsComplete =
          step1Transaction?.status === "SUCCESS" ||
          step1Transaction?.status === "CONFIRMING" ||
          step2Transaction !== undefined;

        if (isStep1) {
          if (step1IsComplete) {
            return "completed";
          }
          // Step 1 not complete - error must be at step 1
          if (stepId === "step1-sign") return "error";
          return "pending";
        }

        if (isStep2) {
          if (!step1IsComplete) {
            return "pending";
          }
          // Step 1 complete, error is at step 2
          if (stepId === "step2-sign") return "error";
          return "pending";
        }
      }

      return null;
    },
    [step1Transaction, step2Transaction, currentStep],
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
        currentStep === SimpleBridgeStep.STEP_1_CONFIRMING
      ) {
        return "pending";
      }

      // After step 1 completes, step 2 sign should be active (preparing/switching/signing)
      if (
        currentStep === SimpleBridgeStep.STEP_1_COMPLETE ||
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
            errorDetails: getFormattedErrorDetails(
              step1Transaction?.errorDetails,
            ),
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
            errorDetails: getFormattedErrorDetails(
              step1Transaction?.errorDetails,
            ),
          },
          {
            id: "step2-sign",
            title: "Sign Withdrawal Transaction",
            description:
              "Please sign the withdrawal in your EVM wallet (Torus EVM)",
            icon: null,
            status: getStepStatus("step2-sign"),
            isSignatureRequired: true,
            errorDetails: getFormattedErrorDetails(
              step2Transaction?.errorDetails,
            ),
          },
          {
            id: "step2-confirm",
            title: "Withdrawal Confirming",
            description: "Waiting for Torus confirmation",
            icon: null,
            status: getStepStatus("step2-confirm"),
            estimatedTime: "~30-60 seconds",
            txHash: step2Transaction?.txHash,
            explorerUrl: step2Transaction?.explorerUrl,
            errorDetails: getFormattedErrorDetails(
              step2Transaction?.errorDetails,
            ),
          },
        ]
      : [
          {
            id: "step1-sign",
            title: "Sign Torus Transaction",
            description: "Please sign the transaction in your Torus wallet",
            icon: null,
            status: getStepStatus("step1-sign"),
            isSignatureRequired: true,
            errorDetails: getFormattedErrorDetails(
              step1Transaction?.errorDetails,
            ),
          },
          {
            id: "step1-confirm",
            title: "Torus Transaction Confirming",
            description: "Waiting for Torus confirmation",
            icon: null,
            status: getStepStatus("step1-confirm"),
            estimatedTime: "~30-60 seconds",
            txHash: step1Transaction?.txHash,
            explorerUrl: step1Transaction?.explorerUrl,
            errorDetails: getFormattedErrorDetails(
              step1Transaction?.errorDetails,
            ),
          },
          {
            id: "step2-sign",
            title: "Sign Base Transaction",
            description: "Please sign the transaction in your Base wallet",
            icon: null,
            status: getStepStatus("step2-sign"),
            isSignatureRequired: true,
            errorDetails: getFormattedErrorDetails(
              step2Transaction?.errorDetails,
            ),
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
            errorDetails: getFormattedErrorDetails(
              step2Transaction?.errorDetails,
            ),
          },
        ];

    if (currentStep === SimpleBridgeStep.COMPLETE) {
      baseSteps.push({
        id: "success",
        title: "Transfer Successful",
        description: `Congratulations! Your ${amount} TORUS tokens have been successfully bridged from ${isBaseToNative ? "Base to Torus" : "Torus to Base"}. Check your wallet balances.`,
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
