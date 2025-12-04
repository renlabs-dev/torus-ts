import { CONSTANTS } from "@torus-network/sdk/constants";
import { processApplicationMetadata } from "@torus-network/sdk/metadata";
import { validateEnvOrExit } from "@torus-network/torus-utils/env";
import {
  buildIpfsGatewayUrl,
  parseIpfsUri,
} from "@torus-network/torus-utils/ipfs";
import { BasicLogger } from "@torus-network/torus-utils/logger";
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
import type { ApplicationDB } from "../db";
import * as db from "../db";
import type { Embed, WebhookPayload } from "../discord";
import { sendDiscordWebhook } from "../discord";

const log = BasicLogger.create({ name: "notify-dao-applications" });

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
 * Continuously monitors for new DAO entities (applications, cadre candidates, proposals)
 * and sends Discord webhook notifications for each. Runs in an infinite loop.
 */
export async function notifyNewApplicationsWorker() {
  const env = getEnv(process.env);
  const startingBlock = env.NOTIFICATIONS_START_BLOCK ?? 350_000;
  const buildUrl = () => buildPortalUrl(env.NEXT_PUBLIC_TORUS_CHAIN_ENV);

  while (true) {
    // We execute functions serially for better logging
    const workerRes = await tryAsync(
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

    if (log.ifResultIsErr(workerRes)) return;
    await sleep(retryDelay);
  }
}

/**
 * Sends Discord notifications for new cadre (council) candidates.
 * Marks each candidate as notified after successful webhook delivery.
 *
 * @param discordWebhook - Discord channel webhook destination URL
 * @param buildUrl - Function that constructs the DAO portal URL for the current environment
 */
async function pushCadreNotification(
  discordWebhook: string,
  buildUrl: () => string,
) {
  const cadreCandidatesRes = await tryAsync(
    getCadreCandidates((candidate) => candidate.notified === false),
  );
  if (log.ifResultIsErr(cadreCandidatesRes)) return;
  const [_cadreCandidatesErr, cadreCandidates] = cadreCandidatesRes;
  const candidatesUrl = `${buildUrl()}/dao-portal`;
  for (const candidate of cadreCandidates) {
    const discordMessage = buildCadreMessage(candidate, candidatesUrl);

    const discordWebhookRes = await tryAsync(
      sendDiscordWebhook(discordWebhook, discordMessage),
    );
    if (log.ifResultIsErr(discordWebhookRes)) return;
    await db.toggleCadreNotification(candidate);
    await sleep(retryDelay);
  }
}

/**
 * Sends notifications for new governance proposals and marks them as notified.
 * Filters out proposals created before a configurable starting block to prevent
 * notification spam during system initialization.
 *
 * @param discordWebhook - Discord channel webhook destination URL
 * @param startingBlock - Blockchain block number threshold for notification eligibility
 * @param buildPortalUrl - Function that constructs the DAO portal URL
 */
async function pushProposalsNotification(
  discordWebhook: string,
  startingBlock: number,
  buildPortalUrl: () => string,
) {
  const proposalsRes = await tryAsync(
    getProposalsDB((app) => app.notified === false),
  );
  if (log.ifResultIsErr(proposalsRes)) return;
  const [_proposalsErr, proposals] = proposalsRes;
  // to avoid notifying proposals that expired before the deploy of worker
  for (const proposal of proposals) {
    const proposalURL = `${buildPortalUrl()}proposal/${proposal.id}`;
    const proposalMessage = buildProposalMessage(proposal, proposalURL);
    if (proposal.expirationBlock >= startingBlock) {
      log.info(`Notifying proposal ${proposal.id}`);
      log.info(`Expire block ${proposal.expirationBlock}`);

      const webhookRes = await tryAsync(
        sendDiscordWebhook(discordWebhook, proposalMessage),
      );
      if (log.ifResultIsErr(webhookRes)) {
        // continue with other proposals even if this one fails
      }
    } else {
      log.info(`Proposal ${proposal.id} is too old`);
    }

    const proposalNotificationRes = await tryAsync(
      db.toggleProposalNotification(proposal),
    );
    if (log.ifResultIsErr(proposalNotificationRes)) {
      // continue with other proposals even if toggle fails
    }

    await sleep(retryDelay);
  }
}

/**
 * Constructs the appropriate URL for the Torus DAO portal based on environment.
 * Handles subdomain differences between testnet and mainnet deployments.
 *
 * @param environment - Chain environment identifier ('testnet' or 'mainnet')
 * @returns Fully qualified URL to the appropriate DAO portal
 */
function buildPortalUrl(environment: string) {
  const urlQualifier = environment === "testnet" ? "testnet." : "";
  return `https://dao.${urlQualifier}torus.network/`;
}

/**
 * Processes and notifies for new whitelist applications.
 * Fetches IPFS metadata for each application to extract Discord user details,
 * then sends formatted notifications with direct links to review the application.
 *
 * @param discordWebhook - Discord channel webhook destination URL
 * @param buildPortalUrl - Function that constructs the DAO portal URL
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

    const metadataRes = await tryAsync(
      processApplicationMetadata(url, proposal.id),
    );
    if (log.ifResultIsErr(metadataRes)) return;
    const [_metadataErr, metadata] = metadataRes;

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

    const webhookRes = await tryAsync(
      sendDiscordWebhook(discordWebhook, discordMessage),
    );
    if (log.ifResultIsErr(webhookRes)) {
      // continue with other applications even if webhook fails
    }

    const whitelistNotificationRes = await tryAsync(
      db.toggleWhitelistNotification(proposal),
    );
    if (log.ifResultIsErr(whitelistNotificationRes)) {
      // continue with other applications even if toggle fails
    }
    await sleep(retryDelay);
  }
}

/**
 * Creates standardized embed parameter templates for different notification types.
 * Centralizes color coding and messaging conventions for consistent notification styling.
 *
 * @param objectName - Type of entity being notified about (e.g., "Whitelist", "Proposal")
 * @returns Map of embed configurations keyed by status (Open, Accepted, Rejected, Expired)
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
 * Formats a Discord webhook message for a whitelist application.
 * Includes direct Discord mention of the applicant and contextual styling based on status.
 *
 * @param discordId - Discord user ID for direct mention in the notification
 * @param proposal - Application data including status and metadata
 * @param applicationUrl - Direct link to review the application
 * @returns Formatted webhook payload ready for Discord delivery
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
 * Formats a Discord webhook message for a cadre (council) candidate.
 * Handles different statuses including pending, accepted, rejected, and removed statuses
 * with appropriate color coding and messaging.
 *
 * @param candidate - Cadre candidate data including status and blockchain address
 * @param candidatesUrl - URL to the candidates listing page
 * @returns Formatted webhook payload ready for Discord delivery
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
 * Formats a Discord webhook message for a governance proposal.
 * Customizes fields based on proposal status, omitting voting links for expired proposals.
 *
 * @param application - Proposal data including status, proposer, and metadata
 * @param proposalURL - URL to view and vote on the proposal
 * @returns Formatted webhook payload ready for Discord delivery
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
