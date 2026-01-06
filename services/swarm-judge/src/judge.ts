import { AsyncLocalStorage } from "node:async_hooks";
import type { DB, Transaction } from "@torus-ts/db/client";
import {
  claimValidationFeedbackSchema,
  parsedPredictionSchema,
  scrapedTweetSchema,
  verdictSchema,
  verificationClaimSchema,
  verifierTopicRegistrationSchema,
} from "@torus-ts/db/schema";
import type {
  ClaimSource,
  ClaimValidationResult,
  PostSlice,
  VerdictContext,
} from "@torus-ts/db/schema";
import { and, asc, eq, isNull, notExists, sql } from "drizzle-orm";
import { getDomainTier, normalizeUrl, scrapePage } from "./firecrawl";
import { logger } from "./logger";
import { sleep } from "./utils";

const workerContext = new AsyncLocalStorage<{ workerId: number }>();

function logInfo(message: string, fields?: Record<string, unknown>): void {
  const context = workerContext.getStore();
  const prefix = context ? `[Worker ${context.workerId}]` : "";

  let formatted = message;
  if (fields) {
    const fieldStr = Object.entries(fields)
      .map(([key, value]) => `${key}=${String(value)}`)
      .join(" ");
    formatted = `${message} ${fieldStr}`;
  }

  logger.info(prefix ? `${prefix} ${formatted}` : formatted);
}

function logError(message: string, fields?: Record<string, unknown>): void {
  const context = workerContext.getStore();
  const prefix = context ? `[Worker ${context.workerId}]` : "";

  let formatted = message;
  if (fields) {
    const fieldStr = Object.entries(fields)
      .map(([key, value]) => `${key}=${String(value)}`)
      .join(" ");
    formatted = `${message} ${fieldStr}`;
  }

  logger.error(prefix ? `${prefix} ${formatted}` : formatted);
}

interface SourceValidationResult {
  corroborates: boolean;
  relevance_score: number;
  extracted_evidence: string;
  reasoning: string;
}

const SOURCE_VALIDATION_SCHEMA = {
  type: "object",
  properties: {
    corroborates: {
      type: "boolean",
      description: "Whether the source supports the claim's outcome",
    },
    relevance_score: {
      type: "number",
      minimum: 0,
      maximum: 1,
      description: "How strongly the evidence supports the claim (0-1)",
    },
    extracted_evidence: {
      type: "string",
      description: "The most relevant quote or summary from the source",
    },
    reasoning: {
      type: "string",
      description:
        "Explanation of why the source does or doesn't support the claim",
    },
  },
  required: [
    "corroborates",
    "relevance_score",
    "extracted_evidence",
    "reasoning",
  ],
  additionalProperties: false,
} as const;

interface ClaimEvaluation {
  claimId: string;
  verifierAgentId: string;
  outcome: boolean;
  confidence: number;
  tier3Count: number;
  tier2Count: number;
  tier1Count: number;
  bestTier: number;
  createdAt: Date;
}

interface ValidatedClaim {
  claimId: string;
  verifierAgentId: string;
  outcome: boolean;
  confidence: number;
  createdAt: Date;
  corroboratingSource: string;
  sourceTier: number;
  relevanceScore: number;
  reasoning: string;
}

export interface PredictionJudgeConfig {
  concurrency?: number;
  debugMode?: boolean;
  openrouterApiKey: string;
  sourceValidationPrompt: string;
}

export class PredictionJudge {
  private readonly config: Required<PredictionJudgeConfig>;
  private db: DB;

  constructor(config: PredictionJudgeConfig, db: DB) {
    this.config = {
      concurrency: config.concurrency ?? 3,
      debugMode: config.debugMode ?? false,
      openrouterApiKey: config.openrouterApiKey,
      sourceValidationPrompt: config.sourceValidationPrompt,
    };
    this.db = db;
  }

