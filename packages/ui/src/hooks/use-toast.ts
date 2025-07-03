"use client";

import type { ReactNode } from "react";
import { toast as sonnerToast } from "sonner";
import { DEFAULT_DURATION } from "../components/toaster";
import type { ToastProps } from "../components/toaster";

type ToasterToast = ToastProps & {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
};

type Toast = Omit<ToasterToast, "id">;

interface ToastReturn {
  id: string;
  dismiss: () => void;
  update: (props: ToasterToast) => ReturnType<typeof toast>;
}

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

function toast({ duration = DEFAULT_DURATION, ...props }: Toast): ToastReturn {
  const id = genId();

  const sonnerProps = { id, duration };

  if (props.variant === "destructive") {
    sonnerToast.error(props.title as string, {
      description: props.description as string,
      ...sonnerProps,
    });
    return {
      id,
      dismiss: () => sonnerToast.dismiss(id),
      update: (props: ToasterToast) => {
        sonnerToast.dismiss(id);
        return toast(props);
      },
    };
  }

  sonnerToast(props.title as string, {
    description: props.description as string,
    ...sonnerProps,
  });
  return {
    id,
    dismiss: () => sonnerToast.dismiss(id),
    update: (props: ToasterToast) => {
      sonnerToast.dismiss(id);
      return toast(props);
    },
  };
}

toast.success = (
  description = "Operation completed successfully.",
  duration = DEFAULT_DURATION,
) => {
  return toast({
    title: "Success!",
    description,
    variant: "default",
    duration,
  });
};

toast.error = (
  description = "An unexpected error occurred. Please try again.",
  duration = DEFAULT_DURATION,
) => {
  return toast({
    title: "Uh oh! Something went wrong.",
    description,
    variant: "destructive",
    duration,
  });
};

export interface ToastFunction {
  (props: Toast): ReturnType<typeof toast>;
  success: (
    description?: string,
    duration?: number,
  ) => ReturnType<typeof toast>;
  error: (description?: string, duration?: number) => ReturnType<typeof toast>;
}

const mockState = { toasts: [] };

function useToast() {
  return {
    ...mockState,
    toast: toast as ToastFunction,
    dismiss: (toastId?: string) => {
      if (!toastId) {
        sonnerToast.dismiss();
        return;
      }
      sonnerToast.dismiss(toastId);
    },
  };
}

export { useToast, toast };
