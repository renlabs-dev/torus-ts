"use client";

import { Copy } from "lucide-react";

import { smallAddress } from "@torus-network/torus-utils/torus/address";

import { CopyButton } from "@torus-ts/ui/components/copy-button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";
import { cn } from "@torus-ts/ui/lib/utils";

import { api } from "~/trpc/react";

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
          className="h-auto p-1 hover:bg-muted/50"
        >
          <Copy className="h-3 w-3" />
        </CopyButton>
      )}
      
      <div className="flex items-center gap-1 min-w-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="font-mono text-sm cursor-help hover:text-foreground/80 transition-colors">
              {truncatedAddress}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-mono">{address}</p>
          </TooltipContent>
        </Tooltip>
        
        {agentName && (
          <span className="text-sm text-muted-foreground">
            ({agentName})
          </span>
        )}
      </div>
    </div>
  );
}