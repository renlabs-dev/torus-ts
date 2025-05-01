"use client";

import { useTorus } from "@torus-ts/torus-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";
import { Button } from "@torus-ts/ui/components/button";
import { Pencil } from "lucide-react";
import { cn } from "@torus-ts/ui/lib/utils";

interface UpdateAgentCoreButtonProps {
  className?: string;
  onClick?: () => void;
  isDisabled?: boolean;
  variant: "owner" | "wait-period" | "non-owner";
  agentKey?: string;
}

interface UpdateAgentDialogButtonProps {
  agentKey: string;
  variant: "owner" | "wait-period";
}

const baseButtonClasses = "flex w-full items-center gap-2 p-3 cursor-pointer";

const variantStyles = {
  owner:
    "border-green-500 text-green-500 opacity-65 hover:text-green-500 hover:opacity-100 hover:bg-green-500/10",
  "wait-period":
    "border-amber-500 text-amber-500 opacity-65 hover:text-amber-500 hover:opacity-100 hover:bg-amber-500/10",
  "non-owner": "border-gray-500 text-gray-500 cursor-not-allowed",
};

const UpdateAgentButtonContent = () => (
  <div className="flex items-center gap-2">
    <Pencil className="h-4 w-4" />
    <span>Update Agent Info</span>
  </div>
);

const UpdateAgentCoreButton = ({
  className,
  onClick,
  isDisabled,
  variant,
}: UpdateAgentCoreButtonProps) => (
  <Button
    variant="outline"
    className={cn(baseButtonClasses, variantStyles[variant], className)}
    onClick={onClick}
    disabled={isDisabled ?? variant === "non-owner"}
    aria-label="Edit agent information"
    aria-disabled={variant === "non-owner" ? "true" : undefined}
  >
    <UpdateAgentButtonContent />
  </Button>
);

const UpdateAgentDialogButton = ({
  agentKey,
  variant,
}: UpdateAgentDialogButtonProps) => (
  <UpdateAgentCoreButton agentKey={agentKey} variant={variant} />
);

export function UpdateAgentButton({ agentKey }: { agentKey: string }) {
  const { selectedAccount } = useTorus();
  const isOwner = selectedAccount?.address === agentKey;

  if (isOwner) {
    return <UpdateAgentDialogButton agentKey={agentKey} variant="owner" />;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <UpdateAgentCoreButton variant="non-owner" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Only the agent owner can update agent information</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
