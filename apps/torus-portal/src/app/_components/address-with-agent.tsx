"use client";

import { smallAddress } from "@torus-network/torus-utils/torus/address";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";
import { cn } from "@torus-ts/ui/lib/utils";
import { api } from "~/trpc/react";
import { Copy } from "lucide-react";

interface AddressWithAgentProps {
  address: string;
  className?: string;
  showCopyButton?: boolean;
  addressLength?: number;
}

export function AddressWithAgent({
  address,
  className,
  showCopyButton = true,
  addressLength = 6,
}: AddressWithAgentProps) {
  const { data: agent } = api.agent.byKeyLastBlock.useQuery({ key: address });

  const agentName = agent?.name;
  const truncatedAddress = smallAddress(address, addressLength);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showCopyButton && (
        <CopyButton
          copy={address}
          variant="ghost"
          message="Address copied to clipboard"
          className="hover:bg-muted/50 h-auto p-1"
        >
          <Copy className="h-3 w-3" />
        </CopyButton>
      )}

      <div className="flex min-w-0 items-center gap-1">
        {agentName && <span className="text-sm">{agentName}</span>}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="hover:text-foreground/60 text-muted-foreground cursor-help font-mono text-sm transition-colors">
              ({truncatedAddress})
            </span>
          </TooltipTrigger>
          <TooltipContent className="z-[100]">
            <p className="font-mono">{address}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
