import { match } from "rustie";

import type { ProposalData } from "@torus-ts/types";
import { Badge } from "@torus-ts/ui";

interface ProposalTypeLabelProps {
  result: ProposalData;
}

export function ProposalTypeLabel(props: ProposalTypeLabelProps): JSX.Element {
  const { result } = props;
  return match(result)({
    globalCustom() {
      return (
        <Badge className="border-emerald-500 bg-emerald-500/10 text-emerald-500">
          Global Custom
        </Badge>
      );
    },
    globalParams() {
      return (
        <Badge className="border-blue-500 bg-blue-500/10 text-blue-500">
          Global Params
        </Badge>
      );
    },
    subnetCustom() {
      return (
        <Badge className="border-sky-500 bg-sky-500/10 text-sky-500">
          Subnet Custom
        </Badge>
      );
    },
    subnetParams() {
      return (
        <Badge className="border-cyan-500 bg-cyan-500/10 text-cyan-500">
          Subnet Params
        </Badge>
      );
    },
    transferDaoTreasury() {
      return (
        <Badge className="border-teal-500 bg-teal-500/10 text-teal-500">
          Transfer DAO Treasury
        </Badge>
      );
    },
  });
}
