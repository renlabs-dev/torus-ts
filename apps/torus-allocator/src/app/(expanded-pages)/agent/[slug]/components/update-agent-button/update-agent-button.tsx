"use client";

import { useTorus } from "@torus-ts/torus-provider";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";
import { Button } from "@torus-ts/ui/components/button";
import { Pencil } from "lucide-react";
import { cn } from "@torus-ts/ui/lib/utils";

interface AgentButtonProps {
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant: "owner" | "wait-period" | "non-owner";
  agentKey?: string;
}

interface AgentDialogButtonProps {
  agentKey: string;
  variant: "owner" | "wait-period";
}

const baseButtonClasses = "flex w-full items-center gap-1.5 p-3";

const variantStyles = {
  owner:
    "border-green-500 text-green-500 opacity-65 hover:text-green-500 hover:opacity-100 hover:bg-green-500/10",
  "wait-period":
    "border-amber-500 text-amber-500 opacity-65 hover:text-amber-500 hover:opacity-100 hover:bg-amber-500/10",
  "non-owner": "border-gray-500 text-gray-500",
};

const AgentButtonContent = () => (
  <>
    <Pencil className="mr-2 h-4 w-4" />
    Update Agent Info
  </>
);

const AgentNonOwnerTooltip = () => (
  <TooltipContent>
    <p>Only the agent owner can update agent information</p>
  </TooltipContent>
);

const AgentButton = ({
  className,
  onClick,
  disabled,
  variant,
}: AgentButtonProps) => (
  <Button
    variant="outline"
    className={cn(baseButtonClasses, variantStyles[variant], className)}
    onClick={onClick}
    disabled={disabled ?? variant === "non-owner"}
    aria-label="Edit agent information"
    aria-disabled={variant === "non-owner" ? "true" : undefined}
  >
    <AgentButtonContent />
  </Button>
);

const AgentDialogButton = ({ agentKey, variant }: AgentDialogButtonProps) => (
  <AgentButton agentKey={agentKey} variant={variant} />
);

export function UpdateAgentButton({ agentKey }: { agentKey: string }) {
  const { selectedAccount } = useTorus();
  const isOwner = selectedAccount?.address === agentKey;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {isOwner ? (
            <AgentDialogButton agentKey={agentKey} variant="owner" />
          ) : (
            <AgentButton variant="non-owner" />
          )}
        </TooltipTrigger>
        {!isOwner && <AgentNonOwnerTooltip />}
      </Tooltip>
    </TooltipProvider>
  );
}
