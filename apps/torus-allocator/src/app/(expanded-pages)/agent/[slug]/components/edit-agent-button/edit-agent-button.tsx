"use client";

import { useTorus } from "@torus-ts/torus-provider";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";
import { api } from "~/trpc/react";
import { useQueryAgentMetadata } from "~/hooks/use-agent-metadata";
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

  const { data: agent } = api.agent.byKeyLastBlock.useQuery(
    { key: agentKey },
    {
      enabled: !!agentKey,
      refetchOnWindowFocus: false,
    },
  );

  const { data: agentMetadata } = useQueryAgentMetadata(agent?.metadataUri, {
    fetchImages: true,
    enabled: !!agent && !!agent.metadataUri,
  });

  const renderButton = () => {
    if (!isOwner) {
      return (
        <EditAgentNonOwnerButton className="flex w-full items-center gap-1.5 p-3 border-gray-500 text-gray-500" />
      );
    }

    if (agentMetadata?.metadata) {
      return (
        <EditAgentDialog
          agentKey={agentKey}
          agent={agent}
          metadata={agentMetadata.metadata}
          icon={agentMetadata.images?.icon}
        />
      );
    }

    return (
      <EditAgentOwnerButton
        agentKey={agentKey}
        className="flex w-full items-center gap-1.5 p-3 border-green-500 text-green-500 opacity-65
          transition duration-200 hover:text-green-500 hover:opacity-100"
      />
    );
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
