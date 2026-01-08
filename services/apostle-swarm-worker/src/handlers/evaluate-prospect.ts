import { BasicLogger } from "@torus-network/torus-utils/logger";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import type { qualityTagValues } from "@torus-ts/db/schema";
import {
  jobsQueueSchema,
  memoryStoreSchema,
  prospectsSchema,
} from "@torus-ts/db/schema";
import { eq } from "drizzle-orm";
import { assert } from "tsafe";
import type { ResonanceEvaluator, TweetData } from "../ai";
import type { ApostleSwarmDB } from "../db";
import { EvaluateProspectPayloadSchema } from "../types";

type QualityTag = keyof typeof qualityTagValues;

const log = BasicLogger.create({ name: "evaluate-prospect" });

export interface EvaluateProspectContext {
  db: ApostleSwarmDB;
  evaluator: ResonanceEvaluator;
  qualityThresholdHigh: number;
  qualityThresholdMid: number;
  qualityThresholdLow: number;
  evaluatorCooldownHours: number;
}

/**
 * Map resonance score (0-10) to a quality tag using configurable thresholds.
 */
function mapScoreToQualityTag(
  score: number,
  ctx: EvaluateProspectContext,
): QualityTag {
  if (score >= ctx.qualityThresholdHigh) {
    return "HIGH_POTENTIAL";
  }
  if (score >= ctx.qualityThresholdMid) {
    return "MID_POTENTIAL";
  }
  if (score >= ctx.qualityThresholdLow) {
    return "LOW_POTENTIAL";
  }
  return "BAD_PROSPECT";
}

/**
 * Check if the prospect is still in cooldown period.
 * Returns true if evaluation should be skipped.
 */
function isInCooldown(
  lastEvaluatedAt: Date | null,
  cooldownHours: number,
): boolean {
  if (lastEvaluatedAt === null) {
    return false;
  }

  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  const cooldownEnd = new Date(lastEvaluatedAt.getTime() + cooldownMs);
  return new Date() < cooldownEnd;
}

/**
 * Handles EVALUATE_PROSPECT jobs.
 *
 * Reads scraped Twitter data from memory_store, calls the resonance evaluator,
 * stores the evaluation profile, updates the prospect's resonance score and
 * quality tag, then enqueues a GENERATE_STRATEGY job.
 */
export async function handleEvaluateProspect(
  ctx: EvaluateProspectContext,
  payload: unknown,
): Promise<void> {
  // Validate payload
  const parseResult = EvaluateProspectPayloadSchema.safeParse(payload);
  if (!parseResult.success) {
    throw new Error(`Invalid payload: ${parseResult.error.message}`);
  }
  const { prospect_id } = parseResult.data;

  log.info(`Evaluating prospect ${prospect_id}`);

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

  // Fetch memory_store for this prospect
  const [memoryErr, memoryRecords] = await tryAsync(
    ctx.db
      .select()
      .from(memoryStoreSchema)
      .where(eq(memoryStoreSchema.prospectId, prospect_id))
      .limit(1),
  );
  if (memoryErr !== undefined) {
    throw new Error(`Failed to fetch memory_store: ${memoryErr.message}`);
  }

  const memory = memoryRecords[0];
  if (memory === undefined) {
    throw new Error(`Memory store not found for prospect ${prospect_id}`);
  }

  // Check if we have scraped data
  if (memory.xTweetsRaw === null) {
    throw new Error(
      `No tweets data in memory_store for prospect ${prospect_id}`,
    );
  }

  // Check cooldown
  if (isInCooldown(memory.lastEvaluatedAt, ctx.evaluatorCooldownHours)) {
    log.info(
      `Prospect ${prospect_id} is in cooldown (last evaluated: ${memory.lastEvaluatedAt?.toISOString()}), skipping`,
    );
    return;
  }

  // Parse tweets from JSONB
  const tweets = memory.xTweetsRaw as TweetData[];
  if (!Array.isArray(tweets) || tweets.length === 0) {
    throw new Error(`Invalid or empty tweets data for prospect ${prospect_id}`);
  }

  log.info(
    `Running resonance evaluation for @${prospect.xHandle} with ${tweets.length} tweets`,
  );

  // Call the resonance evaluator
  const [evalErr, evalResult] = await tryAsync(
    ctx.evaluator.evaluate(prospect.xHandle, memory.xBio, tweets),
  );
  if (evalErr !== undefined) {
    throw new Error(`Resonance evaluation failed: ${evalErr.message}`);
  }

  const { resonanceScore, evaluationProfile, evidenceTweets } = evalResult;

  log.info(`Evaluation complete: resonance score = ${resonanceScore}/10`);

  // Map score to quality tag
  const qualityTag = mapScoreToQualityTag(resonanceScore, ctx);
  log.info(`Quality tag mapped to: ${qualityTag}`);

  // Store results in a transaction
  const [txErr] = await tryAsync(
    ctx.db.transaction(async (tx) => {
      // Update prospect with resonance score and quality tag
      await tx
        .update(prospectsSchema)
        .set({
          resonanceScore: resonanceScore.toString(),
          qualityTag,
          updatedAt: new Date(),
        })
        .where(eq(prospectsSchema.id, prospect_id));

      // Update memory_store with evaluation profile
      await tx
        .update(memoryStoreSchema)
        .set({
          evaluationProfile: {
            ...evaluationProfile,
            evidenceTweets,
          },
          lastEvaluatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(memoryStoreSchema.prospectId, prospect_id));

      // Enqueue GENERATE_STRATEGY job
      const [insertedJob] = await tx
        .insert(jobsQueueSchema)
        .values({
          jobType: "GENERATE_STRATEGY",
          payload: { prospect_id },
          status: "PENDING",
          runAt: new Date(),
        })
        .returning({ id: jobsQueueSchema.id });

      assert(
        insertedJob !== undefined,
        "Failed to insert GENERATE_STRATEGY job - no row returned",
      );
      log.info(
        `Enqueued GENERATE_STRATEGY job ${insertedJob.id} for prospect ${prospect_id}`,
      );
    }),
  );

  if (txErr !== undefined) {
    throw new Error(`Transaction failed: ${txErr.message}`);
  }

  log.info(
    `Successfully evaluated prospect ${prospect_id} (@${prospect.xHandle})`,
  );
}
