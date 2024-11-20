import type { SS58Address } from "@torus-ts/subspace/old";
import {
  getCreationTime,
  getExpirationTime,
  smallAddress,
} from "@torus-ts/subspace/old";
import { Card, CardHeader } from "@torus-ts/ui";

interface DetailsCardProps {
  author: SS58Address;
  id: number;
  creationBlock: number;
  expirationBlock?: number;
  lastBlockNumber: number;
}

export const DetailsCard = (props: DetailsCardProps) => {
  const { author, id, creationBlock, expirationBlock, lastBlockNumber } = props;
  return (
    <Card className="animate-fade-down p-6 animate-delay-200">
      <CardHeader className="pl-0 pt-0">
        <h3>Details</h3>
      </CardHeader>
      <div className="flex flex-col gap-3">
        <div className="flex justify-between text-muted-foreground">
          <span>ID</span>
          <span className="flex items-center text-white">{id}</span>
        </div>

        <div className="flex justify-between text-muted-foreground">
          <span>Author</span>
          <span className="flex items-center text-white">
            {smallAddress(author)}
          </span>
        </div>

        <div className="flex justify-between text-muted-foreground">
          <span>Start date</span>
          <span className="flex items-end gap-1 text-white">
            {getCreationTime(lastBlockNumber, creationBlock)}
          </span>
        </div>
        {expirationBlock && (
          <div className="flex justify-between text-muted-foreground">
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
