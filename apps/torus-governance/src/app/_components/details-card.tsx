import type { Blocks, SS58Address } from "@torus-ts/subspace";
import { Card, CardHeader, CardTitle } from "@torus-ts/ui/components/card";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import { getCreationTime, getExpirationTime } from "@torus-ts/utils";
import { smallAddress } from "@torus-ts/utils/subspace";
import { Copy } from "lucide-react";

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
        <div className="text-muted-foreground flex justify-between gap-2">
          <span>ID</span>
          <span className="flex items-center text-white">{id}</span>
        </div>

        <div className="text-muted-foreground flex justify-between gap-3">
          <span>Author</span>
          <CopyButton
            copy={author}
            variant="link"
            className="hover:text-muted-foreground h-fit p-0"
          >
            <span>{smallAddress(author)}</span>
            <Copy size={16} />
          </CopyButton>
        </div>
        {agentKey && (
          <div className="text-muted-foreground flex justify-between gap-3">
            <span>Agent Address</span>
            <CopyButton
              copy={agentKey}
              variant="link"
              className="hover:text-muted-foreground h-fit p-0"
            >
              <span>{smallAddress(agentKey)}</span>
              <Copy size={16} />
            </CopyButton>
          </div>
        )}
        {creationBlock && (
          <div className="text-muted-foreground flex justify-between gap-3">
            <span>Start date</span>
            <span className="flex items-end gap-1 text-white">
              {getCreationTime(lastBlockNumber, creationBlock)}
            </span>
          </div>
        )}

        {expirationBlock && (
          <div className="text-muted-foreground flex justify-between gap-3">
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
