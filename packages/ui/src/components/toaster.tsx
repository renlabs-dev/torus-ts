"use client";

import { CheckCircle, XCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";
import type { ToasterProps } from "sonner";

export { CheckCircle, XCircle };

export const DEFAULT_DURATION = 8000;

const CLASS_NAMES = {
  toast: "group-[.toaster]:bottom-[30px] group-[.toaster]:bg-background ",
  title: "text-sm font-semibold",
  description: "text-xs my-2",
};

export function Toaster({ duration = DEFAULT_DURATION }: ToasterProps) {
  const { theme = "system" } = useTheme();

  return (
    <SonnerToaster
      swipeDirections={["top", "right"]}
      containerAriaLabel="Toaster"
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      duration={duration}
      toastOptions={{ classNames: CLASS_NAMES }}
    />
  );
}
