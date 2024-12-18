import { Copy } from "lucide-react";

import type { Blocks, SS58Address } from "@torus-ts/subspace";
import { toast } from "@torus-ts/query-provider/use-toast";
import { Card, CardHeader } from "@torus-ts/ui";
import { copyToClipboard } from "@torus-ts/ui/utils";
import { getCreationTime, getExpirationTime } from "@torus-ts/utils";
import { smallAddress } from "@torus-ts/utils/subspace";

interface DetailsCardProps {
  author: SS58Address;
  id: number;
  creationBlock: Blocks;
  expirationBlock?: Blocks;
  lastBlockNumber: Blocks;
}

export const DetailsCard = (props: DetailsCardProps) => {
  const { author, id, creationBlock, expirationBlock, lastBlockNumber } = props;

  const handleCopyClick = async (value: string): Promise<void> => {
    try {
      await copyToClipboard(value);
      toast.success("Author address copied to clipboard");
    } catch {
      toast.error("Failed to copy author address");
    }
  };

  return (
    <Card className="animate-fade-down p-4 animate-delay-200 lg:p-6">
      <CardHeader className="pl-0 pt-0">
        <h3>Details</h3>
      </CardHeader>
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between gap-2 text-muted-foreground">
          <span>ID</span>
          <span className="flex items-center text-white">{id}</span>
        </div>

        <div className="flex justify-between gap-3 text-muted-foreground">
          <span>Author</span>
          <span className="flex w-fit items-center gap-2 text-white">
            {smallAddress(author)}
            <Copy
              size={16}
              onClick={() => handleCopyClick(author)}
              className="hover:cursor-pointer hover:text-muted-foreground"
            />
          </span>
        </div>

        <div className="flex justify-between gap-3 text-muted-foreground">
          <span>Start date</span>
          <span className="flex items-end gap-1 text-white">
            {getCreationTime(lastBlockNumber, creationBlock)}
          </span>
        </div>
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
