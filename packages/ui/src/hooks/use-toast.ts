"use client";

import { toast as sonnerToast } from "sonner";
import type { ToastT } from "sonner";
import { DEFAULT_DURATION } from "../components/toaster";

type ToastVariant = "default" | "destructive";

interface ToastProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
  action?: React.ReactElement;
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

const createSuccessToast = (
  description = "Operation completed successfully.",
  duration = DEFAULT_DURATION,
): ToastResult => {
  const toastId = sonnerToast.success(description, { duration });

  return {
    id: String(toastId),
    dismiss: () => sonnerToast.dismiss(toastId),
    update: (newProps) => {
      sonnerToast.dismiss(toastId);
      return createToast({
        title: "Success!",
        description,
        variant: "default",
        duration,
        ...newProps,
      });
    },
  };
};

const createErrorToast = (
  description = "An unexpected error occurred. Please try again.",
  duration = DEFAULT_DURATION,
): ToastResult => {
  const toastId = sonnerToast.error(description, { duration });

  return {
    id: String(toastId),
    dismiss: () => sonnerToast.dismiss(toastId),
    update: (newProps) => {
      sonnerToast.dismiss(toastId);
      return createToast({
        title: "Uh oh! Something went wrong.",
        description,
        variant: "destructive",
        duration,
        ...newProps,
      });
    },
  };
};

const createPromiseToast = (
  promise: Promise<unknown>,
  handlers: Parameters<typeof sonnerToast.promise>[1],
): void => {
  sonnerToast.promise(promise, handlers);
};

export interface ToastFunction {
  (props: ToastProps): ToastResult;
  success: (description?: string, duration?: number) => ToastResult;
  error: (description?: string, duration?: number) => ToastResult;
  promise: (
    promise: Promise<unknown>,
    handlers: Parameters<typeof sonnerToast.promise>[1],
  ) => void;
}

const toast: ToastFunction = Object.assign(createToast, {
  success: createSuccessToast,
  error: createErrorToast,
  promise: createPromiseToast,
});

const useToast = () => ({
  toast,
  dismiss: (toastId?: string) =>
    toastId ? sonnerToast.dismiss(toastId) : sonnerToast.dismiss(),
  toasts: [] as ToastT[],
});

export { useToast, toast };
