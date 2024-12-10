import { if_let, match } from "rustie";

import type { ProposalState } from "@torus-ts/providers/use-torus";
import type { CustomMetadataState, ProposalStatus } from "@torus-ts/subspace";
import { bigintDivision } from "@torus-ts/utils";
import { formatToken } from "@torus-ts/utils/subspace";

export interface ProposalCardFields {
  title: string | null;
  body: string | null;
  netuid: number | "GLOBAL";
  invalid?: boolean;
}

export interface DAOCardFields {
  title: string | null;
  body: string | null;
}

export const PARAM_FIELD_DISPLAY_NAMES = {
  // # Global
  maxNameLength: "Max Name Length",
  maxAllowedSubnets: "Max Allowed Subnets",
  maxAllowedModules: "Max Allowed Modules",
  unitEmission: "Unit Emission",
  floorDelegationFee: "Floor Delegation Fee",
  maxRegistrationsPerBlock: "Max Registrations Per Block",
  targetRegistrationsPerInterval: "Target Registrations Per Interval",
  targetRegistrationsInterval: "Target Registrations Interval",
  burnRate: "Burn Rate",
  minBurn: "Min Burn",
  maxBurn: "Max Burn",
  adjustmentAlpha: "Adjustment Alpha",
  minStake: "Min Stake",
  maxAllowedWeights: "Max Allowed Weights",
  minWeightStake: "Min Weight Stake",
  proposalCost: "Proposal Cost",
  proposalExpiration: "Proposal Expiration",
  proposalParticipationThreshold: "Proposal Participation Threshold",
  // # Subnet
  founder: "Founder",
  founderShare: "Founder Share",
  immunityPeriod: "Immunity Period",
  incentiveRatio: "Incentive Ratio",
  maxAllowedUids: "Max Allowed UIDs",
  // maxAllowedWeights: "Max Allowed Weights",
  maxStake: "Max Stake",
  maxWeightAge: "Max Weight Age",
  minAllowedWeights: "Min Allowed Weights",
  // minStake: "Min Stake",
  name: "Name",
  tempo: "Tempo",
  trustRatio: "Trust Ratio",
  voteMode: "Vote Mode",
} as const;

export const paramNameToDisplayName = (paramName: string): string => {
  return (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    PARAM_FIELD_DISPLAY_NAMES[
      paramName as keyof typeof PARAM_FIELD_DISPLAY_NAMES
    ] ?? paramName
  );
};

const paramsToMarkdown = (params: Record<string, unknown>): string => {
  const items = [];
  for (const [key, value] of Object.entries(params)) {
    const label = `**${paramNameToDisplayName(key)}**`;
    const formattedValue =
      typeof value === "string" || typeof value === "number"
        ? `\`${value}\``
        : "`???`";

    items.push(`${label}: ${formattedValue}`);
  }
  return `${items.join(" |  ")}\n`;
};

function handleCustomProposalData(
  proposalId: number,
  dataState: CustomMetadataState | null,
  netuid: number | "GLOBAL",
): ProposalCardFields {
  if (dataState == null) {
    return {
      title: null,
      body: null,
      netuid,
    };
  }
  return match(dataState)({
    Err(): ProposalCardFields {
      return {
        title: `ID: ${proposalId} | This proposal has no custom metadata`,
        body: null,
        netuid,
        invalid: true,
      };
    },
    Ok(data): ProposalCardFields {
      return {
        title: data.title ?? null,
        body: data.body ?? null,
        netuid,
      };
    },
  });
}

function handleProposalParams(
  proposalId: number,
  params: Record<string, unknown>,
  netuid: number | "GLOBAL",
): ProposalCardFields {
  const title = `Parameters proposal #${proposalId} for ${
    netuid == "GLOBAL" ? "global network" : `subnet ${netuid}`
  }`;
  return {
    title,
    body: paramsToMarkdown(params),
    netuid,
  };
}

