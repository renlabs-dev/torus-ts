"use client";

import { useTorus } from "@torus-ts/torus-provider";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";
import {
  UpdateAgentNonOwnerButton,
  UpdateAgentNonOwnerTooltip,
} from "./update-agent-button.shared";
import { UpdateAgentDialogButton } from "./update-agent-dialog/update-agent-dialog-button";

interface UpdateAgentButtonProps {
  agentKey: string;
}

export function UpdateAgentButton({ agentKey }: UpdateAgentButtonProps) {
  const { selectedAccount } = useTorus();
  const isOwner = selectedAccount?.address === agentKey;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {isOwner ? (
            <UpdateAgentDialogButton agentKey={agentKey} />
          ) : (
            <UpdateAgentNonOwnerButton className="flex w-full items-center gap-1.5 p-3 border-gray-500 text-gray-500" />
          )}
        </TooltipTrigger>
        {!isOwner && <UpdateAgentNonOwnerTooltip />}
      </Tooltip>
    </TooltipProvider>
  );
}
