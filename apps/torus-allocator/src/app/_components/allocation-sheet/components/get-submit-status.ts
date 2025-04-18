type StatusKey =
  | "UNSAVED"
  | "SAVED"
  | "WALLET"
  | "PERCENTAGE"
  | "ZERO_PERCENTAGE"
  | "SUBMITTING";

export interface StatusConfig {
  message: string;
  color: string;
  disabled: boolean;
}

const STATUS_CONFIG: Record<StatusKey, StatusConfig> = {
  ZERO_PERCENTAGE: {
    message: "Select an agent to allocate",
    color: "text-white",
    disabled: true,
  },
  UNSAVED: {
    message: "You have unsaved changes",
    color: "text-amber-500",
    disabled: false,
  },
  SAVED: {
    message: "All Allocations saved!",
    color: "text-green-500",
    disabled: false,
  },
  WALLET: {
    message: "Please connect your Torus wallet",
    color: "text-white",
    disabled: true,
  },
  PERCENTAGE: {
    message: "Percentage must be 100% or less",
    color: "text-red-500",
    disabled: true,
  },
  SUBMITTING: {
    message: "Submitting Allocations...",
    color: "text-blue-500",
    disabled: true,
  },
};

interface SubmitStatusProps {
  selectedAccount?: string;
  totalPercentage: number;
  isSubmitting: boolean;
  hasUnsavedChanges: boolean;
  hasPercentageChange: boolean;
}

export function getSubmitStatus({
  selectedAccount,
  totalPercentage,
  isSubmitting,
  hasUnsavedChanges,
  hasPercentageChange,
}: SubmitStatusProps): StatusConfig {
  if (!selectedAccount) return STATUS_CONFIG.WALLET;
  if (totalPercentage === 0) return STATUS_CONFIG.ZERO_PERCENTAGE;
  if (totalPercentage > 100) return STATUS_CONFIG.PERCENTAGE;
  if (isSubmitting) return STATUS_CONFIG.SUBMITTING;
  if (hasUnsavedChanges || hasPercentageChange) return STATUS_CONFIG.UNSAVED;
  return STATUS_CONFIG.SAVED;
}