  /**
   * Fetches the next prediction with mature claims (oldest claim >= 1 hour old)
   * that has no verdict yet.
   */
  async getNextPredictionWithClaims(tx: Transaction): Promise<
    | {
        prediction: {
          id: string;
          predictionId: string;
          target: PostSlice[];
          timeframe: PostSlice[];
          topicId: string | null;
          sourceTweetId: bigint;
          conversationId: bigint | null;
        };
        claims: {
          id: string;
          verifierAgentId: string;
          claimOutcome: boolean;
          confidence: string;
          reasoning: string;
          sources: ClaimSource[] | null;
          createdAt: Date;
        }[];
        predictionContext: {
          targetText: string;
          timeframeText: string;
        };
      }
    | undefined
  > {
    // Find predictions that:
    // 1. Have no verdict
    // 2. Have at least one mature claim (≥1hr) that is eligible for evaluation
    //
    // A claim is eligible if:
    // - No feedback row exists, OR
    // - Feedback is soft-deleted (deletedAt IS NOT NULL), OR
    // - Feedback has result='fetch_failed' AND updatedAt < 1 hour ago
    const predictions = await tx
      .select({
        id: parsedPredictionSchema.id,
        predictionId: parsedPredictionSchema.predictionId,
        sourceTweetId: scrapedTweetSchema.id,
        conversationId: scrapedTweetSchema.conversationId,
        target: parsedPredictionSchema.target,
        timeframe: parsedPredictionSchema.timeframe,
        topicId: parsedPredictionSchema.topicId,
        tweetText: scrapedTweetSchema.text,
      })
      .from(parsedPredictionSchema)
      .innerJoin(
        scrapedTweetSchema,
        eq(
          scrapedTweetSchema.predictionId,
          parsedPredictionSchema.predictionId,
        ),
      )
      .where(
        and(
          // No verdict exists
          notExists(
            tx
              .select()
              .from(verdictSchema)
              .where(
                eq(verdictSchema.parsedPredictionId, parsedPredictionSchema.id),
              ),
          ),
          // Has at least one eligible mature claim
          sql`EXISTS (
            SELECT 1 FROM verification_claim c
            WHERE c.parsed_prediction_id = ${parsedPredictionSchema.id}
              AND c.created_at < NOW() - INTERVAL '1 hour'
              AND (
                -- No feedback exists
                NOT EXISTS (
                  SELECT 1 FROM claim_validation_feedback f
                  WHERE f.claim_id = c.id
                )
                -- OR feedback is soft-deleted
                OR EXISTS (
                  SELECT 1 FROM claim_validation_feedback f
                  WHERE f.claim_id = c.id AND f.deleted_at IS NOT NULL
                )
                -- OR feedback is fetch_failed and stale (>1hr)
                OR EXISTS (
                  SELECT 1 FROM claim_validation_feedback f
                  WHERE f.claim_id = c.id
                    AND f.deleted_at IS NULL
                    AND f.result = 'fetch_failed'
                    AND f.updated_at < NOW() - INTERVAL '1 hour'
                )
              )
          )`,
        ),
      )
      .orderBy(asc(parsedPredictionSchema.createdAt))
      .limit(1)
      .for("update", { skipLocked: true });

    const prediction = predictions[0];
    if (!prediction) {
      return undefined;
    }

    // Only fetch claims that are eligible for evaluation
    const claims = await tx
      .select({
        id: verificationClaimSchema.id,
        verifierAgentId: verificationClaimSchema.verifierAgentId,
        claimOutcome: verificationClaimSchema.claimOutcome,
        confidence: verificationClaimSchema.confidence,
        reasoning: verificationClaimSchema.reasoning,
        sources: verificationClaimSchema.sources,
        createdAt: verificationClaimSchema.createdAt,
      })
      .from(verificationClaimSchema)
      .where(
        and(
          eq(verificationClaimSchema.parsedPredictionId, prediction.id),
          // Claim is eligible if no active feedback or stale fetch_failed
          sql`(
            NOT EXISTS (
              SELECT 1 FROM claim_validation_feedback f
              WHERE f.claim_id = ${verificationClaimSchema.id}
            )
            OR EXISTS (
              SELECT 1 FROM claim_validation_feedback f
              WHERE f.claim_id = ${verificationClaimSchema.id}
                AND f.deleted_at IS NOT NULL
            )
            OR EXISTS (
              SELECT 1 FROM claim_validation_feedback f
              WHERE f.claim_id = ${verificationClaimSchema.id}
                AND f.deleted_at IS NULL
                AND f.result = 'fetch_failed'
                AND f.updated_at < NOW() - INTERVAL '1 hour'
            )
          )`,
        ),
      )
      .orderBy(asc(verificationClaimSchema.createdAt));

    // Fetch all tweets in the conversation thread for proper slice extraction
    // This handles predictions that span multiple tweets in a thread
    const conversationTweets = prediction.conversationId
      ? await tx
          .select({
            id: scrapedTweetSchema.id,
            text: scrapedTweetSchema.text,
          })
          .from(scrapedTweetSchema)
          .where(
            eq(scrapedTweetSchema.conversationId, prediction.conversationId),
          )
      : [{ id: prediction.sourceTweetId, text: prediction.tweetText }];

    // Build tweet map for slice extraction (keyed by string ID to match PostSlice.source.tweet_id)
    const tweetMap = new Map<string, string>();
    for (const tweet of conversationTweets) {
      tweetMap.set(String(tweet.id), tweet.text);
    }

    // Extract text from slices using the correct tweet for each slice
    const extractSliceText = (slices: PostSlice[]): string => {
      return slices
        .map((slice) => {
          const text = tweetMap.get(slice.source.tweet_id);
          if (!text) return "";
          return text.substring(slice.start, slice.end);
        })
        .join(" ");
    };

    return {
      prediction: {
        id: prediction.id,
        predictionId: prediction.predictionId,
        target: prediction.target,
        timeframe: prediction.timeframe,
        topicId: prediction.topicId,
        sourceTweetId: prediction.sourceTweetId,
        conversationId: prediction.conversationId,
      },
      claims,
      predictionContext: {
        targetText: extractSliceText(prediction.target),
        timeframeText: extractSliceText(prediction.timeframe),
      },
    };
  }

