import { CONSTANTS, processApplicationMetadata } from "@torus-network/sdk";
import { validateEnvOrExit } from "@torus-network/torus-utils/env";
import {
  buildIpfsGatewayUrl,
  parseIpfsUri,
} from "@torus-network/torus-utils/ipfs";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { flattenResult } from "@torus-network/torus-utils/typing";
import { z } from "zod";
import {
  getApplicationsDB,
  getCadreCandidates,
  getProposalsDB,
  normalizeApplicationValue,
  sleep,
} from "../common";
import { createLogger } from "../common/log";
import type { ApplicationDB } from "../db";
import * as db from "../db";
import type { Embed, WebhookPayload } from "../discord";
import { sendDiscordWebhook } from "../discord";

const log = createLogger({ name: "notify-dao-applications" });

const THUMBNAIL_URL = "https://i.imgur.com/pHJKJys.png";
const HOUR = CONSTANTS.TIME.ONE_HOUR * 1_000;
const retryDelay = 1_000; // 1 second in milliseconds

const getEnv = validateEnvOrExit({
  CURATOR_DISCORD_WEBHOOK_URL: z.string().min(1),
  NEXT_PUBLIC_TORUS_CHAIN_ENV: z.string().min(1),
  NOTIFICATIONS_START_BLOCK: z.number().optional(),
});

/**
 * Determines if an application should be notified
 * @param app Application from database
 * @returns Boolean indicating if notification should be sent
 */
function isNotifiable(app: ApplicationDB): boolean {
  return (
    app.notified === false && app.createdAt.getTime() >= Date.now() - 1 * HOUR
  );
}

/**
 * Main worker function that sends notifications for new applications, cadre candidates, and proposals
 */
export async function notifyNewApplicationsWorker() {
  const env = getEnv(process.env);
  const startingBlock = env.NOTIFICATIONS_START_BLOCK ?? 350_000;
  const buildUrl = () => buildPortalUrl(env.NEXT_PUBLIC_TORUS_CHAIN_ENV);

  while (true) {
    // We execute functions serially for better logging
    const [error, _] = await tryAsync(
      (async () => {
        await pushApplicationsNotification(
          env.CURATOR_DISCORD_WEBHOOK_URL,
          buildUrl,
        );
        await pushCadreNotification(env.CURATOR_DISCORD_WEBHOOK_URL, buildUrl);
        await pushProposalsNotification(
          env.CURATOR_DISCORD_WEBHOOK_URL,
          startingBlock,
          buildUrl,
        );
      })(),
    );

    if (error !== undefined) {
      log.error(error);
      return;
    }
    await sleep(retryDelay);
  }
}

/**
 * Sends notifications for new cadre candidates
 * @param discordWebhook Discord webhook URL
 * @param buildUrl Function to build portal URL
 */
async function pushCadreNotification(
  discordWebhook: string,
  buildUrl: () => string,
) {
  const [cadreCandidatesError, cadreCandidates] = await tryAsync(
    getCadreCandidates((candidate) => candidate.notified === false),
  );
  if (cadreCandidatesError !== undefined) {
    log.error(cadreCandidatesError);
    return;
  }
  const candidatesUrl = `${buildUrl()}?view=dao-portal`;
  for (const candidate of cadreCandidates) {
    const discordMessage = buildCadreMessage(candidate, candidatesUrl);

    const [discordWebhookError, _] = await tryAsync(
      sendDiscordWebhook(discordWebhook, discordMessage),
    );
    if (discordWebhookError !== undefined) {
      log.error(discordWebhookError);
      return;
    }
    await db.toggleCadreNotification(candidate);
    await sleep(retryDelay);
  }
}

/**
 * Sends notifications for new proposals
 * @param discordWebhook Discord webhook URL
 * @param startingBlock Block number to start notifications from
 * @param buildPortalUrl Function to build portal URL
 */
