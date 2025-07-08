"use client";

// v2
import { cn } from "@torus-ts/ui/lib/utils";
import { Toaster as SonnerToaster } from "sonner";
import type { ToasterProps } from "sonner";
import { useTheme } from "next-themes";

export type ToastVariant = "default" | "destructive";

export interface ToastProps {
  variant?: ToastVariant;
  duration?: number;
}

export const DEFAULT_DURATION = 5000;
export const DEFAULT_VARIANT = "default";

// const CLASS_NAMES = {
//   toast: "group-[.toaster]:bg-background group-[.toaster]:text-foreground",
//   description: "group-[.toast]:text-muted-foreground",
//   title: "group-[.toast]:text-foreground",
//   actionButton:
//     "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
//   cancelButton:
//     "group-[.toast]:text-foreground/50 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50",
//   error:
//     "group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground",
// };

// export function Toaster({
//   variant = DEFAULT_VARIANT,
//   duration = DEFAULT_DURATION,
// }: ToastProps) {
//   const { theme = "system" } = useTheme();

//   const classNames = cn(
//     "toaster group",
//     variant === "destructive" && CLASS_NAMES.error,
//   );

//   return (
//     <SonnerToaster
//       theme={theme as ToasterProps["theme"]}
//       className={classNames}
//       position="bottom-right"
//       duration={duration}
//       richColors
//       // toastOptions={{ classNames: CLASS_NAMES }}
//     />
//   );
// }

//  v1
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@torus-ts/ui/components/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
