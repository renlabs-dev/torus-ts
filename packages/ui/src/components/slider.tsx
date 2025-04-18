"use client";

import { cn } from "../lib/utils";
import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

const sliderVariants = cva(
  "relative flex w-full touch-none select-none items-center",
  {
    variants: {
      size: {
        default: "h-9",
        sm: "h-7",
        lg: "h-11",
      },
      variant: {
        default: [
          "slider-default",
          "[&_[data-track]]:bg-primary/30",
          "[&_[data-range]]:bg-gradient-to-r from-blue-600 to-cyan-500",
          "[&_[data-thumb]]:border-primary/50 [&_[data-thumb]]:bg-background",
        ],
        destructive: [
          "slider-destructive",
          "[&_[data-track]]:bg-accent",
          "[&_[data-range]]:bg-gradient-to-r from-destructive-400 to-destructive-500",
          "[&_[data-thumb]]:border-primary/30 [&_[data-thumb]]:bg-background",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const trackVariants = cva(
  "relative h-3 w-full grow overflow-hidden rounded-full",
  {
    variants: {
      variant: {
        default: "bg-primary/30",
        destructive: "bg-primary/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const rangeVariants = cva("absolute h-full", {
  variants: {
    variant: {
      default: "bg-gradient-to-r from-blue-600 to-cyan-500",
      destructive: "bg-gradient-to-r from-red-800 to-red-900",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const thumbVariants = cva(
  "duration-400 block rounded border shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      size: {
        default: "h-[1.1em] w-[1.1em] hover:h-5 hover:w-5",
        sm: "h-[0.9em] w-[0.9em] hover:h-4 hover:w-4",
        lg: "h-[1.3em] w-[1.3em] hover:h-6 hover:w-6",
      },
      variant: {
        default: "border-primary/50 bg-background",
        destructive: "border-destructive/50 bg-background",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>,
    VariantProps<typeof sliderVariants> {
  thumbClassName?: string;
  trackClassName?: string;
  rangeClassName?: string;
}

const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  SliderProps
>(
  (
    {
      className = "",
      variant = "default",
      size = "default",
      thumbClassName = "",
      trackClassName = "",
      rangeClassName = "",
      ...props
    },
    ref,
  ) => {
    return (
      <SliderPrimitive.Root
        ref={ref}
        className={cn(sliderVariants({ variant, size }), className)}
        {...props}
      >
        <SliderPrimitive.Track
          className={cn(trackVariants({ variant }), trackClassName)}
          data-track
        >
          <SliderPrimitive.Range
            className={cn(rangeVariants({ variant }), rangeClassName)}
            data-range
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className={cn(thumbVariants({ variant, size }), thumbClassName)}
          data-thumb
        />
      </SliderPrimitive.Root>
    );
  },
);

Slider.displayName = "Slider";

export { Slider };
