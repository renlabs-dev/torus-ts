"use client";

import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";

export const DEFAULT_DURATION = 8000;

const CLASS_NAMES = {
  toast: "group-[.toaster]:bottom-[30px] group-[.toaster]:bg-background ",
  title: "text-sm font-semibold",
  description: "text-xs my-2",
};

export function Toaster({ duration }: { duration?: number }) {
  const theme = useTheme().theme === "system" ? "dark" : "light";

  return (
    <SonnerToaster
      swipeDirections={["top", "right"]}
      containerAriaLabel="Toaster"
      theme={theme}
      className="toaster group"
      position="bottom-right"
      duration={duration ?? DEFAULT_DURATION}
      toastOptions={{ classNames: CLASS_NAMES }}
    />
  );
}
