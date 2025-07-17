"use client";

import { toast as sonnerToast } from "sonner";

type ToastVariant = "default" | "destructive";

interface ToasterToast {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
  action?: React.ReactElement;
}

export type Toast = Omit<ToasterToast, "id">;

function toast({ title, description, variant, duration, ...props }: Toast) {
  let toastId: string | number;

  if (variant === "destructive") {
    toastId = sonnerToast.error(title, {
      description,
      duration,
      ...props,
    });
  } else {
    toastId = sonnerToast(title, {
      description,
      duration,
      ...props,
    });
  }

  const dismiss = () => sonnerToast.dismiss(toastId);
  const update = (newProps: Partial<Toast>) => {
    dismiss();
    return toast({ title, description, variant, duration, ...props, ...newProps });
  };

  return {
    id: toastId.toString(),
    dismiss,
    update,
  };
}

toast.success = (description?: string, duration?: number) => {
  const toastId = sonnerToast.success(description ?? "Operation completed successfully.", {
    duration: duration ?? 2000,
  });

  return {
    id: toastId.toString(),
    dismiss: () => sonnerToast.dismiss(toastId),
    update: (newProps: Partial<Toast>) => {
      sonnerToast.dismiss(toastId);
      return toast({ title: "Success!", description, variant: "default", duration: duration ?? 2000, ...newProps });
    },
  };
};

toast.error = (description?: string, duration?: number) => {
  const toastId = sonnerToast.error(description ?? "An unexpected error occurred. Please try again.", {
    duration: duration ?? 2000,
  });

  return {
    id: toastId.toString(),
    dismiss: () => sonnerToast.dismiss(toastId),
    update: (newProps: Partial<Toast>) => {
      sonnerToast.dismiss(toastId);
      return toast({ title: "Uh oh! Something went wrong.", description, variant: "destructive", duration: duration ?? 2000, ...newProps });
    },
  };
};

export interface ToastFunction {
  (props: Toast): ReturnType<typeof toast>;
  success: (
    description?: string,
    duration?: number,
  ) => ReturnType<typeof toast>;
  error: (description?: string, duration?: number) => ReturnType<typeof toast>;
}

function useToast() {
  return {
    toast,
    dismiss: (toastId?: string) => {
      if (toastId) {
        sonnerToast.dismiss(toastId);
      } else {
        sonnerToast.dismiss();
      }
    },
    toasts: [],
  };
}

export { useToast, toast };