async function pushProposalsNotification(
  discordWebhook: string,
  startingBlock: number,
  buildPortalUrl: () => string,
) {
  const [proposalsError, proposals] = await tryAsync(
    getProposalsDB((app) => app.notified === false),
  );
  if (proposalsError !== undefined) {
    log.error(proposalsError);
    return;
  }
  // to avoid notifying proposals that expired before the deploy of worker
  for (const proposal of proposals) {
    const proposalURL = `${buildPortalUrl()}proposal/${proposal.id}`;
    const proposalMessage = buildProposalMessage(proposal, proposalURL);
    if (proposal.expirationBlock >= startingBlock) {
      log.info(`Notifying proposal ${proposal.id}`);
      log.info(`Expire block ${proposal.expirationBlock}`);

      const [webhookError, _] = await tryAsync(
        sendDiscordWebhook(discordWebhook, proposalMessage),
      );
      if (webhookError !== undefined) {
        log.error(webhookError);
      }
    } else {
      log.info(`Proposal ${proposal.id} is too old`);
    }

    const [proposalNotificationError, _] = await tryAsync(
      db.toggleProposalNotification(proposal),
    );
    if (proposalNotificationError !== undefined) {
      log.error(proposalNotificationError);
    }

    await sleep(retryDelay);
  }
}

/**
 * Builds the URL for the Torus DAO portal
 * @param environment Chain environment (testnet or mainnet)
 * @returns Full URL to the DAO portal
 */
function buildPortalUrl(environment: string) {
  const urlQualifier = environment === "testnet" ? "testnet." : "";
  return `https://dao.${urlQualifier}torus.network/`;
}

/**
 * Sends notifications for new whitelist applications
 * @param discordWebhook Discord webhook URL
 * @param buildPortalUrl Function to build portal URL
 */
async function pushApplicationsNotification(
  discordWebhook: string,
  buildPortalUrl: () => string,
) {
  const applications = await getApplicationsDB(isNotifiable);
  for (const proposal of applications) {
    const r = parseIpfsUri(proposal.data);
    const cid = flattenResult(r);
    if (cid === null) {
      log.info(`Failed to parse ${proposal.id} cid`);
      return;
    }

    const url = buildIpfsGatewayUrl(cid);

    const [metadataError, metadata] = await tryAsync(
      processApplicationMetadata(url, proposal.id),
    );
    if (metadataError !== undefined) {
      log.error(metadataError);
      return;
    }

    const resolved_metadata = flattenResult(metadata);
    if (resolved_metadata === null) {
      log.info(`Failed to get metadata on proposal ${proposal.id}`);
      return;
    }

    const notification = {
      discord_uid: `${resolved_metadata.discord_id}`,
      app_id: `${proposal.id}`,
      application_url: `${buildPortalUrl()}/agent-application/${proposal.id}`,
    };

    const discordMessage = buildApplicationMessage(
      notification.discord_uid,
      proposal,
      notification.application_url,
    );

    const [webhookError, _] = await tryAsync(
      sendDiscordWebhook(discordWebhook, discordMessage),
    );
    if (webhookError !== undefined) {
      log.error(webhookError);
    }

    const [whitelistNotificationError, __] = await tryAsync(
      db.toggleWhitelistNotification(proposal),
    );
    if (whitelistNotificationError !== undefined) {
      log.error(whitelistNotificationError);
    }
    await sleep(retryDelay);
  }
}

/**
 * Generates base embed parameters for different notification types
 * @param objectName Type of object (Whitelist, Proposal, etc.)
 * @returns Map of embed parameters for different statuses
 */
function generateBaseEmbedParams(objectName: string) {
  const embedParamsMap = {
    Open: {
      title: `New Pending ${objectName}`,
      description: `A new ${objectName} has been submitted`,
      color: 0xffde00, // Yellow
    },
    Accepted: {
      title: `Accepted ${objectName}`,
      description: `A ${objectName} has been accepted`,
      color: 0x00ff00, // Green
    },
    Rejected: {
      title: `Rejected ${objectName}`,
      description: `A ${objectName} has been rejected`,
      color: 0xff0000, // Red
    },
    Expired: {
      title: `EXPIRED ${objectName}`,
      description: `A ${objectName} has expired`,
      color: 0xff0000, // Red
    },
  };

  return embedParamsMap;
}

