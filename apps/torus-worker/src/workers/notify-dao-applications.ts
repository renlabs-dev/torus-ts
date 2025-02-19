import type { AgentApplication, GovernanceItemType } from "@torus-ts/subspace";
import { processApplicationMetadata } from "@torus-ts/subspace";
import { buildIpfsGatewayUrl, parseIpfsUri } from "@torus-ts/utils/ipfs";
import { flattenResult } from "@torus-ts/utils/typing";

import type { WorkerProps } from "../common";
import type { ApplicationDB } from "../db";
import type { Embed, WebhookPayload } from "../discord";
import { getApplicationsDB, sleep, getCadreCandidates } from "../common";
import { parseEnvOrExit } from "../common/env";
import * as db from "../db";
import { sendDiscordWebhook } from "../discord";
import {z} from "zod";
const THUMBNAIL_URL = "https://i.imgur.com/6hJKhMu.gif";

export const env = parseEnvOrExit(
  z.object({
    CURATOR_DISCORD_WEBHOOK_URL: z.string().min(1),
    NEXT_PUBLIC_TORUS_CHAIN_ENV: z.string().min(1),
  }),
)(process.env);

const HOUR = 60 * 60 * 1000;

function isNotifiable(app: ApplicationDB): boolean {
  // TODO: type guard here
  return (
    app.notified === false &&
    app.createdAt.getTime() >= Date.now() - 1 * HOUR
  );
}


export async function notifyNewApplicationsWorker() {
  await pushApplicationsNotification();
  await pushCadreNotification();
}


async function pushCadreNotification() {
  const cadreCandidates = await getCadreCandidates(
    (candidate) => candidate.notified === false
  );
  for (const candidate of cadreCandidates) {
  
    const discordMessage = buildCadreMessage(
      candidate
    );
  
    await sendDiscordWebhook(env.CURATOR_DISCORD_WEBHOOK_URL, discordMessage);
  
    await db.toggleCadreNotification(candidate);
    await sleep(1_000);
  }
}


function buildPortalUrl(){
  const urlQualifier = env.NEXT_PUBLIC_TORUS_CHAIN_ENV === "testnet" ? "testnet." : "";
  return `https://dao.${urlQualifier}torus.network/`;
}

async function pushApplicationsNotification() {
  const applications = await getApplicationsDB(isNotifiable);
  for (const proposal of applications) {
    const r = parseIpfsUri(proposal.data);
    const cid = flattenResult(r);
    if (cid === null) {
      console.warn(`Failed to parse ${proposal.id} cid`);
      return;
    }
  
    const url = buildIpfsGatewayUrl(cid);
    const metadata = await processApplicationMetadata(url, proposal.id);
    const resolved_metadata = flattenResult(metadata);
    if (resolved_metadata === null) {
      console.warn(`Failed to get metadata on proposal ${proposal.id}`);
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
  
    await sendDiscordWebhook(env.CURATOR_DISCORD_WEBHOOK_URL, discordMessage);
  
    await db.toggleWhitelistNotification(proposal);
    await sleep(1_000);
  }
}


function buildApplicationMessage(
  discordId: string,
  proposal: ApplicationDB,
  applicationUrl: string,
) {
  const embedParamsMap = {
    OPEN: {
      title: "New Pending whitelist Application",
      description: "A new whitelist application has been submitted",
      color: 0xFFDE00, // Yellow
    },
    ACCEPTED: {
      title: "Accepted whitelist Application",
      description: "A whitelist application has been accepted",
      color: 0x00ff00, // Green
    },
    REJECTED: {
      title: "Rejected whitelist Application",
      description: "A whitelist application has been rejected",
      color: 0xff0000, // Red
    },
    EXPIRED: {
      title: "EXPIRED whitelist Application",
      description: "A whitelist application has expired",
      color: 0xff0000, // Red
    },
  };
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

function buildCadreMessage(candidate: db.CadreCandidate) {
  const embedParamsMap = {
    PENDING: {
      title: "New council candidate",
      description: "A new cadre application has been submitted",
      color: 0xFFDE00, // Yellow
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
  }};
  const embedParams = embedParamsMap[candidate.candidacyStatus];
  
  const candidatesUrl = `${buildPortalUrl()}?view=dao-portal`;
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