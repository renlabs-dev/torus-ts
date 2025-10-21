"use client";

import { Toaster as SonnerToaster } from "sonner";
import { cn } from "../lib/utils";

export const DEFAULT_DURATION = 8000;

const CLASS_NAMES = {
  toast: cn(
    "group-[.toaster]:bottom-[20px]",
    "group-[.toaster]:bg-background",
    "group-[.toaster]:right-[20px]",
    "md:group-[.toaster]:bottom-[80px]",
    "md:group-[.toaster]:right-[30px]",
    "group-[.toaster]:left-[20px]",
    "md:group-[.toaster]:left-auto",
    "group-[.toaster]:max-w-[calc(100vw-40px)]",
    "md:group-[.toaster]:max-w-[420px]",
  ),
  title: "text-sm font-semibold",
  description: "text-xs my-2",
};

export function Toaster({ duration }: { duration?: number }) {
  return (
    <SonnerToaster
      swipeDirections={["top", "right"]}
      containerAriaLabel="Toaster"
      theme="dark"
      className="toaster group"
      position="bottom-right"
      duration={duration ?? DEFAULT_DURATION}
      toastOptions={{ classNames: CLASS_NAMES }}
      offset={1}
    />
  );
}
