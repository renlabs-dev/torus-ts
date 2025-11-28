import type { SS58Address } from "@torus-network/sdk/types";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import type { PredictionSubmission } from "../db.js";
import {
  queryAgentPrecisionMetrics,
  queryPredictionSubmissionsInPeriod,
} from "../db.js";

const log = BasicLogger.create({ name: "contributor-scoring" });

/**
 * Calculate age bonus multiplier based on tweet age at submission time.
 * Spec: 1 + 0.05 × days (unbounded linear growth)
 */
function calculateAgeBonus(tweetDate: Date, submissionDate: Date): number {
  const ageMs = submissionDate.getTime() - tweetDate.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return 1.0 + 0.05 * ageDays;
}

/**
 * Group submissions by canonical ID and sort by submission date
 */
function groupByCanonical(
  submissions: PredictionSubmission[],
): Map<string, PredictionSubmission[]> {
  const groups = new Map<string, PredictionSubmission[]>();

  for (const sub of submissions) {
    const canonicalId = sub.canonicalId ?? sub.parsedPredictionId;
    const group = groups.get(canonicalId) ?? [];
    group.push(sub);
    groups.set(canonicalId, group);
  }

  for (const group of groups.values()) {
    group.sort(
      (a, b) => a.submissionDate.getTime() - b.submissionDate.getTime(),
    );
  }

  return groups;
}

/**
 * Calculate quality score for an agent considering age bonus and redundancy penalty.
 */
function calculateQualityScore(
  agentId: string,
  submissions: PredictionSubmission[],
  canonicalGroups: Map<string, PredictionSubmission[]>,
  redundancyThreshold: number,
): number {
  let modifierSum = 0;
  let count = 0;

  for (const sub of submissions) {
    if (sub.filterAgentId !== agentId) continue;
    if (!sub.hasVerdict) continue; // Only count true positives

    const canonicalId = sub.canonicalId ?? sub.parsedPredictionId;
    const group = canonicalGroups.get(canonicalId);
    if (!group) continue;

    let modifier = 1.0;

    // Age bonus: only first finder
    const isFirst = group[0]?.parsedPredictionId === sub.parsedPredictionId;
    if (isFirst) {
      modifier *= calculateAgeBonus(sub.tweetDate, sub.submissionDate);
    }

    // Redundancy penalty: exponential decay (1/3)^n for 4th+ submitter
    const rank =
      group.findIndex((s) => s.parsedPredictionId === sub.parsedPredictionId) +
      1;

    if (rank >= redundancyThreshold) {
      const excessRank = rank - redundancyThreshold + 1;
      modifier *= Math.pow(1 / 3, excessRank);
    }

    modifierSum += modifier;
    count++;
  }

  // Return average modifier (will be multiplied by precision later)
  return count > 0 ? modifierSum / count : 0;
}

const calculateFreeRiderPenalty = (zScore: number): number => {
  if (zScore < -3.0) return 0.2;
  if (zScore < -2.0) return 0.6;
  if (zScore < -1.0) return 0.8;
  return 1.0;
};

/**
 * Calculate contributor scores for a given evaluation period.
 * Returns a map of agent addresses to their basis point weights for distribution.
 *
 * @param periodStart - Start of evaluation period
 * @param minPrecision - Minimum precision threshold (default 0.70 = 70%)
 * @param redundancyThreshold - Rank at which penalty applies (default 4 = 4th+ submitter)
 * @returns Map of SS58Address to basis point weight (0-10000)
 */
export async function calculateContributorScores(
  periodStart: Date,
  minPrecision: number = 0.7,
  redundancyThreshold: number = 4,
): Promise<Map<SS58Address, number>> {
  const periodEnd = new Date();

  log.info("Starting contributor score calculation", {
    periodStart,
    periodEnd,
    minPrecision,
    redundancyThreshold,
  });

  // Query precision metrics
  const [precisionErr, precisionMetrics] = await tryAsync(
    queryAgentPrecisionMetrics(periodStart),
  );

  if (precisionErr) {
    log.error("Failed to query precision metrics", { error: precisionErr });
    throw precisionErr;
  }

  // Filter by precision threshold
  const qualifiedAgents = precisionMetrics.filter((m) => {
    if (m.precision < minPrecision) {
      log.info(
        `Agent ${m.filterAgentId} disqualified: precision ${m.precision.toFixed(2)} < ${minPrecision}`,
      );
      return false;
    }
    return true;
  });

  log.info(
    `${qualifiedAgents.length} agents qualified with precision >= ${minPrecision}`,
  );

  if (qualifiedAgents.length === 0) {
    log.info("No qualified agents, returning empty weights");
    return new Map();
  }

  // Query submissions for quality calculations
  const [submissionsErr, submissions] = await tryAsync(
    queryPredictionSubmissionsInPeriod(periodStart),
  );

  if (submissionsErr) {
    log.error("Failed to query submissions", { error: submissionsErr });
    throw submissionsErr;
  }

  log.info(`Found ${submissions.length} submissions in period`);

  const canonicalGroups = groupByCanonical(submissions);

  const firstFinderRatios = new Map<string, number>();
  for (const agent of qualifiedAgents) {
    const agentSubmissions = submissions.filter(
      (s) => s.filterAgentId === agent.filterAgentId && s.hasVerdict,
    );

    const firstCount = agentSubmissions.filter((s) => {
      const canonicalId = s.canonicalId ?? s.parsedPredictionId;
      const group = canonicalGroups.get(canonicalId);
      return group && group[0]?.parsedPredictionId === s.parsedPredictionId;
    }).length;

    const ratio =
      agentSubmissions.length > 0 ? firstCount / agentSubmissions.length : 0;
    firstFinderRatios.set(agent.filterAgentId, ratio);
  }

  const ratios = Array.from(firstFinderRatios.values());
  const meanRatio = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
  const variance =
    ratios.reduce((sum, r) => sum + Math.pow(r - meanRatio, 2), 0) /
    ratios.length;
  const stddevRatio = Math.sqrt(variance);

  const workScores = new Map<string, number>();

  for (const agent of qualifiedAgents) {
    const averageModifier = calculateQualityScore(
      agent.filterAgentId,
      submissions,
      canonicalGroups,
      redundancyThreshold,
    );

    const qualityScore = agent.precision * averageModifier;
    let workScore = qualityScore * agent.truePositives;

    const ratio = firstFinderRatios.get(agent.filterAgentId) ?? 0;
    const zScore = stddevRatio > 0 ? (ratio - meanRatio) / stddevRatio : 0;
    const freeRiderPenalty = calculateFreeRiderPenalty(zScore);

    workScore *= freeRiderPenalty;

    workScores.set(agent.filterAgentId, workScore);
  }

  // Normalize to basis points
  const totalWork = Array.from(workScores.values()).reduce(
    (sum, score) => sum + score,
    0,
  );

  const weights = new Map<SS58Address, number>();

  if (totalWork > 0) {
    for (const [agentId, workScore] of workScores) {
      const normalizedScore = workScore / totalWork;
      const basisPoints = Math.round(normalizedScore * 10000);
      weights.set(agentId as SS58Address, basisPoints);
    }
  }

  log.info("Score calculation complete", {
    qualifiedAgents: weights.size,
    totalWork,
  });

  return weights;
}
