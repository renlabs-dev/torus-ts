"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";
import { cn } from ".";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded rounded-full bg-primary/30">
      <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-blue-600 to-cyan-500" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="duration-400 block h-[1.1em] w-[1.1em] rounded border border-primary/50 bg-background shadow transition transition-colors hover:h-5 hover:w-5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
