import type { VoteStatus } from "./vote-label";
interface VoteTextProps {
  vote: VoteStatus;
}

export function VoteText(props: VoteTextProps): JSX.Element {
  const { vote } = props;

  const votingStatus = {
    UNVOTED: <p className="text-white">You haven't voted</p>,
    FAVORABLE: <p className=" text-green-500">You voted in favor</p>,
    AGAINST: <p className=" text-red-500">You voted against</p>,
  };

  return votingStatus[vote];
}
