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

export type InputReadonlyProps = {
  label?: string;
  className?: string;
  children?: React.ReactNode;
  value?: string | number | readonly string[];
};

/**
 * A readonly input-like display component.
 * Supports either a `value` prop (renders as input) or `children` (renders as div for custom content).
 */
function InputReadonly({
  className,
  label,
  children,
  value,
}: InputReadonlyProps) {
  const baseClassName = cn(
    "rounded-radius flex h-9 w-full items-center border border-border bg-field-background px-3 py-1 text-sm shadow-sm transition-colors opacity-60 cursor-not-allowed",
    className,
  );

  // If children are provided, render as a div for custom content
  if (children !== undefined) {
    return (
      <div className="relative w-full">
        <div className={baseClassName}>{children}</div>
        {label && (
          <span className="absolute right-8 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {label}
          </span>
        )}
      </div>
    );
  }

  // Otherwise render as readonly input
  return (
    <div className="relative w-full">
      <input type="text" readOnly value={value} className={baseClassName} />
      {label && (
        <span className="absolute right-8 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  );
}
InputReadonly.displayName = "InputReadonly";

export { Input, InputReadonly };
