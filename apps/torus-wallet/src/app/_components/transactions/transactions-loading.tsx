interface TransactionLoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  variant?: "inline" | "centered" | "fullHeight";
  className?: string;
}

export function TransactionLoadingState({
  message = "Loading...",
  size = "md",
  variant = "inline",
  className = "",
}: TransactionLoadingStateProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-6 w-6",
  };

  const containerClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const variantClasses = {
    inline: "flex items-center gap-2",
    centered: "flex items-center justify-center gap-2",
    fullHeight: "flex-1 flex items-center justify-center gap-2 min-h-[200px]",
  };

  return (
    <div
      className={`text-muted-foreground ${containerClasses[size]} ${variantClasses[variant]}
        ${className}`}
    >
      <div
        className={`animate-spin ${sizeClasses[size]} border-2 border-current border-t-transparent
          rounded-full`}
      />
      {message}
    </div>
  );
}

export function TransactionsInitialLoading() {
  return (
    <TransactionLoadingState
      message="Loading transactions..."
      variant="fullHeight"
    />
  );
}

export function TransactionsLoadingMore() {
  return (
    <div className="flex justify-center py-4">
      <TransactionLoadingState
        message="Loading more transactions..."
        variant="centered"
      />
    </div>
  );
}