/**
 * Builds a Discord webhook message for an application
 * @param discordId Discord ID of the applicant
 * @param proposal Application data
 * @param applicationUrl URL to the application
 * @returns Webhook payload for Discord
 */
function buildApplicationMessage(
  discordId: string,
  proposal: ApplicationDB,
  applicationUrl: string,
) {
  const embedParamsMap = generateBaseEmbedParams("Whitelist");
  const embedParams = embedParamsMap[proposal.status];
  const embed: Embed = {
    title: embedParams.title,
    description: embedParams.description,
    color: embedParams.color,
    fields: [
      { name: "Application URL", value: applicationUrl },
      { name: "Applicant", value: `<@${discordId}>` },
      { name: "Application ID", value: `${String(proposal.id)}` },
    ],
    thumbnail: { url: THUMBNAIL_URL },
    footer: {
      text: "Please review and discuss the application on our website.",
    },
  };

  const payload: WebhookPayload = {
    content: "",
    username: "ComDAO",
    avatar_url: "https://example.com/avatar.png",
    embeds: [embed],
  };

  return payload;
}

/**
 * Builds a Discord webhook message for a cadre candidate
 * @param candidate Cadre candidate data
 * @param candidatesUrl URL to the candidates page
 * @returns Webhook payload for Discord
 */
function buildCadreMessage(
  candidate: db.CadreCandidate,
  candidatesUrl: string,
) {
  const embedParamsMap = {
    PENDING: {
      title: "New council candidate",
      description: "A new cadre application has been submitted",
      color: 0xffde00, // Yellow
    },
    ACCEPTED: {
      title: "Accepted a candidate",
      description: "The council has a new member",
      color: 0x00ff00, // Green
    },
    REJECTED: {
      title: "Rejected a candidate",
      description: "A candidate has been reject",
      color: 0xff0000, // Red
    },
    REMOVED: {
      title: "Removed a candidate",
      description: "A council member has been removed. Shame on him booo",
      color: 0xff0000, // Red
    },
  };
  const embedParams = embedParamsMap[candidate.candidacyStatus];

  const embed: Embed = {
    title: embedParams.title,
    description: embedParams.description,
    color: embedParams.color,
    fields: [
      { name: "DAO portal", value: `${candidatesUrl}` },
      { name: "Candidate", value: candidate.userKey },
    ],
    thumbnail: { url: THUMBNAIL_URL },
    footer: {
      text: "Please review and discuss the application on our website.",
    },
  };

  const payload: WebhookPayload = {
    content: "",
    username: "ComDAO",
    avatar_url: "https://example.com/avatar.png",
    embeds: [embed],
  };

  return payload;
}

/**
 * Builds a Discord webhook message for a proposal
 * @param application Proposal data
 * @param proposalURL URL to the proposal
 * @returns Webhook payload for Discord
 */

function buildProposalMessage(
  application: db.NewProposal,
  proposalURL: string,
) {
  const embedParamsMap = generateBaseEmbedParams("Proposal");
  const embedParams =
    embedParamsMap[normalizeApplicationValue(application.status)];
  const fields = [
    { name: "Proposer", value: application.proposerKey },
    { name: "Proposal ID", value: `${String(application.id)}` },
  ];

  if (application.status !== "Expired") {
    fields.push({ name: "Proposal URL", value: proposalURL });
  }

  let footer = { text: "" };
  if (application.status !== "Expired") {
    footer = { text: "Please vote on our website." };
  }

  const embed: Embed = {
    title: embedParams.title,
    description: embedParams.description,
    color: embedParams.color,
    fields: fields,
    thumbnail: { url: THUMBNAIL_URL },
    footer: footer,
  };

  const payload: WebhookPayload = {
    content: "",
    username: "ComDAO",
    avatar_url: "https://example.com/avatar.png",
    embeds: [embed],
  };

  return payload;
}
