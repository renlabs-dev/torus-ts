import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";

import type { TransactionResult } from "@torus-ts/types";

import { cn } from "..";

interface TransactionStatusProps {
  status: TransactionResult["status"];
  message: string | null;
}

export function TransactionStatus({
  status,
  message,
}: TransactionStatusProps): JSX.Element {
  const statusConfig = {
    SUCCESS: { color: "text-green-400", Icon: CheckCircleIcon },
    ERROR: { color: "text-red-400", Icon: ExclamationCircleIcon },
    PENDING: { color: "text-yellow-400", Icon: null },
    STARTING: { color: "text-blue-400", Icon: null },
  };

  const { color, Icon } = status
    ? statusConfig[status]
    : { color: "", Icon: null };

  return (
    <p
      className={cn("flex items-center gap-1 pt-2 text-left text-base", color)}
    >
      {status && status !== "SUCCESS" && status !== "ERROR" && (
        <LoadingSpinner color={color} />
      )}
      {Icon && <Icon className="h-5 w-5" />}
      {message}
    </p>
  );
}

function LoadingSpinner({ color }: { color: string }): JSX.Element {
  return (
    <div className="mr-1 grid place-content-center" role="status">
      <svg
        aria-hidden="true"
        className={cn("h-6 w-6 animate-spin", color)}
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
