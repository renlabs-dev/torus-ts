"use client";

import { cn } from "@torus-ts/ui/lib/utils";
import { Toaster as SonnerToaster } from "sonner";

export type ToastVariant = "default" | "destructive";

export interface ToastProps {
  variant?: ToastVariant;
  duration?: number;
}

export const DEFAULT_DURATION = 5000;
export const DEFAULT_VARIANT = "default";

const CLASS_NAMES = {
  toast: "group-[.toaster]:bg-background group-[.toaster]:text-foreground",
  description: "group-[.toast]:text-muted-foreground",
  title: "group-[.toast]:text-foreground",
  actionButton:
    "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
  cancelButton:
    "group-[.toast]:text-foreground/50 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50",
  error:
    "group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground",
};

export function Toaster({
  variant = DEFAULT_VARIANT,
  duration = DEFAULT_DURATION,
}: ToastProps) {
  const classNames = cn(
    "toaster group",
    variant === "destructive" && CLASS_NAMES.error,
  );

  return (
    <SonnerToaster
      className={classNames}
      position="bottom-right"
      duration={duration}
      richColors
      theme="system"
      toastOptions={{ classNames: CLASS_NAMES }}
    />
  );
}
