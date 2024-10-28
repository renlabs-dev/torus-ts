import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from ".";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium backdrop-blur-md transition transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        base: "border",
        default:
          "hover:bg-background-purple border border-white/20 bg-[#898989]/5 bg-background text-white hover:border-purple-500 hover:text-purple-500 active:bg-purple-500/40",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline",
        // Custom Variants
        "default-green":
          "border border-green-500/50 bg-green-500/10 text-green-500 hover:border-green-500/70 hover:bg-green-500/15 active:bg-green-500/40",
        "default-red":
          "border border-red-500/50 bg-red-500/10 text-red-500 hover:border-red-500/70 hover:bg-red-500/15 active:bg-red-500/40",
        "default-amber":
          "border border-amber-500/50 bg-amber-500/10 text-amber-500 hover:border-amber-500/70 hover:bg-amber-500/15 active:bg-amber-500/40",
        "default-purple":
          "border border-purple-500/50 bg-purple-500/10 text-purple-500 hover:border-purple-500/70 hover:bg-purple-500/15 active:bg-purple-500/40",
        "default-cyan":
          "border border-cyan-500/50 bg-cyan-500/10 text-cyan-500 hover:border-cyan-500/70 hover:bg-cyan-500/15 active:bg-cyan-500/40",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        xl: "text- h-12 px-12",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
