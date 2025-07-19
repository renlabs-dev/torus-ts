import type { ProposalData } from "@torus-network/sdk/chain";
import { Badge } from "@torus-ts/ui/components/badge";
import { match } from "rustie";

interface ProposalTypeLabelProps {
  proposalType: ProposalData;
}

export function ProposalTypeLabel(props: ProposalTypeLabelProps) {
  const { proposalType } = props;

  const badgeClass = "bg-blue-500/20 text-blue-500 hover:bg-blue-500/10";

  return match(proposalType)({
    GlobalCustom() {
      return (
        <Badge variant="solid" className={badgeClass}>
          Global Custom
        </Badge>
      );
    },
    GlobalParams() {
      return (
        <Badge variant="solid" className={badgeClass}>
          Global Params
        </Badge>
      );
    },
    TransferDaoTreasury() {
      return (
        <Badge variant="solid" className={badgeClass}>
          Transfer DAO Treasury
        </Badge>
      );
    },
    Emission() {
      return (
        <Badge variant="solid" className={badgeClass}>
          Emission
        </Badge>
      );
    },
  });
}
