import { Receipt } from "lucide-react";

interface TransactionEmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  variant?: "default" | "compact";
}

function TransactionEmptyState({
  title = "No transactions found",
  description,
  icon,
  className = "",
  variant = "default",
}: TransactionEmptyStateProps) {
  const heightClass = variant === "compact" ? "min-h-[150px]" : "min-h-[200px]";

  return (
    <div
      className={`bg-card text-muted-foreground flex flex-1 flex-col items-center justify-center rounded-lg border text-sm ${heightClass} ${className}`}
      aria-live="polite"
    >
      {icon ? (
        <div className="text-muted-foreground/60 mb-3">{icon}</div>
      ) : (
        <div className="text-muted-foreground/40 mb-3">
          <Receipt size={48} />
        </div>
      )}
      <div className="text-center">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="text-muted-foreground/80 mt-1 max-w-[200px] text-xs">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export function TransactionsEmptyDefault() {
  return (
    <TransactionEmptyState
      title="No transactions found"
      description="Your transaction history will appear here once you start using your wallet"
    />
  );
}
