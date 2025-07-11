"use client";

import React from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { DEFAULT_DURATION } from "../components/toaster";

interface Toast {
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
}

interface ToasterToast extends Toast {
  id: string;
}

interface ToastReturn {
  id: string;
  dismiss: () => void;
  update: (props: ToasterToast) => ReturnType<typeof toast>;
}

let count = 0;
let currentToastId: string | null = null;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

function dismissCurrentToast() {
  if (currentToastId) {
    sonnerToast.dismiss(currentToastId);
    currentToastId = null;
  }
}

function toast({ duration = DEFAULT_DURATION, ...props }: Toast): ToastReturn {
  // Dismiss any existing toast before showing a new one
  dismissCurrentToast();

  const id = genId();
  currentToastId = id;

  const sonnerProps = { id, duration };

  if (props.variant === "destructive") {
    sonnerToast.error(props.title as string, {
      description: props.description as string,
      ...sonnerProps,
    });
    return {
      id,
      dismiss: () => {
        sonnerToast.dismiss(id);
        if (currentToastId === id) {
          currentToastId = null;
        }
      },
      update: (props: ToasterToast) => {
        sonnerToast.dismiss(id);
        if (currentToastId === id) {
          currentToastId = null;
        }
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
    dismiss: () => {
      sonnerToast.dismiss(id);
      if (currentToastId === id) {
        currentToastId = null;
      }
    },
    update: (props: ToasterToast) => {
      sonnerToast.dismiss(id);
      if (currentToastId === id) {
        currentToastId = null;
      }
      return toast(props);
    },
  };
}

toast.success = (
  description = "Operation completed successfully.",
  duration = DEFAULT_DURATION,
) => {
  return toast({
    title: (
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span>Success!</span>
      </div>
    ),
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
    title: (
      <div className="flex items-center gap-2">
        <XCircle className="h-4 w-4 text-red-500" />
        <span>Uh oh! Something went wrong.</span>
      </div>
    ),
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
        dismissCurrentToast();
        return;
      }
      sonnerToast.dismiss(toastId);
      if (currentToastId === toastId) {
        currentToastId = null;
      }
    },
  };
}

export { useToast, toast };
