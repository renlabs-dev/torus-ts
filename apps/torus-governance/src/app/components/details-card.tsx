import { Copy } from "lucide-react";

import type { Blocks, SS58Address } from "@torus-ts/subspace";
import { toast } from "@torus-ts/toast-provider";
import { Card, CardHeader, CardTitle, CopyButton } from "@torus-ts/ui";
import { getCreationTime, getExpirationTime } from "@torus-ts/utils";
import { smallAddress } from "@torus-ts/utils/subspace";

interface DetailsCardProps {
  author: SS58Address;
  agentKey?: SS58Address;
  id: number;
  creationBlock?: Blocks;
  expirationBlock?: Blocks;
  lastBlockNumber: Blocks;
}

export const DetailsCard = (props: DetailsCardProps) => {
  const {
    author,
    agentKey,
    id,
    creationBlock,
    expirationBlock,
    lastBlockNumber,
  } = props;

  return (
    <Card className="animate-fade-down p-4 lg:p-6">
      <CardHeader className="pl-0 pt-0">
        <CardTitle className="font-semibold">Details</CardTitle>
      </CardHeader>
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between gap-2 text-muted-foreground">
          <span>ID</span>
          <span className="flex items-center text-white">{id}</span>
        </div>

        <div className="flex justify-between gap-3 text-muted-foreground">
          <span>Author</span>
          <CopyButton
            copy={author}
            variant="link"
            notify={() => toast.success("Copied to clipboard")}
            className="h-fit p-0 hover:text-muted-foreground"
          >
            <span>{smallAddress(author)}</span>
            <Copy size={16} />
          </CopyButton>
        </div>
        {agentKey && (
          <div className="flex justify-between gap-3 text-muted-foreground">
            <span>Agent Address</span>
            <CopyButton
              copy={agentKey}
              variant="link"
              notify={() => toast.success("Copied to clipboard")}
              className="h-fit p-0 hover:text-muted-foreground"
            >
              <span>{smallAddress(agentKey)}</span>
              <Copy size={16} />
            </CopyButton>
          </div>
        )}
        {creationBlock && (
          <div className="flex justify-between gap-3 text-muted-foreground">
            <span>Start date</span>
            <span className="flex items-end gap-1 text-white">
              {getCreationTime(lastBlockNumber, creationBlock)}
            </span>
          </div>
        )}

        {expirationBlock && (
          <div className="flex justify-between gap-3 text-muted-foreground">
            <span>End Time</span>
            <span className="flex items-end gap-1 text-white">
              {getExpirationTime(lastBlockNumber, expirationBlock)}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};
