import { match } from "rustie";

import type { ProposalData } from "@torus-ts/subspace";
import { Badge } from "@torus-ts/ui";

interface ProposalTypeLabelProps {
  proposalType: ProposalData;
}

export function ProposalTypeLabel(props: ProposalTypeLabelProps): JSX.Element {
  const { proposalType } = props;
  return match(proposalType)({
    GlobalCustom() {
      return (
        <Badge
          variant="solid"
          className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10"
        >
          Global Custom
        </Badge>
      );
    },
    GlobalParams() {
      return (
        <Badge
          variant="solid"
          className="bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/10"
        >
          Global Params
        </Badge>
      );
    },
    TransferDaoTreasury() {
      return (
        <Badge
          variant="solid"
          className="bg-teal-500/10 text-teal-500 hover:bg-teal-500/10"
        >
          Transfer DAO Treasury
        </Badge>
      );
    },
  });
}
