import type { AgentApplication, GovernanceItemType } from "@torus-ts/subspace";
import { processApplicationMetadata } from "@torus-ts/subspace";
import { buildIpfsGatewayUrl, parseIpfsUri } from "@torus-ts/utils/ipfs";
import { flattenResult } from "@torus-ts/utils/typing";

import type { WorkerProps } from "../common";
import type { NewNotification, ApplicationDB } from "../db";
import type { Embed, WebhookPayload } from "../discord";
import { getApplicationsDB, sleep } from "../common";
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
  const applications = await getApplicationsDB(isNotifiable);

  const item_type: GovernanceItemType = "AGENT_APPLICATION";
  for (const unseen_proposal of applications) {
    await pushNotification(unseen_proposal, item_type);
    await sleep(1_000);
  }
}

async function pushNotification(
  proposal: ApplicationDB,
  item_type: GovernanceItemType,
) {
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
  
  const urlQualifier = env.NEXT_PUBLIC_TORUS_CHAIN_ENV === "testnet" ? "testnet." : "";
  const notification = {
    discord_uid: `${resolved_metadata.discord_id}`,
    app_id: `${proposal.id}`,
    application_url: `https://dao.${urlQualifier}torus.network/agent-application/${proposal.id}`,
  };

  const discordMessage = buildDiscordMessage(
    notification.discord_uid,
    proposal,
    notification.application_url,
  );

  await sendDiscordWebhook(env.CURATOR_DISCORD_WEBHOOK_URL, discordMessage);

  await db.toggleWhitelistNotification(proposal);
}

function buildEmbedParams(proposal: ApplicationDB) {
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

  return embedParamsMap[proposal.status];
}

function buildDiscordMessage(
  discordId: string,
  proposal: ApplicationDB,
  applicationUrl: string,
) {
  const embedParams = buildEmbedParams(proposal);
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
