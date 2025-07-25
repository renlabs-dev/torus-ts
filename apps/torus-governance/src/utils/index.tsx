import { if_let, match } from "rustie";

import type { ProposalStatus } from "@torus-network/sdk/chain";
import type { CustomMetadataState } from "@torus-network/sdk/metadata";
import { bigintDivision } from "@torus-network/torus-utils";
import { formatToken } from "@torus-network/torus-utils/torus/token";

import type { ProposalState } from "@torus-ts/torus-provider";

export interface ProposalCardFields {
  title: string | null;
  body: string | null;
  invalid?: boolean;
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
): ProposalCardFields {
  if (dataState == null) {
    return {
      title: null,
      body: null,
    };
  }
  return match(dataState)({
    Err(): ProposalCardFields {
      return {
        title: `ID: ${proposalId} | This proposal has no custom metadata`,
        body: null,
        invalid: true,
      };
    },
    Ok(data): ProposalCardFields {
      return {
        title: data.title ?? null,
        body: data.body ?? null,
      };
    },
  });
}

function handleProposalParams(
  proposalId: number,
  params: Record<string, unknown>,
): ProposalCardFields {
  const title = `Parameters proposal #${proposalId}`;
  return {
    title,
    body: paramsToMarkdown(params),
  };
}

function handleProposalEmission(
  proposalId: number,
  emission: Record<string, unknown>,
  customData: CustomMetadataState | null,
): ProposalCardFields {
  const paramsMarkdown = paramsToMarkdown(emission);

  if (customData == null) {
    const title = `Emission proposal #${proposalId}`;
    return {
      title,
      body: paramsMarkdown,
    };
  }

  return match(customData)({
    Err(): ProposalCardFields {
      const title = `Emission proposal #${proposalId}`;
      return {
        title,
        body: paramsMarkdown,
      };
    },
    Ok(data): ProposalCardFields {
      const title = data.title ?? `Emission proposal #${proposalId}`;
      const body = data.body
        ? `${paramsMarkdown}\n${data.body}`
        : paramsMarkdown;

      return {
        title,
        body,
      };
    },
  });
}

export const handleCustomProposal = (
  proposal: ProposalState,
): ProposalCardFields =>
  match(proposal.data)({
    GlobalCustom(): ProposalCardFields {
      return handleCustomProposalData(proposal.id, proposal.customData ?? null);
    },
    GlobalParams(params): ProposalCardFields {
      return handleProposalParams(proposal.id, params);
    },
    TransferDaoTreasury(): ProposalCardFields {
      return handleCustomProposalData(proposal.id, proposal.customData ?? null);
    },
    Emission(params): ProposalCardFields {
      return handleProposalEmission(
        proposal.id,
        params,
        proposal.customData ?? null,
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
  return if_let(proposalStatus, "Expired")(
    () => null,
    ({ stakeFor, stakeAgainst }) =>
      // open, accepted, refused
      calcStakePercent(stakeFor, stakeAgainst),
  );
}

export function handleProposalVotesInFavor(proposalStatus: ProposalStatus) {
  return if_let(proposalStatus, "Expired")(
    () => "—",
    ({ stakeFor }) => formatToken(Number(stakeFor)),
  );
}

export function handleProposalVotesAgainst(proposalStatus: ProposalStatus) {
  return if_let(proposalStatus, "Expired")(
    () => "—",
    ({ stakeAgainst }) => formatToken(Number(stakeAgainst)),
  );
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

// == Agent Applications ==

export interface AgentApplicationCardFields {
  title: string | null;
  body: string | null;
}

export function handleCustomAgentApplications(
  agentId: number | null,
  dataState: CustomMetadataState | null,
): AgentApplicationCardFields {
  if (dataState == null) {
    return {
      title: null,
      body: null,
    };
  }
  return match(dataState)({
    Err(): AgentApplicationCardFields {
      return {
        title: `ID: ${agentId} | This Agent Application has no custom metadata`,
        body: null,
      };
    },
    Ok(data): AgentApplicationCardFields {
      return {
        title: data.title ?? null,
        body: data.body ?? null,
      };
    },
  });
}
