import { cn } from "@/lib/utils";

interface LoadingDotsProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingDots({ className, size = "md" }: LoadingDotsProps) {
  const sizeClasses = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-3 h-3",
  };

  const dotSize = sizeClasses[size];

  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      <div
        className={cn("bg-current rounded-full animate-pulse", dotSize)}
        style={{
          animationDelay: "0ms",
          animationDuration: "1400ms",
        }}
      />
      <div
        className={cn("bg-current rounded-full animate-pulse", dotSize)}
        style={{
          animationDelay: "200ms",
          animationDuration: "1400ms",
        }}
      />
      <div
        className={cn("bg-current rounded-full animate-pulse", dotSize)}
        style={{
          animationDelay: "400ms",
          animationDuration: "1400ms",
        }}
      />
    </div>
  );
}
