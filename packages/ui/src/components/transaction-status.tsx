import { useState, useEffect, memo } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "../lib/utils";
import { Loading } from "./loading";

export type TransactionStatus =
  | "SUCCESS"
  | "ERROR"
  | "PENDING"
  | "STARTING"
  | null;

export interface TransactionResult {
  finalized: boolean;
  message: string | null;
  status: TransactionStatus;
}

interface TransactionStatusProps {
  status: TransactionStatus;
  message: string | null;
  clearAfter?: number;
}

const STATUS_CONFIG = {
  SUCCESS: { color: "text-cyan-300", Icon: CircleCheck },
  ERROR: { color: "text-red-300", Icon: CircleAlert },
  PENDING: { color: "text-white", Icon: null },
  STARTING: { color: "text-white", Icon: null },
} as const;

export const TransactionStatus = memo(
  ({
    status,
    message,
    clearAfter = 10_000,
  }: Readonly<TransactionStatusProps>) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
      setVisible(true);

      if (status === "SUCCESS" || status === "ERROR") {
        const timer = setTimeout(() => setVisible(false), clearAfter);
        return () => clearTimeout(timer);
      }
    }, [status, clearAfter]);

    if (!visible || !message) return null;

    const { color, Icon } = status
      ? STATUS_CONFIG[status]
      : { color: "", Icon: null };

    const showLoading = status === "PENDING" || status === "STARTING";

    return (
      <div
        role={status === "ERROR" ? "alert" : "status"}
        aria-live={status === "ERROR" ? "assertive" : "polite"}
        className={cn("flex items-center gap-1 text-left text-sm", color)}
      >
        {showLoading && <Loading className={color} />}
        {Icon && <Icon className="h-5 w-5" />}
        <p className="mt-0.5">{message}</p>
      </div>
    );
  },
);

TransactionStatus.displayName = "TransactionStatus";
