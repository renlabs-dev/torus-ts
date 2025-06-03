import { Receipt } from "lucide-react";

interface TransactionEmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  variant?: "default" | "compact";
}

export function TransactionEmptyState({
  title = "No transactions found",
  description,
  icon,
  className = "",
  variant = "default",
}: TransactionEmptyStateProps) {
  const heightClass = variant === "compact" ? "min-h-[150px]" : "min-h-[200px]";

  return (
    <div
      className={`flex-1 flex flex-col items-center justify-center rounded-lg border bg-card
        text-muted-foreground text-sm ${heightClass} ${className}`}
      aria-live="polite"
    >
      {icon ? (
        <div className="mb-3 text-muted-foreground/60">{icon}</div>
      ) : (
        <div className="mb-3 text-muted-foreground/40">
          <Receipt size={48} />
        </div>
      )}
      <div className="text-center">
        <p className="font-medium">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground/80 mt-1 max-w-[200px]">
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

export function TransactionsEmptyFiltered() {
  return (
    <TransactionEmptyState
      title="No matching transactions"
      description="Try adjusting your filters or clearing them to see more results"
      variant="compact"
    />
  );
}
