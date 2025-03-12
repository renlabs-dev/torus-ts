export const STATUS_CONFIG = {
  UNSAVED: {
    message: "You have unsaved changes",
    color: "text-amber-500",
    disabled: false,
  },
  SAVED: {
    message: "All changes saved!",
    color: "text-green-500",
    disabled: false,
  },
  WALLET: {
    message: "Please connect your wallet",
    color: "text-red-500",
    disabled: true,
  },
  PERCENTAGE: {
    message: "Total percentage must be 100%",
    color: "text-red-500",
    disabled: true,
  },
  SUBMITTING: {
    message: "Submitting...",
    color: "text-blue-500",
    disabled: true,
  },
};

interface GetSubmitStatusProps {
  selectedAccount: string | undefined;
  totalPercentage: number;
  isSubmitting: boolean;
  hasUnsavedChanges: () => boolean;
  hasPercentageChange: boolean;
}

export function getSubmitStatus(props: GetSubmitStatusProps): {
  disabled: boolean;
  message: string;
  status: (typeof STATUS_CONFIG)[keyof typeof STATUS_CONFIG];
} {
  if (!props.selectedAccount) {
    return {
      disabled: STATUS_CONFIG.WALLET.disabled,
      message: STATUS_CONFIG.WALLET.message,
      status: STATUS_CONFIG.WALLET,
    };
  }
  if (props.totalPercentage !== 100) {
    return {
      disabled: STATUS_CONFIG.PERCENTAGE.disabled,
      message: STATUS_CONFIG.PERCENTAGE.message,
      status: STATUS_CONFIG.PERCENTAGE,
    };
  }
  if (props.isSubmitting) {
    return {
      disabled: STATUS_CONFIG.SUBMITTING.disabled,
      message: STATUS_CONFIG.SUBMITTING.message,
      status: STATUS_CONFIG.SUBMITTING,
    };
  }
  if (props.hasUnsavedChanges() || props.hasPercentageChange) {
    return {
      disabled: STATUS_CONFIG.UNSAVED.disabled,
      message: STATUS_CONFIG.UNSAVED.message,
      status: STATUS_CONFIG.UNSAVED,
    };
  }
  return {
    disabled: STATUS_CONFIG.SAVED.disabled,
    message: STATUS_CONFIG.SAVED.message,
    status: STATUS_CONFIG.SAVED,
  };
}
