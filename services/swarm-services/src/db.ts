import type { SS58Address } from "@torus-network/sdk/types";
import { and, eq, gte, isNull, sql } from "@torus-ts/db";
import { createDb } from "@torus-ts/db/client";
import {
  parsedPredictionSchema,
  predictionDuplicateRelationsSchema,
  rewardDistributionsSchema,
  scrapedTweetSchema,
  verdictSchema,
  verificationClaimSchema,
  verifierFeedbackSchema,
  verifierTopicRegistrationSchema,
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
 * FALSE POSITIVES: Predictions with feedback from trusted verifier where failure_cause != 'FUTURE_TIMEFRAME'
 * EXCLUDED: Unverified predictions and FUTURE_TIMEFRAME predictions
 *
 * @param periodStart - Start of evaluation period
 * @param trustedVerifierAgentId - SS58 address of the trusted verifier whose feedback determines false positives
 */
export async function queryAgentPrecisionMetrics(
  periodStart: Date,
  trustedVerifierAgentId: string,
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
        sql<number>`COUNT(*) FILTER (WHERE ${verifierFeedbackSchema.parsedPredictionId} IS NOT NULL AND ${verifierFeedbackSchema.failureCause} != 'FUTURE_TIMEFRAME' AND ${verifierFeedbackSchema.deletedAt} IS NULL)`.as(
          "false_positives",
        ),
      precision: sql<number>`
        CASE
          WHEN (
            COUNT(*) FILTER (WHERE ${verdictSchema.parsedPredictionId} IS NOT NULL) +
            COUNT(*) FILTER (WHERE ${verifierFeedbackSchema.parsedPredictionId} IS NOT NULL AND ${verifierFeedbackSchema.failureCause} != 'FUTURE_TIMEFRAME' AND ${verifierFeedbackSchema.deletedAt} IS NULL)
          ) > 0 THEN
            COUNT(*) FILTER (WHERE ${verdictSchema.parsedPredictionId} IS NOT NULL)::float /
            (
              COUNT(*) FILTER (WHERE ${verdictSchema.parsedPredictionId} IS NOT NULL) +
              COUNT(*) FILTER (WHERE ${verifierFeedbackSchema.parsedPredictionId} IS NOT NULL AND ${verifierFeedbackSchema.failureCause} != 'FUTURE_TIMEFRAME' AND ${verifierFeedbackSchema.deletedAt} IS NULL)
            )::float
          ELSE 0
        END
      `.as("precision"),
    })
    .from(parsedPredictionSchema)
    .leftJoin(
      verifierFeedbackSchema,
      and(
        eq(
          verifierFeedbackSchema.parsedPredictionId,
          parsedPredictionSchema.id,
        ),
        eq(verifierFeedbackSchema.verifierAgentId, trustedVerifierAgentId),
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

export interface ClaimSubmission {
  claimId: string;
  verifierAgentId: string;
  parsedPredictionId: string;
  topicId: string | null;
  confidence: string;
  submissionDate: Date;
  isAccepted: boolean;
  isTopicRegistered: boolean;
}

export interface VerifierPrecisionMetrics {
  verifierAgentId: string;
  totalClaims: number;
  acceptedClaims: number;
  rejectedClaims: number;
  pendingClaims: number;
  precision: number;
}

/**
 * Query all claim submissions in a period with their metadata.
 * Only includes claims where the prediction has a verdict (resolved).
 */
export async function queryClaimSubmissionsInPeriod(
  periodStart: Date,
): Promise<ClaimSubmission[]> {
  const submissions = await db
    .select({
      claimId: verificationClaimSchema.id,
      verifierAgentId: verificationClaimSchema.verifierAgentId,
      parsedPredictionId: verificationClaimSchema.parsedPredictionId,
      topicId: parsedPredictionSchema.topicId,
      confidence: verificationClaimSchema.confidence,
      submissionDate: verificationClaimSchema.createdAt,
      isAccepted: sql<boolean>`${verdictSchema.acceptedClaimId} = ${verificationClaimSchema.id}`,
      isTopicRegistered: sql<boolean>`${verifierTopicRegistrationSchema.id} IS NOT NULL`,
    })
    .from(verificationClaimSchema)
    .innerJoin(
      parsedPredictionSchema,
      eq(parsedPredictionSchema.id, verificationClaimSchema.parsedPredictionId),
    )
    .innerJoin(
      verdictSchema,
      eq(verdictSchema.parsedPredictionId, parsedPredictionSchema.id),
    )
    .leftJoin(
      verifierTopicRegistrationSchema,
      and(
        eq(
          verifierTopicRegistrationSchema.verifierAgentId,
          verificationClaimSchema.verifierAgentId,
        ),
        eq(
          verifierTopicRegistrationSchema.topicId,
          parsedPredictionSchema.topicId,
        ),
      ),
    )
    .where(
      and(
        gte(verificationClaimSchema.createdAt, periodStart),
        isNull(verificationClaimSchema.deletedAt),
      ),
    )
    .execute();

  return submissions.map((s) => ({
    claimId: s.claimId,
    verifierAgentId: s.verifierAgentId,
    parsedPredictionId: s.parsedPredictionId,
    topicId: s.topicId,
    confidence: s.confidence,
    submissionDate: s.submissionDate,
    isAccepted: s.isAccepted,
    isTopicRegistered: s.isTopicRegistered,
  }));
}

/**
 * Query verifier precision metrics aggregated in SQL.
 *
 * ACCEPTED: Claims where verdict.accepted_claim_id = claim.id
 * REJECTED: Claims where verdict exists but accepted_claim_id != claim.id
 * PENDING: Claims where no verdict exists yet (excluded from precision)
 */
export async function queryVerifierPrecisionMetrics(
  periodStart: Date,
): Promise<VerifierPrecisionMetrics[]> {
  const metrics = await db
    .select({
      verifierAgentId: verificationClaimSchema.verifierAgentId,
      totalClaims: sql<number>`COUNT(*)`.as("total_claims"),
      acceptedClaims:
        sql<number>`COUNT(*) FILTER (WHERE ${verdictSchema.acceptedClaimId} = ${verificationClaimSchema.id})`.as(
          "accepted_claims",
        ),
      rejectedClaims:
        sql<number>`COUNT(*) FILTER (WHERE ${verdictSchema.id} IS NOT NULL AND ${verdictSchema.acceptedClaimId} != ${verificationClaimSchema.id})`.as(
          "rejected_claims",
        ),
      pendingClaims:
        sql<number>`COUNT(*) FILTER (WHERE ${verdictSchema.id} IS NULL)`.as(
          "pending_claims",
        ),
      precision: sql<number>`
        CASE
          WHEN (
            COUNT(*) FILTER (WHERE ${verdictSchema.acceptedClaimId} = ${verificationClaimSchema.id}) +
            COUNT(*) FILTER (WHERE ${verdictSchema.id} IS NOT NULL AND ${verdictSchema.acceptedClaimId} != ${verificationClaimSchema.id})
          ) > 0 THEN
            COUNT(*) FILTER (WHERE ${verdictSchema.acceptedClaimId} = ${verificationClaimSchema.id})::float /
            (
              COUNT(*) FILTER (WHERE ${verdictSchema.acceptedClaimId} = ${verificationClaimSchema.id}) +
              COUNT(*) FILTER (WHERE ${verdictSchema.id} IS NOT NULL AND ${verdictSchema.acceptedClaimId} != ${verificationClaimSchema.id})
            )::float
          ELSE 0
        END
      `.as("precision"),
    })
    .from(verificationClaimSchema)
    .innerJoin(
      parsedPredictionSchema,
      eq(parsedPredictionSchema.id, verificationClaimSchema.parsedPredictionId),
    )
    .leftJoin(
      verdictSchema,
      eq(verdictSchema.parsedPredictionId, parsedPredictionSchema.id),
    )
    .where(
      and(
        gte(verificationClaimSchema.createdAt, periodStart),
        isNull(verificationClaimSchema.deletedAt),
      ),
    )
    .groupBy(verificationClaimSchema.verifierAgentId)
    .execute();

  return metrics.map((m) => ({
    verifierAgentId: m.verifierAgentId,
    totalClaims: m.totalClaims,
    acceptedClaims: m.acceptedClaims,
    rejectedClaims: m.rejectedClaims,
    pendingClaims: m.pendingClaims,
    precision: m.precision,
  }));
}
