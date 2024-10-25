import { z } from "zod";

import type { DaoApplications, GovernanceModeType } from "@commune-ts/types";
import {
  buildIpfsGatewayUrl,
  flattenResult,
  parseIpfsUri,
  processDaoMetadata,
} from "@commune-ts/subspace/utils";

import type { WorkerProps } from "../common";
import type { NewNotification } from "../db";
import type { Embed, WebhookPayload } from "../discord";
import { getApplications, sleep } from "../common";
import { parseEnvOrExit } from "../common/env";
import { addSeenProposal, getProposalIdsByType } from "../db";
import { sendDiscordWebhook } from "../discord";

const THUMBNAIL_URL = "https://i.imgur.com/6hJKhMu.gif";

export const env = parseEnvOrExit(
  z.object({
    DAO_NOTIFIER_DISCORD_WEBHOOK_URL: z.string().min(1),
  }),
)(process.env);

export async function notifyNewApplicationsWorker(props: WorkerProps) {
  const pending_apps = Object.values(
    await getApplications(props.api, ["Pending"]),
  );
  const p_type: GovernanceModeType = "DAO";
  const proposals = await getProposalIdsByType(p_type);
  const proposalsSet: Set<number> = new Set<number>(proposals);
  const unseen_proposals = pending_apps.filter(
    (application) => !proposalsSet.has(application.id),
  );

  for (const unseen_proposal of unseen_proposals) {
    await pushNotification(unseen_proposal, p_type);
    await sleep(1_000);
  }
}

async function pushNotification(
  proposal: DaoApplications,
  pType: GovernanceModeType,
) {
  const r = parseIpfsUri(proposal.data);
  const cid = flattenResult(r);
  if (cid === null) {
    console.warn(`Failed to parse ${proposal.id} cid`);
    return;
  }

  const url = buildIpfsGatewayUrl(cid);
  const metadata = await processDaoMetadata(url, proposal.id);
  const resolved_metadata = flattenResult(metadata);
  if (resolved_metadata === null) {
    console.warn(`Failed to get metadata on proposal ${proposal.id}`);
    return;
  }

  const notification = {
    discord_uid: `${resolved_metadata.discord_id}`,
    app_id: `${proposal.id}`,
    application_url: `https://governance.communeai.org/dao/${proposal.id}`,
  };
  const seen_proposal: NewNotification = {
    governanceModel: pType,
    proposalId: proposal.id,
  };

  const discordMessage = buildDiscordMessage(
    notification.discord_uid,
    String(proposal.id),
    notification.application_url,
  );

  await sendDiscordWebhook(
    env.DAO_NOTIFIER_DISCORD_WEBHOOK_URL,
    discordMessage,
  );

  await addSeenProposal(seen_proposal);
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
