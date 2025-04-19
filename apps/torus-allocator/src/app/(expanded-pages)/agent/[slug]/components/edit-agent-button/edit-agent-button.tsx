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
import { EditAgentDialog } from "./edit-agent-dialog/edit-agent-dialog";

interface EditAgentButtonProps {
  agentKey: string;
}

export function EditAgentButton({ agentKey }: EditAgentButtonProps) {
  const { selectedAccount } = useTorus();
  const isOwner = selectedAccount?.address !== agentKey;

  const renderButton = () => {
    if (!isOwner) {
      return (
        <EditAgentNonOwnerButton className="flex w-full items-center gap-1.5 p-3 border-gray-500 text-gray-500" />
      );
    }

    return <EditAgentDialog agentKey={agentKey} />;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{renderButton()}</TooltipTrigger>
        {!isOwner && <EditAgentNonOwnerTooltip />}
      </Tooltip>
    </TooltipProvider>
  );
}
