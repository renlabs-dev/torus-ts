import * as React from "react";
import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "../lib/utils";
import { Loading } from "./loading";

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
}: Readonly<TransactionStatusProps>) {
  const statusConfig = {
    SUCCESS: { color: "text-cyan-300", Icon: CircleCheck },
    ERROR: { color: "text-red-300", Icon: CircleAlert },
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
