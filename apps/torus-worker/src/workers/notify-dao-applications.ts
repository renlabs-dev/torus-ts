import { processApplicationMetadata } from "@torus-network/sdk";
import { validateEnvOrExit } from "@torus-network/torus-utils/env";
import { buildIpfsGatewayUrl, parseIpfsUri } from "@torus-network/torus-utils/ipfs";
import { flattenResult } from "@torus-network/torus-utils/typing";
import { z } from "zod";
import {
  getApplicationsDB,
  getCadreCandidates,
  getProposalsDB,
  sleep,
  log,
  normalizeApplicationValue,
} from "../common";
import type { ApplicationDB } from "../db";
import * as db from "../db";
import type { Embed, WebhookPayload } from "../discord";
import { sendDiscordWebhook } from "../discord";

const THUMBNAIL_URL = "https://i.imgur.com/pHJKJys.png";

const getEnv = validateEnvOrExit({
  CURATOR_DISCORD_WEBHOOK_URL: z.string().min(1),
  NEXT_PUBLIC_TORUS_CHAIN_ENV: z.string().min(1),
  NOTIFICATIONS_START_BLOCK: z.number().optional(),
});
const HOUR = 60 * 60 * 1000;

function isNotifiable(app: ApplicationDB): boolean {
  // TODO: type guard here
  return (
    app.notified === false && app.createdAt.getTime() >= Date.now() - 1 * HOUR
  );
}

export async function notifyNewApplicationsWorker() {
  const env = getEnv(process.env);
  const startingBlock = env.NOTIFICATIONS_START_BLOCK ?? 350_000;
  const buildUrl = () => buildPortalUrl(env.NEXT_PUBLIC_TORUS_CHAIN_ENV);
  while(true){
    // We could execute the functions in parallel, but it's not necessary
    // and it's better for the logging to execute then serially
    try {
      await pushApplicationsNotification(env.CURATOR_DISCORD_WEBHOOK_URL, buildUrl);
      await pushCadreNotification(env.CURATOR_DISCORD_WEBHOOK_URL, buildUrl);
      await pushProposalsNotification(
        env.CURATOR_DISCORD_WEBHOOK_URL,
        startingBlock,
        buildUrl,
      );
    } catch (error) {
      log(`Error in notification cycle: ${error instanceof Error ? error.message : String(error)}`);
    }
    await sleep(1_000);
  }
}

async function pushCadreNotification(
  discordWebhook: string,
  buildUrl: () => string,
) {
  const cadreCandidates = await getCadreCandidates(
    (candidate) => candidate.notified === false,
  );
  const candidatesUrl = `${buildUrl()}?view=dao-portal`;
  for (const candidate of cadreCandidates) {
    const discordMessage = buildCadreMessage(candidate, candidatesUrl);

    await sendDiscordWebhook(discordWebhook, discordMessage);

    await db.toggleCadreNotification(candidate);
    await sleep(1_000);
  }
}

async function pushProposalsNotification(
  discordWebhook: string,
  startingBlock: number,
  buildPortalUrl: () => string,
) {
  const proposals = await getProposalsDB((app) => app.notified === false);
  // to avoid notifying proposals that expired before the deploy of worker
  for (const proposal of proposals) {
    const proposalURL = `${buildPortalUrl()}proposal/${proposal.id}`;
    const proposalMessage = buildProposalMessage(proposal, proposalURL);
    if (proposal.expirationBlock >= startingBlock) {
      log(`Notifying proposal ${proposal.id}`);
      log(`Expire block ${proposal.expirationBlock}`);
      await sendDiscordWebhook(discordWebhook, proposalMessage);
    } else {
      log(`Proposal ${proposal.id} is too old`);
    }
    await db.toggleProposalNotification(proposal);
    await sleep(1_000);
  }
}

function buildPortalUrl(environment: string) {
  const urlQualifier = environment === "testnet" ? "testnet." : "";
  return `https://dao.${urlQualifier}torus.network/`;
}

async function pushApplicationsNotification(
  discordWebhook: string,
  buildPortalUrl: () => string,
) {
  const applications = await getApplicationsDB(isNotifiable);
  for (const proposal of applications) {
    const r = parseIpfsUri(proposal.data);
    const cid = flattenResult(r);
    if (cid === null) {
      log(`Failed to parse ${proposal.id} cid`);
      return;
    }

    const url = buildIpfsGatewayUrl(cid);
    const metadata = await processApplicationMetadata(url, proposal.id);
    const resolved_metadata = flattenResult(metadata);
    if (resolved_metadata === null) {
      log(`Failed to get metadata on proposal ${proposal.id}`);
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

    await sendDiscordWebhook(discordWebhook, discordMessage);

    await db.toggleWhitelistNotification(proposal);
    await sleep(1_000);
  }
}

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
    // image: { url: 'https://example.com/image.png' },
    footer: {
      text: "Please review and discuss the application on our website.",
    },
    // timestamp: new Date().toISOString(),
  };

  const payload: WebhookPayload = {
    content: "",
    username: "ComDAO",
    avatar_url: "https://example.com/avatar.png",
    embeds: [embed],
  };

  return payload;
}

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
    color: embedParams.color, // Yellow
    fields: [
      { name: "DAO portal", value: `${candidatesUrl}` },
      { name: "Candidate", value: candidate.userKey },
    ],
    thumbnail: { url: THUMBNAIL_URL },
    // image: { url: 'https://example.com/image.png' },
    footer: {
      text: "Please review and discuss the application on our website.",
    },
    // timestamp: new Date().toISOString(),
  };

  const payload: WebhookPayload = {
    content: "",
    username: "ComDAO",
    avatar_url: "https://example.com/avatar.png",
    embeds: [embed],
  };

  return payload;
}


function buildProposalMessage(
  application: db.NewProposal,
  proposalURL: string,
) {
  const embedParamsMap = generateBaseEmbedParams("Proposal");
  const embedParams = embedParamsMap[normalizeApplicationValue(application.status)];
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
