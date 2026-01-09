import { BasicLogger } from "@torus-network/torus-utils/logger";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { memoryStoreSchema, prospectsSchema } from "@torus-ts/db/schema";
import { eq } from "drizzle-orm";
import type { ApproachStrategist, EvaluationProfile } from "../ai";
import type { ApostleSwarmDB } from "../db";
import { GenerateStrategyPayloadSchema } from "../types";

const log = BasicLogger.create({ name: "generate-strategy" });

export interface GenerateStrategyContext {
  db: ApostleSwarmDB;
  strategist: ApproachStrategist;
}

/**
 * Handles GENERATE_STRATEGY jobs.
 *
 * Reads the evaluation profile from memory_store, calls the approach strategist
 * to generate a personalized outreach strategy, and stores it in memory_store.
 */
export async function handleGenerateStrategy(
  ctx: GenerateStrategyContext,
  payload: unknown,
): Promise<void> {
  // Validate payload
  const parseResult = GenerateStrategyPayloadSchema.safeParse(payload);
  if (!parseResult.success) {
    throw new Error(`Invalid payload: ${parseResult.error.message}`);
  }
  const { prospect_id } = parseResult.data;

  log.info(`Generating strategy for prospect ${prospect_id}`);

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

  // Check if we have an evaluation profile
  if (memory.evaluationProfile === null) {
    throw new Error(
      `No evaluation profile in memory_store for prospect ${prospect_id}`,
    );
  }

  // Parse evaluation profile from JSONB
  const evaluationProfile = memory.evaluationProfile as EvaluationProfile;

  log.info(`Generating approach strategy for @${prospect.xHandle}`);

  // Call the approach strategist
  const [strategyErr, strategy] = await tryAsync(
    ctx.strategist.generateStrategy(prospect.xHandle, evaluationProfile),
  );
  if (strategyErr !== undefined) {
    throw new Error(`Strategy generation failed: ${strategyErr.message}`);
  }

  log.info(
    `Strategy generated: angle = "${strategy.recommendedAngle.slice(0, 50)}..."`,
  );

  // Update memory_store with the strategy
  const [updateErr] = await tryAsync(
    ctx.db
      .update(memoryStoreSchema)
      .set({
        approachStrategy: strategy,
        lastStrategyAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(memoryStoreSchema.prospectId, prospect_id)),
  );
  if (updateErr !== undefined) {
    throw new Error(`Failed to update memory_store: ${updateErr.message}`);
  }

  log.info(
    `Successfully generated strategy for prospect ${prospect_id} (@${prospect.xHandle})`,
  );
}