export const handleCustomProposal = (
  proposal: ProposalState,
): ProposalCardFields =>
  match(proposal.data)({
    GlobalCustom(): ProposalCardFields {
      return handleCustomProposalData(
        proposal.id,
        proposal.customData ?? null,
        "GLOBAL",
      );
    },
    SubnetCustom({ subnetId }): ProposalCardFields {
      return handleCustomProposalData(
        proposal.id,
        proposal.customData ?? null,
        subnetId,
      );
    },
    GlobalParams(params): ProposalCardFields {
      return handleProposalParams(proposal.id, params, "GLOBAL");
    },
    SubnetParams({ subnetId, params }): ProposalCardFields {
      return handleProposalParams(proposal.id, params, subnetId);
    },
    TransferDaoTreasury(): ProposalCardFields {
      return handleCustomProposalData(
        proposal.id,
        proposal.customData ?? null,
        "GLOBAL",
      );
    },
  });

export function calcProposalFavorablePercent(
  proposalStatus: ProposalStatus,
): number | null {
  function calcStakePercent(
    stakeFor: bigint,
    stakeAgainst: bigint,
  ): number | null {
    const totalStake = stakeFor + stakeAgainst;
    if (totalStake === 0n) {
      return null;
    }
    const ratio = bigintDivision(stakeFor, totalStake);
    const percentage = ratio * 100;
    return percentage;
  }
  return match(proposalStatus)({
    Open: ({ stakeFor, stakeAgainst }) =>
      calcStakePercent(stakeFor, stakeAgainst),
    Accepted: ({ stakeFor, stakeAgainst }) =>
      calcStakePercent(stakeFor, stakeAgainst),
    Refused: ({ stakeFor, stakeAgainst }) =>
      calcStakePercent(stakeFor, stakeAgainst),
    Expired: () => null,
  });
}

export function handleProposalVotesInFavor(proposalStatus: ProposalStatus) {
  return match(proposalStatus)({
    Open: ({ stakeFor }) => formatToken(Number(stakeFor)),
    Accepted: ({ stakeFor }) => formatToken(Number(stakeFor)),
    Refused: ({ stakeFor }) => formatToken(Number(stakeFor)),
    Expired: () => "—",
  });
}

export function handleProposalVotesAgainst(proposalStatus: ProposalStatus) {
  return match(proposalStatus)({
    Open: ({ stakeAgainst }) => formatToken(Number(stakeAgainst)),
    Accepted: ({ stakeAgainst }) => formatToken(Number(stakeAgainst)),
    Refused: ({ stakeAgainst }) => formatToken(Number(stakeAgainst)),
    Expired: () => "—",
  });
}

export function handleProposalStakeVoted(
  proposalStatus: ProposalStatus,
): string {
  return if_let(proposalStatus, "Expired")(
    () => "—",
    ({ stakeFor, stakeAgainst }) =>
      // open, accepted, refused
      formatToken(Number(stakeFor + stakeAgainst)),
  );
}

export function handleProposalQuorumPercent(
  proposalStatus: ProposalStatus,
  totalStake: bigint,
): JSX.Element {
  function quorumPercent(stakeFor: bigint, stakeAgainst: bigint): JSX.Element {
    const percentage =
      bigintDivision(stakeFor + stakeAgainst, totalStake) * 100;
    const percentDisplay = `${Number.isNaN(percentage) ? "—" : percentage.toFixed(1)}%`;
    return <span className="text-yellow-600">{`(${percentDisplay})`}</span>;
  }
  return if_let(proposalStatus, "Expired")(
    () => <span className="text-yellow-600">{` (Matured)`}</span>,
    ({ stakeFor, stakeAgainst }) => quorumPercent(stakeFor, stakeAgainst),
  );
}

// == DAO Applications ==

export function handleDaoApplications(
  daoId: number | null,
  dataState: CustomMetadataState | null,
): DAOCardFields {
  if (dataState == null) {
    return {
      title: null,
      body: null,
    };
  }
  return match(dataState)({
    Err(): DAOCardFields {
      return {
        title: `ID: ${daoId} | This DAO has no custom metadata`,
        body: null,
      };
    },
    Ok(data): DAOCardFields {
      return {
        title: data.title ?? null,
        body: data.body ?? null,
      };
    },
  });
}

export function handleCustomDaos(
  daoId: number | null,
  dataState: CustomMetadataState | null,
): DAOCardFields {
  if (dataState == null) {
    return {
      title: null,
      body: null,
    };
  }
  return match(dataState)({
    Err(): DAOCardFields {
      return {
        title: `ID: ${daoId} | This DAO has no custom metadata`,
        body: null,
      };
    },
    Ok(data): DAOCardFields {
      return {
        title: data.title ?? null,
        body: data.body ?? null,
      };
    },
  });
}
