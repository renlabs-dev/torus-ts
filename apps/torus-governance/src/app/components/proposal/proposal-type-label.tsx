import { match } from "rustie";

import type { ProposalData } from "@torus-ts/types";
import { Badge } from "@torus-ts/ui";

interface ProposalTypeLabelProps {
  proposalType: ProposalData;
}

export function ProposalTypeLabel(props: ProposalTypeLabelProps): JSX.Element {
  const { proposalType } = props;
  return match(proposalType)({
    globalCustom() {
      return (
        <Badge variant="solid" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10">
          Global Custom
        </Badge>
      );
    },
    globalParams() {
      return (
        <Badge variant="solid" className="text-blue-500 bg-blue-500/10 hover:bg-blue-500/10">
          Global Params
        </Badge>
      );
    },
    subnetCustom() {
      return (
        <Badge variant="solid" className="bg-sky-500/10 text-sky-500 hover:bg-cyan-500/10">
          Subnet Custom
        </Badge>
      );
    },
    subnetParams() {
      return (
        <Badge variant="solid" className="bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/10">
          Subnet Params
        </Badge>
      );
    },
    transferDaoTreasury() {
      return (
        <Badge variant="solid" className="text-teal-500 bg-teal-500/10 hover:bg-teal-500/10">
          Transfer DAO Treasury
        </Badge>
      );
    },
  });
}
