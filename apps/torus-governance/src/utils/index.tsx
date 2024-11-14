import { if_let, match } from "rustie";

import type {
  CustomMetadataState,
  DAOCardFields,
  ProposalCardFields,
  ProposalState,
  ProposalStatus,
} from "@torus-ts/subspace/old";
import { paramNameToDisplayName } from "@torus-ts/subspace/old";
import { bigintDivision_WRONG } from "@torus-ts/utils";
import { formatToken } from "@torus-ts/utils/subspace";

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
    globalCustom(): ProposalCardFields {
      return handleCustomProposalData(
        proposal.id,
        proposal.customData ?? null,
        "GLOBAL",
      );
    },
    subnetCustom({ subnetId }): ProposalCardFields {
      return handleCustomProposalData(
        proposal.id,
        proposal.customData ?? null,
        subnetId,
      );
    },
    globalParams(params): ProposalCardFields {
      return handleProposalParams(proposal.id, params, "GLOBAL");
    },
    subnetParams({ subnetId, params }): ProposalCardFields {
      return handleProposalParams(proposal.id, params, subnetId);
    },
    transferDaoTreasury(): ProposalCardFields {
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
    const ratio = bigintDivision_WRONG(stakeFor, totalStake);
    const percentage = ratio * 100;
    return percentage;
  }
  return if_let(proposalStatus, "expired")(
    () => null,
    ({ stakeFor, stakeAgainst }) =>
      // open, accepted, refused
      calcStakePercent(stakeFor, stakeAgainst),
  );
}

export function handleProposalVotesInFavor(proposalStatus: ProposalStatus) {
  return if_let(proposalStatus, "expired")(
    () => "—",
    ({ stakeFor }) => formatToken(Number(stakeFor)),
  );
}

export function handleProposalVotesAgainst(proposalStatus: ProposalStatus) {
  return if_let(proposalStatus, "expired")(
    () => "—",
    ({ stakeAgainst }) => formatToken(Number(stakeAgainst)),
  );
}

export function handleProposalStakeVoted(
  proposalStatus: ProposalStatus,
): string {
  return if_let(proposalStatus, "expired")(
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
      bigintDivision_WRONG(stakeFor + stakeAgainst, totalStake) * 100;
    const percentDisplay = `${Number.isNaN(percentage) ? "—" : percentage.toFixed(1)}%`;
    return <span className="text-yellow-600">{`(${percentDisplay})`}</span>;
  }
  return if_let(proposalStatus, "expired")(
    () => <span className="text-yellow-600">{` (Matured)`}</span>,
    ({ stakeFor, stakeAgainst }) =>
      // open, accepted, refused
      quorumPercent(stakeFor, stakeAgainst),
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
