import { cn, Loading } from "..";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";

export interface TransactionResult {
  finalized: boolean;
  message: string | null;
  status: "SUCCESS" | "ERROR" | "PENDING" | "STARTING" | null;
}

interface TransactionStatusProps {
  status: TransactionResult["status"];
  message: string | null;
}

export function TransactionStatus({
  status,
  message,
}: Readonly<TransactionStatusProps>): JSX.Element {
  const statusConfig = {
    SUCCESS: { color: "text-cyan-300", Icon: CheckCircleIcon },
    ERROR: { color: "text-red-300", Icon: ExclamationCircleIcon },
    PENDING: { color: "text-white", Icon: null },
    STARTING: { color: "text-white", Icon: null },
  };

  const { color, Icon } = status
    ? statusConfig[status]
    : { color: "", Icon: null };

  return (
    <div className={cn("flex items-center gap-1 text-left text-sm", color)}>
      {status && status !== "SUCCESS" && status !== "ERROR" && (
        <Loading className={color} />
      )}
      {Icon && <Icon className="h-5 w-5" />}
      <p className="mt-0.5">{message}</p>
    </div>
  );
}
