import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@torus-ts/ui/components/accordion";
import { Button } from "@torus-ts/ui/components/button";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2,
  Wallet,
} from "lucide-react";

type StepStatus = "pending" | "active" | "completed" | "error" | "waiting";

interface TransactionStepItemProps {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
  estimatedTime?: string;
  txHash?: string;
  explorerUrl?: string;
  isSignatureRequired?: boolean;
  errorDetails?: string;
  showSignatureWarning?: boolean;
  amount?: string;
  isLast?: boolean;
}

/**
 * Get the icon element that represents a step's status.
 *
 * @param status - The step status to render an icon for
 * @returns A JSX element for the status icon: `completed` → check circle, `active` → spinning loader, `waiting` → clock, `error` → alert circle, otherwise a gray rounded placeholder
 */
function getStatusIcon(status: StepStatus) {
  if (status === "completed") {
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  }

  if (status === "active") {
    return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
  }

  if (status === "waiting") {
    return <Clock className="h-5 w-5 text-yellow-500" />;
  }

  if (status === "error") {
    return <AlertCircle className="h-5 w-5 text-red-500" />;
  }

  return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
}

/**
 * Map a step status to the corresponding Tailwind text color class.
 *
 * @param status - The step status to map
 * @returns The Tailwind CSS text color class associated with `status`
 */
function getStatusColor(status: StepStatus) {
  if (status === "completed") return "text-green-600";
  if (status === "active") return "text-blue-600";
  if (status === "waiting") return "text-yellow-600";
  if (status === "error") return "text-red-600";
  return "text-gray-500";
}

/**
 * Get the Tailwind CSS background color class for a step connector based on the step status.
 *
 * @param status - The step's status
 * @returns The Tailwind background color utility class for the connector (`bg-green-500`, `bg-blue-500`, `bg-red-500`, or `bg-gray-300`)
 */
function getStepConnectorColor(status: StepStatus) {
  if (status === "completed") return "bg-green-500";
  if (status === "active") return "bg-blue-500";
  if (status === "error") return "bg-red-500";
  return "bg-gray-300";
}

/**
 * Determine the network name from a step title and optional description.
 *
 * @param title - Primary text inspected for network keywords
 * @param description - Optional additional text inspected for network keywords
 * @returns The network name: `"Base"`, `"Torus Native"`, or `"Torus EVM"`
 */
function getNetworkName(title: string, description?: string) {
  const context = `${title} ${description ?? ""}`;
  if (context.includes("Base")) return "Base";
  if (context.includes("Native")) return "Torus Native";
  return "Torus EVM";
}

/**
 * Render a transaction step row that displays status, title, description, optional timing, warnings, errors, and a collapsible details panel for completed transactions.
 *
 * @param id - Unique identifier for the step
 * @param title - Primary label for the step
 * @param description - Short explanatory text displayed under the title
 * @param status - Step status; determines icons and colors (`"pending" | "active" | "completed" | "error" | "waiting"`)
 * @param estimatedTime - Optional human-readable estimated time (e.g., "30s")
 * @param txHash - Optional transaction hash; used to show transaction details when present
 * @param explorerUrl - Optional URL to the transaction on a block explorer; used by the "View on Explorer" action
 * @param isSignatureRequired - When true, indicates the step requires a wallet signature and adjusts the leading icon and badge
 * @param errorDetails - Optional error message displayed when `status` is `"error"`
 * @param showSignatureWarning - When true and a signature is required for an active step, displays a signature approval warning
 * @param amount - Optional numeric or string amount displayed in the completed step details (shown with "TORUS" unit)
 * @param isLast - When true, omits the vertical connector after this step
 * @returns The rendered JSX element for the transaction step row
 */
export function TransactionStepItem({
  id,
  title,
  description,
  status,
  estimatedTime,
  txHash,
  explorerUrl,
  isSignatureRequired,
  errorDetails,
  showSignatureWarning,
  amount,
  isLast,
}: TransactionStepItemProps) {
  const displayIcon = isSignatureRequired ? (
    <Wallet className="h-4 w-4" />
  ) : (
    <Clock className="h-4 w-4" />
  );

  return (
    <div key={id} className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex-shrink-0">{getStatusIcon(status)}</div>
        {!isLast && (
          <div
            className={`mt-2 w-px flex-1 ${getStepConnectorColor(status)}`}
          />
        )}
      </div>

      <div className="min-w-0 flex-1 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`mr-2 ${getStatusColor(status)}`}>
              {displayIcon}
            </span>
            <h3 className={`font-medium ${getStatusColor(status)}`}>{title}</h3>
            {isSignatureRequired && status === "active" && (
              <span className="rounded-full border border-blue-200 bg-transparent px-2 py-1 text-xs text-blue-600">
                Signature Required
              </span>
            )}
          </div>
          {estimatedTime && (
            <span className="text-muted-foreground text-xs">
              {estimatedTime}
            </span>
          )}
        </div>

        <p className="text-muted-foreground mt-1 text-sm">{description}</p>

        {showSignatureWarning && isSignatureRequired && status === "active" && (
          <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-200 bg-transparent p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm text-amber-700">
                Please check your wallet and approve the transaction signature
              </p>
            </div>
          </div>
        )}

        {status === "error" && errorDetails && (
          <div className="mt-2 rounded-md border border-red-500 bg-transparent p-3">
            <p className="text-sm font-medium text-red-600">{errorDetails}</p>
          </div>
        )}

        {status === "completed" && txHash && explorerUrl && (
          <Accordion type="single" collapsible className="mt-2">
            <AccordionItem value="details">
              <AccordionTrigger className="text-sm">
                <ExternalLink className="mr-1 h-3 w-3" />
                View Transaction Details
              </AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm">
                {amount && (
                  <div>
                    Amount: <strong>{amount} TORUS</strong>
                  </div>
                )}
                <div>
                  Network: <strong>{getNetworkName(title, description)}</strong>
                </div>
                <div>
                  Transaction ID:{" "}
                  <span className="font-mono text-xs">
                    {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </span>
                </div>
                <div>
                  Gas Fees:{" "}
                  <em>Estimated ~0.001 ETH (actual varies by network)</em>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(explorerUrl, "_blank", "noopener,noreferrer");
                  }}
                  className="mt-2 w-full justify-start"
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  View on Explorer
                </Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </div>
  );
}