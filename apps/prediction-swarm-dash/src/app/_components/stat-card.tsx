import { formatLargeNumber } from "~/lib/api-utils";
import { LoadingDots } from "./loading-dots";

interface StatCardProps {
  value?: number;
  label: string;
  isLoading?: boolean;
  error?: boolean;
  errorMessage?: string;
  isLastCard?: boolean;
}

export function StatCard({
  value,
  label,
  isLoading = false,
  error = false,
  errorMessage,
  isLastCard = false,
}: StatCardProps) {
  const desktopBorderClass = isLastCard ? "" : "md:border-r border-border";
  const mobileBorderClass = isLastCard ? "" : "border-b md:border-b-0";

  return (
    <div
      className={`${desktopBorderClass} ${mobileBorderClass} text-muted-foreground flex h-full flex-col items-center justify-center p-4 text-center md:p-2`}
    >
      <span className="text-lg font-bold text-white">
        {isLoading ? (
          <LoadingDots className="h-6" />
        ) : error ? (
          <span className="text-red-500">ERROR</span>
        ) : (
          formatLargeNumber(value ?? 0)
        )}
      </span>
      {error && errorMessage ? (
        <div className="text-xs text-red-500">{errorMessage}</div>
      ) : (
        label
      )}
    </div>
  );
}
