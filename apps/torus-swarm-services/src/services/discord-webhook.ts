import type { SS58Address } from "@torus-network/sdk/types";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import { tryAsync } from "@torus-network/torus-utils/try-catch";

const log = BasicLogger.create({ name: "discord-webhook" });

/**
 * Send distribution completion notification to Discord
 *
 * @param webhookUrl - Discord webhook URL
 * @param scores - Map of SS58Address to weights
 */
export async function notifyDistributionComplete(
  webhookUrl: string,
  scores: Map<SS58Address, number>,
): Promise<void> {
  // Sort by weights descending and take top 20
  const sortedEntries = Array.from(scores.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20);

  const top20 = Object.fromEntries(sortedEntries);
  const totalWeights = Array.from(scores.values()).reduce(
    (sum, weight) => sum + weight,
    0,
  );

  const message = {
    embeds: [
      {
        title: "Distribution Completed",
        description: `Successfully calculated contributor rewards for ${scores.size} recipients.`,
        color: 0x00ff00, // Green
        fields: [
          {
            name: "Total Recipients",
            value: scores.size.toString(),
            inline: true,
          },
          {
            name: "Total Weights",
            value: totalWeights.toString(),
            inline: true,
          },
          {
            name: "Top 20 Contributors",
            value: `\`\`\`json\n${JSON.stringify(top20, null, 2)}\n\`\`\``,
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const [error] = await tryAsync(
    fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    }),
  );

  if (error) {
    log.error("Failed to send Discord notification", { error });
  } else {
    log.info("Discord notification sent successfully");
  }
}
