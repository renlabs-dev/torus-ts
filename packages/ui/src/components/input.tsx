import { cn } from "../lib/utils";
import * as React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <input
          type={type}
          className={cn(
            "rounded-radius flex h-9 w-full border border-border bg-field-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          ref={ref}
          {...props}
        />
        {label && (
          <span className="absolute right-8 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {label}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
