import { processApplicationMetadata } from "@torus-network/sdk";
import { validateEnvOrExit } from "@torus-ts/utils/env";
import { tryAsyncLoggingRaw } from "@torus-ts/utils/error-helpers/server-operations";
import { buildIpfsGatewayUrl, parseIpfsUri } from "@torus-ts/utils/ipfs";
import { flattenResult } from "@torus-ts/utils/typing";
import { z } from "zod";
import {
  getApplicationsDB,
  getCadreCandidates,
  getProposalsDB,
  log,
  normalizeApplicationValue,
  sleep,
} from "../common";
import type { ApplicationDB } from "../db";
import * as db from "../db";
import type { Embed, WebhookPayload } from "../discord";
import { sendDiscordWebhook } from "../discord";

const THUMBNAIL_URL = "https://i.imgur.com/pHJKJys.png";
const HOUR = 60 * 60 * 1000;
const defaultRetries = 3;
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
    const [error] = await tryAsyncLoggingRaw(
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

    if (error) {
      log(
        `Error in notification cycle: ${error instanceof Error ? (error.stack ?? error.message) : JSON.stringify(error)}`,
      );
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
  // ==========================
  // ===== Error Handling =====
  // ==========================
  let retries = defaultRetries;
  let cadreCandidates;
  let lastError: unknown;

  while (retries > 0) {
    const [candidatesError, candidatesResult] = await tryAsyncLoggingRaw(
      getCadreCandidates((candidate) => candidate.notified === false),
    );

    if (!candidatesError) {
      cadreCandidates = candidatesResult;
      break;
    }

    lastError = candidatesError;
    log(
      `Error fetching cadre candidates: ${lastError instanceof Error ? (lastError.stack ?? lastError.message) : JSON.stringify(lastError)}, (${retries} retries left)`,
    );
    retries--;
    await sleep(retryDelay);
  }

  if (retries === 0 && lastError) {
    log("Failed to fetch cadre candidates after multiple attempts");
    return;
  }

  if (!cadreCandidates || cadreCandidates.length === 0) {
    log("No cadre candidates found or list is empty");
    return;
  }
  // ==========================

  const candidatesUrl = `${buildUrl()}?view=dao-portal`;

  for (const candidate of cadreCandidates) {
    const discordMessage = buildCadreMessage(candidate, candidatesUrl);

    // Send webhook notification
    const [webhookError] = await tryAsyncLoggingRaw(
      sendDiscordWebhook(discordWebhook, discordMessage),
    );

    if (webhookError) {
      log(
        `Error sending Discord webhook for cadre candidate ${candidate.userKey}: ${webhookError instanceof Error ? (webhookError.stack ?? webhookError.message) : JSON.stringify(webhookError)}`,
      );
      continue;
    }

    // Update notification status
    const [toggleError] = await tryAsyncLoggingRaw(
      db.toggleCadreNotification(candidate),
    );

    if (toggleError) {
      log(
        `Error toggling notification for cadre candidate ${candidate.userKey}: ${toggleError instanceof Error ? (toggleError.stack ?? toggleError.message) : JSON.stringify(toggleError)}`,
      );
    }

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
  // ==========================
  // ===== Error Handling =====
  // ==========================
  let retries = defaultRetries;
  let proposals;
  let lastError: unknown;

  while (retries > 0) {
    const [proposalsError, proposalsResult] = await tryAsyncLoggingRaw(
      getProposalsDB((app) => app.notified === false),
    );

    if (!proposalsError) {
      proposals = proposalsResult;
      break;
    }

    lastError = proposalsError;
    log(
      `Error fetching proposals: ${lastError instanceof Error ? (lastError.stack ?? lastError.message) : JSON.stringify(lastError)}, (${retries} retries left)`,
    );
    retries--;
    await sleep(retryDelay);
  }

  if (retries === 0 && lastError) {
    log("Failed to fetch proposals after multiple attempts");
    return;
  }

  if (!proposals || proposals.length === 0) {
    log("No proposals found or list is empty");
    return;
  }
  // ==========================

  // Process each proposal
  for (const proposal of proposals) {
    const proposalURL = `${buildPortalUrl()}proposal/${proposal.id}`;
    const proposalMessage = buildProposalMessage(proposal, proposalURL);

    // Only notify if proposal hasn't expired
    if (proposal.expirationBlock >= startingBlock) {
      log(
        `Notifying proposal ${proposal.id} (expires at block ${proposal.expirationBlock})`,
      );

      const [webhookError] = await tryAsyncLoggingRaw(
        sendDiscordWebhook(discordWebhook, proposalMessage),
      );

      if (webhookError) {
        log(
          `Error sending Discord webhook for proposal ${proposal.id}: ${webhookError instanceof Error ? (webhookError.stack ?? webhookError.message) : JSON.stringify(webhookError)}`,
        );
        continue;
      }
    } else {
      log(
        `Proposal ${proposal.id} is too old (expires at block ${proposal.expirationBlock})`,
      );
    }

    // Update notification status regardless of whether we sent a notification
    const [toggleError] = await tryAsyncLoggingRaw(
      db.toggleProposalNotification(proposal),
    );

    if (toggleError) {
      log(
        `Error toggling notification for proposal ${proposal.id}: ${toggleError instanceof Error ? (toggleError.stack ?? toggleError.message) : JSON.stringify(toggleError)}`,
      );
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
  // ==========================
  // ===== Error Handling =====
  // ==========================
  let retries = defaultRetries;
  let applications;
  let lastError: unknown;

  while (retries > 0) {
    const [applicationsError, applicationsResult] = await tryAsyncLoggingRaw(
      getApplicationsDB(isNotifiable),
    );

    if (!applicationsError) {
      applications = applicationsResult;
      break;
    }

    lastError = applicationsError;
    log(
      `Error fetching applications: ${lastError instanceof Error ? (lastError.stack ?? lastError.message) : JSON.stringify(lastError)}, (${retries} retries left)`,
    );
    retries--;
    await sleep(retryDelay);
  }

  if (retries === 0 && lastError) {
    log("Failed to fetch applications after multiple attempts");
    return;
  }

  if (!applications) {
    log("No applications found");
    return;
  }
  // ==========================

  // Process each application
  for (const proposal of applications) {
    // Parse IPFS URI
    const r = parseIpfsUri(proposal.data);
    const cid = flattenResult(r);
    if (cid === null) {
      log(`Failed to parse CID for application ${proposal.id}`);
      continue;
    }

    const url = buildIpfsGatewayUrl(cid);

    // Fetch metadata
    const [metadataError, metadata] = await tryAsyncLoggingRaw(
      processApplicationMetadata(url, proposal.id),
    );

    if (metadataError) {
      log(
        `Error processing application metadata for ${proposal.id}: ${metadataError instanceof Error ? (metadataError.stack ?? metadataError.message) : JSON.stringify(metadataError)}`,
      );
      continue;
    }

    const resolved_metadata = flattenResult(metadata);
    if (resolved_metadata === null) {
      log(`Failed to get metadata for application ${proposal.id}`);
      continue;
    }

    // Prepare notification
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

    // Send webhook
    const [webhookError] = await tryAsyncLoggingRaw(
      sendDiscordWebhook(discordWebhook, discordMessage),
    );

    if (webhookError) {
      log(
        `Error sending Discord webhook for application ${proposal.id}: ${webhookError instanceof Error ? (webhookError.stack ?? webhookError.message) : JSON.stringify(webhookError)}`,
      );
      continue;
    }

    // Update notification status
    const [toggleError] = await tryAsyncLoggingRaw(
      db.toggleWhitelistNotification(proposal),
    );

    if (toggleError) {
      log(
        `Error toggling notification for application ${proposal.id}: ${toggleError instanceof Error ? (toggleError.stack ?? toggleError.message) : JSON.stringify(toggleError)}`,
      );
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