  /**
   * Validates a single source against a claim using LLM.
   */
  private async validateSourceContent(
    source: { url: string; content: string; title: string | null },
    claim: { outcome: boolean; reasoning: string },
    prediction: { target: string; timeframe: string },
  ): Promise<SourceValidationResult> {
    const inputData = {
      prediction: {
        target: prediction.target,
        timeframe: prediction.timeframe,
      },
      claim: {
        outcome: claim.outcome,
        reasoning: claim.reasoning,
      },
      source: {
        url: source.url,
        title: source.title,
        content: source.content.substring(0, 8000), // Limit content size
      },
    };

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.openrouterApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: this.config.sourceValidationPrompt,
            },
            {
              role: "user",
              content: `Validate this source against the claim:\n\n${JSON.stringify(inputData, null, 2)}`,
            },
          ],
          temperature: 0.1,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "source_validation",
              strict: true,
              schema: SOURCE_VALIDATION_SCHEMA,
            },
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const result = (await response.json()) as {
      choices: { message: { content: string } }[];
    };

    const jsonText = result.choices[0]?.message.content;
    if (!jsonText) {
      throw new Error("No response from OpenRouter API");
    }

    return JSON.parse(jsonText) as SourceValidationResult;
  }

  /**
   * Ranks a claim by its source domain quality without fetching.
   * Returns tier counts and best tier for sorting.
   * Tier 0 (unknown) domains are included but ranked lowest.
   */
  private rankClaimByDomains(claim: {
    id: string;
    verifierAgentId: string;
    claimOutcome: boolean;
    confidence: string;
    sources: ClaimSource[] | null;
    createdAt: Date;
  }): ClaimEvaluation {
    const sources = claim.sources ?? [];
    // Include tier 0 (unknown) but exclude tier -1 (social media, prediction markets)
    const validSources = sources.filter((s) => getDomainTier(s.url) >= 0);

    const tier3Count = validSources.filter(
      (s) => getDomainTier(s.url) === 3,
    ).length;
    const tier2Count = validSources.filter(
      (s) => getDomainTier(s.url) === 2,
    ).length;
    const tier1Count = validSources.filter(
      (s) => getDomainTier(s.url) === 1,
    ).length;
    const tier0Count = validSources.filter(
      (s) => getDomainTier(s.url) === 0,
    ).length;

    // Best tier is the highest tier present (0 = unknown, still valid)
    let bestTier = -1; // -1 means no valid sources at all
    if (tier3Count > 0) bestTier = 3;
    else if (tier2Count > 0) bestTier = 2;
    else if (tier1Count > 0) bestTier = 1;
    else if (tier0Count > 0) bestTier = 0;

    return {
      claimId: claim.id,
      verifierAgentId: claim.verifierAgentId,
      outcome: claim.claimOutcome,
      confidence: parseFloat(claim.confidence),
      tier3Count,
      tier2Count,
      tier1Count,
      bestTier,
      createdAt: claim.createdAt,
    };
  }

  /**
   * Validates a claim by fetching and checking sources lazily.
   * Fetches highest-tier sources first, stops on first corroboration.
   * If a trusted source (tier 1-3) contradicts, the entire claim is rejected (verifier bug).
   * Unknown domains (tier 0) are validated but given benefit of doubt on contradiction.
   *
   * Returns:
   * - ValidatedClaim: source corroborated the claim
   * - "rejected": trusted source contradicted (verifier bug)
   * - "no_sources": claim had no valid source URLs
   * - "fetch_failed": all sources failed to fetch (temporary, should retry later)
   * - "no_corroboration": sources fetched but none corroborated (permanent failure)
   */
  private async validateClaimSources(
    claim: {
      id: string;
      verifierAgentId: string;
      claimOutcome: boolean;
      confidence: string;
      reasoning: string;
      sources: ClaimSource[] | null;
      createdAt: Date;
    },
    prediction: { target: string; timeframe: string },
  ): Promise<
    | ValidatedClaim
    | "rejected"
    | "no_sources"
    | "fetch_failed"
    | "no_corroboration"
  > {
    const sources = claim.sources ?? [];

    // Filter and deduplicate sources, sort by tier (highest first)
    // Include tier 0 (unknown) but exclude tier -1 (social media, prediction markets)
    const seenUrls = new Set<string>();
    const rankedSources: {
      url: string;
      tier: number;
      normalizedUrl: string;
    }[] = [];

    for (const source of sources) {
      const tier = getDomainTier(source.url);
      if (tier < 0) continue; // Only skip excluded domains (tier -1)

      let normalizedUrl: string;
      try {
        normalizedUrl = normalizeUrl(source.url);
      } catch {
        continue;
      }

      if (seenUrls.has(normalizedUrl)) continue;
      seenUrls.add(normalizedUrl);

      rankedSources.push({ url: source.url, tier, normalizedUrl });
    }

    // Sort by tier descending (tier 3 first, tier 0 last)
    rankedSources.sort((a, b) => b.tier - a.tier);

    if (rankedSources.length === 0) {
      return "no_sources";
    }

    // Track whether we successfully validated at least one source
    let validatedAtLeastOne = false;

    // Process sources in tier order, fetch lazily
    for (const source of rankedSources) {
      logInfo("Fetching source", { url: source.url, tier: source.tier });

      // Fetch this single source
      const outcome = await scrapePage(this.db, source.url);

      if (!outcome.ok || !outcome.result.content) {
        logInfo("Source fetch failed, trying next", { url: source.url });
        continue;
      }

      // Validate with LLM
      try {
        const validation = await this.validateSourceContent(
          {
            url: source.url,
            content: outcome.result.content,
            title: outcome.result.title,
          },
          {
            outcome: claim.claimOutcome,
            reasoning: claim.reasoning,
          },
          prediction,
        );

        // Require minimum relevance score to accept corroboration
        const MIN_RELEVANCE_SCORE = 0.3;
        if (
          validation.corroborates &&
          validation.relevance_score >= MIN_RELEVANCE_SCORE
        ) {
          // Success! This claim is validated
          return {
            claimId: claim.id,
            verifierAgentId: claim.verifierAgentId,
            outcome: claim.claimOutcome,
            confidence: parseFloat(claim.confidence),
            createdAt: claim.createdAt,
            corroboratingSource: source.url,
            sourceTier: source.tier,
            relevanceScore: validation.relevance_score,
            reasoning: validation.reasoning,
          };
        }

        if (
          validation.corroborates &&
          validation.relevance_score < MIN_RELEVANCE_SCORE
        ) {
          // LLM said corroborates but relevance too low - not strong enough evidence
          // Count as validated (blocks claim permanently) since we did check it
          logInfo("Source corroborates but relevance too low, skipping", {
            url: source.url,
            relevanceScore: validation.relevance_score,
          });
          validatedAtLeastOne = true;
          continue;
        }

        // Source doesn't corroborate - this is a real validation
        validatedAtLeastOne = true;
        if (source.tier >= 1) {
          // Trusted source contradiction (tier 1, 2, or 3) = reject entire claim
          // A verifier shipping a claim with a contradicting curated source is a bug
          logInfo("Trusted source contradicts claim, rejecting entire claim", {
            url: source.url,
            tier: source.tier,
            claimId: claim.id,
          });
          return "rejected";
        }

        // Tier 0 (unknown domain) contradiction, try next source
        logInfo("Unknown domain doesn't corroborate, trying next", {
          url: source.url,
        });
      } catch (e) {
        logError("Source validation failed", {
          url: source.url,
          error: String(e),
        });
        // Continue to next source on error
      }
    }

    // Distinguish between fetch failures and actual validation failures
    if (validatedAtLeastOne) {
      return "no_corroboration"; // We checked sources, none corroborated
    } else {
      return "fetch_failed"; // All fetches failed, should retry later
    }
  }

  /**
   * Sorts claims by domain quality for processing order.
   * Higher tier sources = higher priority.
   */
  private sortClaimsByDomainQuality(
    evaluations: ClaimEvaluation[],
    registeredVerifiers: Set<string>,
  ): ClaimEvaluation[] {
    return [...evaluations].sort((a, b) => {
      // Best tier first (3 > 2 > 1 > 0)
      if (a.bestTier !== b.bestTier) {
        return b.bestTier - a.bestTier;
      }

      // More tier 3 sources first
      if (a.tier3Count !== b.tier3Count) {
        return b.tier3Count - a.tier3Count;
      }

      // Registered verifiers first
      const aRegistered = registeredVerifiers.has(a.verifierAgentId);
      const bRegistered = registeredVerifiers.has(b.verifierAgentId);
      if (aRegistered !== bRegistered) {
        return aRegistered ? -1 : 1;
      }

      // More tier 2 sources first
      if (a.tier2Count !== b.tier2Count) {
        return b.tier2Count - a.tier2Count;
      }

      // Higher confidence first
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence;
      }

      // Oldest claim first (deterministic fallback)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  /**
   * Processes a prediction by validating claim sources lazily.
   *
   * Strategy:
   * 1. Rank claims by domain quality (without fetching)
   * 2. Process claims in order, fetching sources lazily (highest tier first)
   * 3. If a trusted source (tier 1-3) contradicts → reject entire claim (verifier bug)
   * 4. First claim with a corroborating source wins
   * 5. Stop immediately on success (no need to check other claims)
   */
  private async processClaimBasedVerdict(
    tx: Transaction,
    data: NonNullable<
      Awaited<ReturnType<typeof this.getNextPredictionWithClaims>>
    >,
  ): Promise<boolean> {
    const { prediction, claims, predictionContext } = data;

    logInfo("Processing claim-based verdict", {
      predictionId: prediction.id,
      claimCount: claims.length,
    });

    // Get registered verifiers for the topic (needed for ranking)
    const registeredVerifiers = new Set<string>();
    if (prediction.topicId) {
      const registrations = await tx
        .select({
          verifierAgentId: verifierTopicRegistrationSchema.verifierAgentId,
        })
        .from(verifierTopicRegistrationSchema)
        .where(eq(verifierTopicRegistrationSchema.topicId, prediction.topicId));
      for (const reg of registrations) {
        registeredVerifiers.add(reg.verifierAgentId);
      }
    }

    // Rank claims by domain quality (no fetching yet)
    const rankedClaims = claims.map((claim) => ({
      claim,
      evaluation: this.rankClaimByDomains(claim),
    }));

    // Sort by domain quality
    const sortedClaims = this.sortClaimsByDomainQuality(
      rankedClaims.map((r) => r.evaluation),
      registeredVerifiers,
    );

    // Create a map for quick lookup
    const claimMap = new Map(claims.map((c) => [c.id, c]));

    logInfo("Claims ranked by domain quality", {
      order: sortedClaims.map((e) => ({
        id: e.claimId,
        bestTier: e.bestTier,
        tier3: e.tier3Count,
      })),
    });

    // Process claims in order, validate lazily
    for (const evaluation of sortedClaims) {
      const claim = claimMap.get(evaluation.claimId);
      if (!claim) continue;

      // Skip claims with no valid sources (bestTier === -1 means all sources excluded)
      if (evaluation.bestTier < 0) {
        logInfo("Skipping claim with no valid sources", { claimId: claim.id });
        await this.storeClaimFeedback(
          tx,
          claim.id,
          "no_sources",
          "Claim has no valid source URLs",
        );
        continue;
      }

      logInfo("Validating claim sources", {
        claimId: claim.id,
        bestTier: evaluation.bestTier,
        tier3Count: evaluation.tier3Count,
      });

      const result = await this.validateClaimSources(claim, {
        target: predictionContext.targetText,
        timeframe: predictionContext.timeframeText,
      });

      if (result === "rejected") {
        logInfo("Claim rejected (trusted source contradiction)", {
          claimId: claim.id,
        });
        await this.storeClaimFeedback(
          tx,
          claim.id,
          "rejected",
          "Trusted source contradicted the claim",
        );
        continue;
      }

      if (result === "no_sources") {
        logInfo("Claim has no valid source URLs", { claimId: claim.id });
        await this.storeClaimFeedback(
          tx,
          claim.id,
          "no_sources",
          "Claim has no valid source URLs",
        );
        continue;
      }

      if (result === "fetch_failed") {
        logInfo("All sources failed to fetch, trying next claim", {
          claimId: claim.id,
        });
        await this.storeClaimFeedback(
          tx,
          claim.id,
          "fetch_failed",
          "All sources failed to fetch",
        );
        continue;
      }

      if (result === "no_corroboration") {
        logInfo("Claim sources checked but none corroborated", {
          claimId: claim.id,
        });
        await this.storeClaimFeedback(
          tx,
          claim.id,
          "no_corroboration",
          "Sources fetched but none corroborated",
        );
        continue;
      }

      // Success! We have a validated claim
      // Soft-delete any existing feedback for this claim
      await tx
        .update(claimValidationFeedbackSchema)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(claimValidationFeedbackSchema.claimId, result.claimId),
            isNull(claimValidationFeedbackSchema.deletedAt),
          ),
        );

      const context: VerdictContext = {
        feedback: result.reasoning,
        sourceTier: result.sourceTier,
        corroboratingSource: result.corroboratingSource,
      };

      await tx.insert(verdictSchema).values({
        parsedPredictionId: prediction.id,
        verdict: result.outcome,
        context,
        acceptedClaimId: result.claimId,
      });

      logInfo("Verdict stored", {
        predictionId: prediction.id,
        verdict: result.outcome,
        acceptedClaimId: result.claimId,
        corroboratingSource: result.corroboratingSource,
        sourceTier: result.sourceTier,
        relevanceScore: result.relevanceScore,
      });

      return true;
    }

    logInfo("No claims could be validated this round", {
      predictionId: prediction.id,
      claimCount: claims.length,
    });

    return false;
  }

  /**
   * Stores or updates claim validation feedback.
   * Uses upsert to handle retries.
   */
  private async storeClaimFeedback(
    tx: Transaction,
    claimId: string,
    result: ClaimValidationResult,
    reason: string,
  ): Promise<void> {
    await tx
      .insert(claimValidationFeedbackSchema)
      .values({ claimId, result, reason })
      .onConflictDoUpdate({
        target: claimValidationFeedbackSchema.claimId,
        set: {
          result,
          reason,
          deletedAt: null, // Un-soft-delete if previously deleted
          updatedAt: new Date(),
        },
      });
  }

  private async runWorker(
    workerId: number,
    stopHook: () => boolean,
  ): Promise<void> {
    await workerContext.run({ workerId }, async () => {
      let consecutiveFailures = 0;
      const maxBackoff = 1000 * 60 * 30;

      logInfo("Worker started");

      while (!stopHook()) {
        try {
          const progress = await this.db.transaction(async (tx) => {
            const predictionWithClaims =
              await this.getNextPredictionWithClaims(tx);
            if (!predictionWithClaims) {
              return false;
            }
            return this.processClaimBasedVerdict(tx, predictionWithClaims);
          });

          consecutiveFailures = 0;

          if (!progress) {
            logInfo("No predictions to verify, waiting 1 minute");
            await sleep(1000 * 60);
          }
        } catch (e) {
          consecutiveFailures++;
          logError("Judge failed", { error: String(e) });

          const backoffTime = Math.min(
            1000 * 60 * Math.pow(2, consecutiveFailures - 1),
            maxBackoff,
          );
          logInfo("Backing off", {
            seconds: backoffTime / 1000,
            failureCount: consecutiveFailures,
          });
          await sleep(backoffTime);
        }
      }

      logInfo("Worker stopped");
    });
  }

  async runJudge(stopHook: () => boolean): Promise<void> {
    const workers = Array.from({ length: this.config.concurrency }, (_, i) =>
      this.runWorker(i + 1, stopHook),
    );
    await Promise.all(workers);
  }
}
