import { Card, CardHeader } from "@torus-ts/ui"
import { smallAddress, getCreationTime, getExpirationTime } from "@torus-ts/utils"
import { VoteText } from "./vote-text"
import type { VoteStatus } from "./vote-label"
import type { ProposalState } from "@torus-ts/types"

type Content = Omit<ProposalState, "proposalCost" | "metadata" | "customData" | "data">

interface DetailsCardProps {
  content: Content
  lastBlockNumber: number;
  voted: VoteStatus;
}

export const DetailsCard = (props: DetailsCardProps) => {
  const { content, lastBlockNumber, voted } = props
  return (
    <Card className="p-6 animate-fade-down animate-delay-200">
      <CardHeader className="pt-0 pl-0">
        <h3>Details</h3>
      </CardHeader>
      <div className="flex flex-col gap-3">
        <div className="flex justify-between text-muted-foreground">
          <span>ID</span>
          <span className="flex items-center text-white">{content.id}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Author</span>
          <span className="flex items-center text-white">
            {smallAddress(content.proposer)}
          </span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Vote Status</span>
          <span className="flex items-center text-white">
            <VoteText vote={voted} />
          </span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Start date</span>
          <span className="flex items-end gap-1 text-white">
            {getCreationTime(
              lastBlockNumber,
              content.creationBlock,
            )}
          </span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>End Time</span>
          <span className="flex items-end gap-1 text-white">
            {getExpirationTime(
              lastBlockNumber,
              content.expirationBlock,
            )}
          </span>
        </div>
      </div>
    </Card>
  )
}