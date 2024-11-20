import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";

import type { TransactionResult } from "../types/transactions";
import { cn, Loading } from "..";

interface TransactionStatusProps {
  status: TransactionResult["status"];
  message: string | null;
}

export function TransactionStatus({
  status,
  message,
}: TransactionStatusProps): JSX.Element {
  const statusConfig = {
    SUCCESS: { color: "text-green-300", Icon: CheckCircleIcon },
    ERROR: { color: "text-red-300", Icon: ExclamationCircleIcon },
    PENDING: { color: "text-yellow-300", Icon: null },
    STARTING: { color: "text-blue-300", Icon: null },
  };

  const { color, Icon } = status
    ? statusConfig[status]
    : { color: "", Icon: null };

  return (
    <div
      className={cn("flex items-center gap-1 pt-2 text-left text-sm", color)}
    >
      {status && status !== "SUCCESS" && status !== "ERROR" && (
        <Loading className={color} />
      )}
      {Icon && <Icon className="h-5 w-5" />}
      {message}
    </div>
  );
}
