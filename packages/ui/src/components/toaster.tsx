"use client";

import { Toaster as SonnerToaster } from "sonner";

export const DEFAULT_DURATION = 8000;

const CLASS_NAMES = {
  toast:
    "group-[.toaster]:bottom-[30px] group-[.toaster]:bg-background group-[.toaster]:right-[10px]",
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
