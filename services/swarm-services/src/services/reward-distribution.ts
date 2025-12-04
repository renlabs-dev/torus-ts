import type { SS58Address } from "@torus-network/sdk/types";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import { insertRewardDistribution } from "../db.js";

const log = BasicLogger.create({ name: "reward-distribution" });

/**
 * Save distribution record to database
 *
 * @param scores - Map of SS58Address to basis point weights
 * @param permissionId - Optional permission ID if already created
 */
export async function saveDistribution(
  scores: Map<SS58Address, number>,
  permissionId: string | null = null,
): Promise<void> {
  await insertRewardDistribution(scores, permissionId);

  log.info("Distribution record saved", {
    recipients: scores.size,
    permissionId,
  });
}
