import { z } from "zod";

import type { AgentApplication, GovernanceItemType } from "@torus-ts/subspace";
import { processApplicationMetadata } from "@torus-ts/subspace";
import { buildIpfsGatewayUrl, parseIpfsUri } from "@torus-ts/utils/ipfs";
import { flattenResult } from "@torus-ts/utils/typing";

import { match } from "rustie";
import type { WorkerProps } from "../common";
import { getApplications, sleep } from "../common";
import { parseEnvOrExit } from "../common/env";
import type { NewNotification } from "../db";
import * as db from "../db";
import type { Embed, WebhookPayload } from "../discord";
import { sendDiscordWebhook } from "../discord";

const THUMBNAIL_URL = "https://i.imgur.com/6hJKhMu.gif";

export const env = parseEnvOrExit(
  z.object({
    CURATOR_DISCORD_WEBHOOK_URL: z.string().min(1),
  }),
)(process.env);

export async function notifyNewApplicationsWorker(props: WorkerProps) {
  const open_applications = Object.values(
    await getApplications(props.api, (app) =>
      match(app.status)({
        Open: () => true,
        Resolved: ({ accepted: _ }) => false,
        Expired: () => false,
      }),
    ),
  );

  const item_type: GovernanceItemType = "AGENT_APPLICATION";
  const know_applications = await db.getGovItemIdsByType(item_type);
  const know_applications_set: Set<number> = new Set<number>(know_applications);

  const is_known_proposal = (app_id: number) =>
    know_applications_set.has(app_id);

  const unseen_applications = open_applications.filter(
    (application) => !is_known_proposal(application.id),
  );

  for (const unseen_proposal of unseen_applications) {
    await pushNotification(unseen_proposal, item_type);
    await sleep(1_000);
  }
}

async function pushNotification(
  proposal: AgentApplication,
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

  const notification = {
    discord_uid: `${resolved_metadata.discord_id}`,
    app_id: `${proposal.id}`,
    application_url: `https://dao.torus.network/proposal/${proposal.id}`,
  };
  const seen_proposal: NewNotification = {
    itemType: item_type,
    itemId: proposal.id,
  };

  const discordMessage = buildDiscordMessage(
    notification.discord_uid,
    String(proposal.id),
    notification.application_url,
  );

  await sendDiscordWebhook(env.CURATOR_DISCORD_WEBHOOK_URL, discordMessage);

  await db.addSeenProposal(seen_proposal);
}

function buildDiscordMessage(
  discordId: string,
  appId: string,
  applicationUrl: string,
) {
  const embed: Embed = {
    title: "New Pending DAO Application",
    description: "A new DAO application has been submitted",
    color: 0x00ff00, // Green color
    fields: [
      { name: "Application URL", value: applicationUrl },
      { name: "Applicant", value: `<@${discordId}>` },
      { name: "Application ID", value: `${appId}` },
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
