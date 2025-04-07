import type { AppRouter } from "@torus-ts/api";
import { Badge } from "@torus-ts/ui/components/badge";
import type { inferProcedureOutput } from "@trpc/server";

export type AgentApplicationVoteType = NonNullable<
  inferProcedureOutput<AppRouter["agentApplicationVote"]["byUserKey"]>
>[number]["vote"];

export const AgentApplicationVoteLabel = (props: {
  vote?: AgentApplicationVoteType;
}) => {
  const { vote } = props;

  if (!vote) {
    return null;
  }

  const votingStatus = {
    ACCEPT: (
      <Badge
        variant="solid"
        className="bg-cyan-500/20 text-cyan-500 hover:bg-cyan-500/10"
      >
        Favorable
      </Badge>
    ),
    REFUSE: (
      <Badge
        variant="solid"
        className="bg-red-500/20 text-red-500 hover:bg-red-500/10"
      >
        Against
      </Badge>
    ),
    REMOVE: (
      <Badge
        variant="solid"
        className="bg-pink-500/20 text-pink-500 hover:bg-pink-500/10"
      >
        Revoke
      </Badge>
    ),
  };
  return votingStatus[vote];
};
