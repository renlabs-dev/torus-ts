import { cn } from "../lib/utils";
import * as React from "react";

/**
 * Internal props for the input component.
 * @internal
 * @property {string} [label] - Optional label text displayed on the input field
 */
interface BaseInputProps {
  label?: string;
}

/**
 * Props for the Input component. Extends React.InputHTMLAttributes<HTMLInputElement>
 * and BaseInputProps to provide a customizable input field with optional label support.
 * Supports standard input properties like value, onChange, placeholder, disabled, etc.
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    BaseInputProps {}

/**
 * Props for the InputReadonly component, which renders a read-only input-like display.
 */
export interface InputReadonlyProps
  extends React.HTMLAttributes<HTMLDivElement>,
    BaseInputProps {
  value: React.ReactNode;
  disabled?: boolean;
}

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

/**
 * A read-only input-like display component that renders content in a styled container.
 * Useful for displaying values that appear like input fields but cannot be edited.
 * Supports optional label, disabled state, and custom styling.
 *
 * @example
 * ```tsx
 * <InputReadonly
 *   label="TORUS"
 *   value="100.00"
 *   disabled={false}
 * />
 * ```
 */
const InputReadonly = React.forwardRef<HTMLDivElement, InputReadonlyProps>(
  ({ className, label, value, disabled, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <div
          className={cn(
            "rounded-radius flex h-9 w-full items-center border border-border bg-field-background px-3 py-1 text-sm shadow-sm transition-colors",
            disabled && "cursor-not-allowed opacity-50",
            className,
          )}
          ref={ref}
          role="textbox"
          aria-readonly="true"
          aria-disabled={disabled}
          aria-label={label}
          tabIndex={disabled ? -1 : 0}
          {...props}
        >
          {value}
          {label && (
            <span className="absolute right-8 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {label}
            </span>
          )}
        </div>
      </div>
    );
  },
);

InputReadonly.displayName = "InputReadonly";

export { Input, InputReadonly };
