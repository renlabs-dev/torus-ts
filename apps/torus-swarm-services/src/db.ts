import type { SS58Address } from "@torus-network/sdk/types";
import { and, eq, gte, isNull, sql } from "@torus-ts/db";
import { createDb } from "@torus-ts/db/client";
import {
  parsedPredictionFeedbackSchema,
  parsedPredictionSchema,
  predictionDuplicateRelationsSchema,
  rewardDistributionsSchema,
  scrapedTweetSchema,
  verdictSchema,
} from "@torus-ts/db/schema";

export const db = createDb();

export interface PredictionSubmission {
  parsedPredictionId: string;
  filterAgentId: string;
  predictionQuality: number;
  tweetDate: Date;
  submissionDate: Date;
  hasVerdict: boolean;
  canonicalId: string | null;
}

export interface AgentPrecisionMetrics {
  filterAgentId: string;
  totalSubmissions: number;
  truePositives: number;
  falsePositives: number;
  precision: number;
}

/**
 * Query all prediction submissions in a period with their metadata
 * Only includes predictions with verdicts (true positives)
 */
export async function queryPredictionSubmissionsInPeriod(
  periodStart: Date,
): Promise<PredictionSubmission[]> {
  const submissions = await db
    .select({
      parsedPredictionId: parsedPredictionSchema.id,
      filterAgentId: parsedPredictionSchema.filterAgentId,
      predictionQuality: parsedPredictionSchema.predictionQuality,
      submissionDate: parsedPredictionSchema.createdAt,
      tweetDate: scrapedTweetSchema.date,
      hasVerdict: sql<boolean>`${verdictSchema.parsedPredictionId} IS NOT NULL`,
      canonicalId: predictionDuplicateRelationsSchema.canonicalId,
    })
    .from(parsedPredictionSchema)
    .innerJoin(
      scrapedTweetSchema,
      sql`${scrapedTweetSchema.id}::text = (${parsedPredictionSchema.target}->0->'source'->>'tweet_id')`,
    )
    .leftJoin(
      verdictSchema,
      eq(verdictSchema.parsedPredictionId, parsedPredictionSchema.id),
    )
    .leftJoin(
      predictionDuplicateRelationsSchema,
      eq(
        predictionDuplicateRelationsSchema.predictionId,
        parsedPredictionSchema.id,
      ),
    )
    .where(
      and(
        gte(parsedPredictionSchema.createdAt, periodStart),
        isNull(parsedPredictionSchema.deletedAt),
        // Only include predictions with verdicts
        sql`${verdictSchema.parsedPredictionId} IS NOT NULL`,
      ),
    )
    .execute();

  return submissions.map((s) => ({
    parsedPredictionId: s.parsedPredictionId,
    filterAgentId: s.filterAgentId ?? "",
    predictionQuality: s.predictionQuality,
    tweetDate: s.tweetDate,
    submissionDate: s.submissionDate,
    hasVerdict: s.hasVerdict,
    canonicalId: s.canonicalId,
  }));
}

/**
 * Query agent precision metrics aggregated in SQL
 *
 * TRUE POSITIVES: Predictions with a verdict (regardless of outcome)
 * FALSE POSITIVES: Predictions with feedback where failure_cause != 'FUTURE_TIMEFRAME'
 * EXCLUDED: Unverified predictions and FUTURE_TIMEFRAME predictions
 */
export async function queryAgentPrecisionMetrics(
  periodStart: Date,
): Promise<AgentPrecisionMetrics[]> {
  const metrics = await db
    .select({
      filterAgentId: parsedPredictionSchema.filterAgentId,
      totalSubmissions: sql<number>`COUNT(*)`.as("total_submissions"),
      truePositives:
        sql<number>`COUNT(*) FILTER (WHERE ${verdictSchema.parsedPredictionId} IS NOT NULL)`.as(
          "true_positives",
        ),
      falsePositives:
        sql<number>`COUNT(*) FILTER (WHERE ${parsedPredictionFeedbackSchema.parsedPredictionId} IS NOT NULL AND ${parsedPredictionFeedbackSchema.failureCause} != 'FUTURE_TIMEFRAME')`.as(
          "false_positives",
        ),
      precision: sql<number>`
        CASE
          WHEN (
            COUNT(*) FILTER (WHERE ${verdictSchema.parsedPredictionId} IS NOT NULL) +
            COUNT(*) FILTER (WHERE ${parsedPredictionFeedbackSchema.parsedPredictionId} IS NOT NULL AND ${parsedPredictionFeedbackSchema.failureCause} != 'FUTURE_TIMEFRAME')
          ) > 0 THEN
            COUNT(*) FILTER (WHERE ${verdictSchema.parsedPredictionId} IS NOT NULL)::float /
            (
              COUNT(*) FILTER (WHERE ${verdictSchema.parsedPredictionId} IS NOT NULL) +
              COUNT(*) FILTER (WHERE ${parsedPredictionFeedbackSchema.parsedPredictionId} IS NOT NULL AND ${parsedPredictionFeedbackSchema.failureCause} != 'FUTURE_TIMEFRAME')
            )::float
          ELSE 0
        END
      `.as("precision"),
    })
    .from(parsedPredictionSchema)
    .leftJoin(
      parsedPredictionFeedbackSchema,
      eq(
        parsedPredictionFeedbackSchema.parsedPredictionId,
        parsedPredictionSchema.id,
      ),
    )
    .leftJoin(
      verdictSchema,
      eq(verdictSchema.parsedPredictionId, parsedPredictionSchema.id),
    )
    .where(
      and(
        gte(parsedPredictionSchema.createdAt, periodStart),
        isNull(parsedPredictionSchema.deletedAt),
      ),
    )
    .groupBy(parsedPredictionSchema.filterAgentId)
    .execute();

  return metrics.map((m) => ({
    filterAgentId: m.filterAgentId ?? "",
    totalSubmissions: m.totalSubmissions,
    truePositives: m.truePositives,
    falsePositives: m.falsePositives,
    precision: m.precision,
  }));
}

/**
 * Get the last distribution time for a specific permission
 */
export async function getLastDistributionTimeForPermission(
  permissionId: string,
): Promise<Date | null> {
  const result = await db
    .select({ distributionTime: rewardDistributionsSchema.distributionTime })
    .from(rewardDistributionsSchema)
    .where(eq(rewardDistributionsSchema.permissionId, permissionId))
    .orderBy(sql`${rewardDistributionsSchema.distributionTime} DESC`)
    .limit(1)
    .execute();

  return result[0]?.distributionTime ?? null;
}

/**
 * Insert a reward distribution record
 */
export async function insertRewardDistribution(
  scores: Map<SS58Address, number>,
  permissionId: string | null,
): Promise<void> {
  const scoresObject: Record<string, number> = {};
  for (const [address, weight] of scores) {
    scoresObject[address] = weight;
  }

  await db
    .insert(rewardDistributionsSchema)
    .values({
      distributionTime: new Date(),
      permissionId,
      scores: scoresObject,
    })
    .execute();
}
