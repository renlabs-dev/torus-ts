import { BasicLogger } from "@torus-network/torus-utils/logger";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { conversionLogsSchema, prospectsSchema } from "@torus-ts/db/schema";
import type { KaitoTwitterAPI } from "@torus-ts/twitter-client";
import { eq } from "drizzle-orm";
import type { ApostleSwarmDB } from "../db";
import { env } from "../env";
import { CheckConversionPayloadSchema } from "../types";

const log = BasicLogger.create({ name: "check-conversion" });

export interface CheckConversionContext {
  db: ApostleSwarmDB;
  twitterClient: KaitoTwitterAPI;
}

/**
 * Handles CHECK_CONVERSION jobs.
 *
 * Checks if a claimed prospect has converted by following the Torus account.
 * If the prospect follows @torus_network:
 * - Updates claim_status to 'CONVERTED'
 * - Inserts a conversion_logs entry with source 'AUTO_FOLLOW_CHECK'
 * Either way, updates last_conversion_check_at.
 */
export async function handleCheckConversion(
  ctx: CheckConversionContext,
  payload: unknown,
): Promise<void> {
  const parseResult = CheckConversionPayloadSchema.safeParse(payload);
  if (!parseResult.success) {
    throw new Error(`Invalid payload: ${parseResult.error.message}`);
  }
  const { prospect_id } = parseResult.data;

  log.info(`Checking conversion for prospect ${prospect_id}`);

  // Fetch prospect from database
  const [prospectErr, prospects] = await tryAsync(
    ctx.db
      .select()
      .from(prospectsSchema)
      .where(eq(prospectsSchema.id, prospect_id))
      .limit(1),
  );
  if (prospectErr !== undefined) {
    throw new Error(`Failed to fetch prospect: ${prospectErr.message}`);
  }

  const prospect = prospects[0];
  if (prospect === undefined) {
    throw new Error(`Prospect ${prospect_id} not found`);
  }

  // Validate prospect state: must be APPROVED and CLAIMED
  if (prospect.approvalStatus !== "APPROVED") {
    throw new Error(
      `Prospect ${prospect_id} is not APPROVED (status: ${prospect.approvalStatus})`,
    );
  }
  if (prospect.claimStatus !== "CLAIMED") {
    log.info(
      `Prospect ${prospect_id} is not CLAIMED (status: ${prospect.claimStatus}), skipping`,
    );
    return;
  }

  const xHandle = prospect.xHandle;
  const targetHandle = env.TORUS_HANDLE;

  log.info(`Checking if @${xHandle} follows @${targetHandle}`);

  // Check follow relationship via Twitter API
  const [followErr, relationship] = await tryAsync(
    ctx.twitterClient.users.checkFollowRelationship({
      sourceUserName: xHandle,
      targetUserName: targetHandle,
    }),
  );
  if (followErr !== undefined) {
    throw new Error(
      `Failed to check follow relationship for @${xHandle}: ${followErr.message}`,
    );
  }

  const now = new Date();

  // Check if prospect follows the target account
  if (relationship.following) {
    log.info(`@${xHandle} follows @${targetHandle} - marking as CONVERTED`);

    // Update prospect status and insert conversion log in a transaction
    const [txErr] = await tryAsync(
      ctx.db.transaction(async (tx) => {
        // Update prospect to CONVERTED
        await tx
          .update(prospectsSchema)
          .set({
            claimStatus: "CONVERTED",
            lastConversionCheckAt: now,
            updatedAt: now,
          })
          .where(eq(prospectsSchema.id, prospect_id));

        // Insert conversion log
        await tx.insert(conversionLogsSchema).values({
          prospectId: prospect_id,
          apostleId: prospect.claimedByApostleId,
          eventType: "CONVERTED",
          source: "AUTO_FOLLOW_CHECK",
          details: {
            followedBy: relationship.followed_by,
            canDm: relationship.can_dm,
          },
        });
      }),
    );

    if (txErr !== undefined) {
      throw new Error(`Transaction failed: ${txErr.message}`);
    }

    log.info(
      `Successfully marked prospect ${prospect_id} (@${xHandle}) as CONVERTED`,
    );
  } else {
    log.info(`@${xHandle} does not follow @${targetHandle} yet`);

    // Just update the last check timestamp
    const [updateErr] = await tryAsync(
      ctx.db
        .update(prospectsSchema)
        .set({
          lastConversionCheckAt: now,
          updatedAt: now,
        })
        .where(eq(prospectsSchema.id, prospect_id)),
    );
    if (updateErr !== undefined) {
      throw new Error(
        `Failed to update last_conversion_check_at: ${updateErr.message}`,
      );
    }

    log.info(`Updated last_conversion_check_at for prospect ${prospect_id}`);
  }
}
