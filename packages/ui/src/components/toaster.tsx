"use client";

import { CheckCircle, XCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";
import type { ToasterProps } from "sonner";

export const DEFAULT_DURATION = 5000;

export { CheckCircle, XCircle };

const CLASS_NAMES = {
  toast:
    "group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:bottom-[50px]",
  description: "group-[.toast]:text-muted-foreground",
  title: "group-[.toast]:text-foreground",
  actionButton:
    "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
  cancelButton:
    "group-[.toast]:text-foreground/50 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50",
  error:
    "group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground",
};

export function Toaster({ duration = DEFAULT_DURATION }: ToasterProps) {
  const { theme = "system" } = useTheme();

  return (
    <SonnerToaster
      swipeDirections={["top", "right"]}
      closeButton={true}
      containerAriaLabel="Toaster"
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      duration={duration}
      toastOptions={{ classNames: CLASS_NAMES }}
    />
  );
}
