import { cn } from "@torus-ts/ui/lib/utils";
import * as React from "react";

interface RenaissanceButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary";
  size?: "default" | "lg";
}

const sizeClasses = {
  default: "h-10 px-6 py-2 text-[0.75rem]",
  lg: "h-12 px-10 py-3 text-[0.8rem]",
};

const RenaissanceButton = React.forwardRef<
  HTMLButtonElement,
  RenaissanceButtonProps
>(
  (
    { className, variant = "default", size = "default", children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "renaissance-btn",
          variant === "secondary" && "renaissance-btn-secondary",
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        <span className="renaissance-btn-frame" />
        <span className="renaissance-btn-corners-bottom" />
        <span className="renaissance-btn-inner">{children}</span>
      </button>
    );
  },
);

RenaissanceButton.displayName = "RenaissanceButton";

export { RenaissanceButton };
