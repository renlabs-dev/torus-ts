"use client";

import { useTorus } from "@torus-ts/torus-provider";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";
import {
  EditAgentNonOwnerButton,
  EditAgentNonOwnerTooltip,
  EditAgentOwnerButton,
} from "./edit-agent-button.shared";
import { cn } from "@torus-ts/ui/lib/utils";

interface EditAgentButtonProps {
  agentKey: string;
}

export function EditAgentButton({ agentKey }: EditAgentButtonProps) {
  const { selectedAccount } = useTorus();
  const isOwner = selectedAccount?.address === agentKey;

  const buttonClassNames = cn(
    "flex w-full items-center gap-1.5 p-3",
    isOwner
      ? "border-green-500 text-green-500 opacity-65 transition duration-200 hover:text-green-500 hover:opacity-100"
      : "border-gray-500 text-gray-500",
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            {isOwner ? (
              <EditAgentOwnerButton
                agentKey={agentKey}
                className={buttonClassNames}
              />
            ) : (
              <EditAgentNonOwnerButton className={buttonClassNames} />
            )}
          </div>
        </TooltipTrigger>
        {!isOwner && <EditAgentNonOwnerTooltip />}
      </Tooltip>
    </TooltipProvider>
  );
}
