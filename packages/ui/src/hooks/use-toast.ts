"use client";

import { toast as sonnerToast } from "sonner";
import type { ToastT } from "sonner";
import { DEFAULT_DURATION } from "../components/toaster";

type ToastVariant = "default" | "destructive";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
  classNames?: {
    icon?: string;
    content?: string;
  };
  actionButtonStyle?: React.CSSProperties;
}

interface ToastResult {
  id: string | number;
  dismiss: () => void;
  update: (newProps: Partial<ToastProps>) => ToastResult;
}

const createEmptyToastResult = (): ToastResult => ({
  id: "",
  dismiss: () => {
    // intentionally empty
  },
  update: () => createEmptyToastResult(),
});

const createToast = ({
  title,
  description,
  variant = "default",
  duration,
  ...props
}: ToastProps): ToastResult => {
  if (!title && !description) return createEmptyToastResult();

  const toastOptions = { description, duration, ...props };

  const toastId =
    variant === "destructive"
      ? sonnerToast.error(title, toastOptions)
      : sonnerToast(title, toastOptions);

  return {
    id: String(toastId),
    dismiss: () => sonnerToast.dismiss(toastId),
    update: (newProps) => {
      sonnerToast.dismiss(toastId);
      return createToast({
        title,
        description,
        variant,
        duration,
        ...props,
        ...newProps,
      });
    },
  };
};

const buildActionOptions = (action?: ToastAction) => {
  const classNames = action
    ? {
        icon: "mb-6",
        content: "mb-6",
      }
    : undefined;
  const actionButtonStyle = action
    ? {
        position: "absolute" as const,
        right: "0.5rem",
        bottom: "0.5rem",
      }
    : undefined;
  const normalizedAction = action
    ? {
        label: action.label,
        onClick: action.onClick,
      }
    : undefined;
  return { classNames, actionButtonStyle, action: normalizedAction } as const;
};

const createTypedToast = (
  type: "success" | "error",
  description: string,
  duration: number,
  action?: ToastAction,
  titles?: { defaultTitle?: string; variant?: ToastVariant },
): ToastResult => {
  const {
    classNames,
    actionButtonStyle,
    action: normalizedAction,
  } = buildActionOptions(action);

  const toastOptions = {
    duration,
    action: normalizedAction,
    classNames,
    actionButtonStyle,
  };

  const toastId =
    type === "success"
      ? sonnerToast.success(description, toastOptions)
      : sonnerToast.error(description, toastOptions);

  return {
    id: String(toastId),
    dismiss: () => sonnerToast.dismiss(toastId),
    update: (newProps) => {
      sonnerToast.dismiss(toastId);
      return createToast({
        title: titles?.defaultTitle,
        description,
        variant:
          titles?.variant ?? (type === "error" ? "destructive" : "default"),
        duration,
        action,
        classNames,
        actionButtonStyle,
        ...newProps,
      });
    },
  };
};

const createSuccessToast = (
  description = "Operation completed successfully.",
  duration = DEFAULT_DURATION,
  action?: ToastAction,
): ToastResult =>
  createTypedToast("success", description, duration, action, {
    defaultTitle: "Success!",
    variant: "default",
  });

const createErrorToast = (
  description = "An unexpected error occurred. Please try again.",
  duration = DEFAULT_DURATION,
  action?: ToastAction,
): ToastResult =>
  createTypedToast("error", description, duration, action, {
    defaultTitle: "Uh oh! Something went wrong.",
    variant: "destructive",
  });

const createLoadingToast = (
  description: string,
  options?: { id?: string | number; duration?: number },
): string | number => {
  return sonnerToast.loading(description, options);
};

const createPromiseToast = <T>(
  promise: Promise<T>,
  handlers: Parameters<typeof sonnerToast.promise>[1],
) => {
  return sonnerToast.promise(promise, handlers);
};

export interface ToastFunction {
  (props: ToastProps): ToastResult;
  success: (
    description?: string,
    duration?: number,
    action?: ToastAction,
  ) => ToastResult;
  error: (
    description?: string,
    duration?: number,
    action?: ToastAction,
  ) => ToastResult;
  loading: (
    description: string,
    options?: { id?: string | number; duration?: number },
  ) => string | number;
  promise: (
    promise: Promise<unknown>,
    handlers: Parameters<typeof sonnerToast.promise>[1],
  ) => void;
  dismiss: (toastId?: string | number) => void;
}

const toast: ToastFunction = Object.assign(createToast, {
  success: createSuccessToast,
  error: createErrorToast,
  loading: createLoadingToast,
  promise: createPromiseToast,
  dismiss: (toastId?: string | number) =>
    toastId ? sonnerToast.dismiss(toastId) : sonnerToast.dismiss(),
});

const useToast = () => ({
  toast,
  dismiss: (toastId?: string) =>
    toastId ? sonnerToast.dismiss(toastId) : sonnerToast.dismiss(),
  toasts: [] as ToastT[],
});

export { useToast, toast };
