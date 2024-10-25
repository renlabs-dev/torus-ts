import axios from "axios";

export interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface Embed {
  title?: string;
  description?: string;
  color?: number;
  fields?: EmbedField[];
  thumbnail?: { url: string };
  image?: { url: string };
  footer?: { text: string; icon_url?: string };
  timestamp?: string;
}

export interface WebhookPayload {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: Embed[];
}

export async function sendDiscordWebhook(
  webhookUrl: string,
  payload: WebhookPayload,
): Promise<void> {
  return await axios.post(webhookUrl, payload, {
    headers: { "Content-Type": "application/json" },
  });
}
