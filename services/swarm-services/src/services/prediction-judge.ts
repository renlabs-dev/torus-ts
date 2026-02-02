import { AsyncLocalStorage } from "node:async_hooks";
import { BasicLogger } from "@torus-network/torus-utils/logger";
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
import { getDomainTier, normalizeUrl, scrapePage } from "./firecrawl.js";

const logger = BasicLogger.create({ name: "prediction-judge" });

const workerContext = new AsyncLocalStorage<{ workerId: number }>();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  openrouterApiKey: string;
  firecrawlApiKey: string;
  sourceValidationPrompt: string;
}

export class PredictionJudge {
  private readonly config: Required<PredictionJudgeConfig>;
  private db: DB;

  constructor(config: PredictionJudgeConfig, db: DB) {
    this.config = {
      concurrency: config.concurrency ?? 3,
      openrouterApiKey: config.openrouterApiKey,
      firecrawlApiKey: config.firecrawlApiKey,
      sourceValidationPrompt: config.sourceValidationPrompt,
    };
    this.db = db;
  }

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
          notExists(
            tx
              .select()
              .from(verdictSchema)
              .where(
                eq(verdictSchema.parsedPredictionId, parsedPredictionSchema.id),
              ),
          ),
          sql`EXISTS (
            SELECT 1 FROM verification_claim c
            WHERE c.parsed_prediction_id = ${parsedPredictionSchema.id}
              AND c.created_at < NOW() - INTERVAL '1 hour'
              AND (
                NOT EXISTS (
                  SELECT 1 FROM claim_validation_feedback f
                  WHERE f.claim_id = c.id
                )
                OR EXISTS (
                  SELECT 1 FROM claim_validation_feedback f
                  WHERE f.claim_id = c.id AND f.deleted_at IS NOT NULL
                )
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

    const tweetMap = new Map<string, string>();
    for (const tweet of conversationTweets) {
      tweetMap.set(String(tweet.id), tweet.text);
    }

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
        content: source.content.substring(0, 8000),
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

  private rankClaimByDomains(claim: {
    id: string;
    verifierAgentId: string;
    claimOutcome: boolean;
    confidence: string;
    sources: ClaimSource[] | null;
    createdAt: Date;
  }): ClaimEvaluation {
    const sources = claim.sources ?? [];
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

    let bestTier = -1;
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

    const seenUrls = new Set<string>();
    const rankedSources: {
      url: string;
      tier: number;
      normalizedUrl: string;
    }[] = [];

    for (const source of sources) {
      const tier = getDomainTier(source.url);
      if (tier < 0) continue;

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

    rankedSources.sort((a, b) => b.tier - a.tier);

    if (rankedSources.length === 0) {
      return "no_sources";
    }

    let validatedAtLeastOne = false;

    for (const source of rankedSources) {
      logInfo("Fetching source", { url: source.url, tier: source.tier });

      const outcome = await scrapePage(
        this.db,
        source.url,
        this.config.firecrawlApiKey,
      );

      if (!outcome.ok || !outcome.result.content) {
        logInfo("Source fetch failed, trying next", { url: source.url });
        continue;
      }

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

        const MIN_RELEVANCE_SCORE = 0.3;
        if (
          validation.corroborates &&
          validation.relevance_score >= MIN_RELEVANCE_SCORE
        ) {
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
          logInfo("Source corroborates but relevance too low, skipping", {
            url: source.url,
            relevanceScore: validation.relevance_score,
          });
          validatedAtLeastOne = true;
          continue;
        }

        validatedAtLeastOne = true;
        if (source.tier >= 1) {
          logInfo("Trusted source contradicts claim, rejecting entire claim", {
            url: source.url,
            tier: source.tier,
            claimId: claim.id,
          });
          return "rejected";
        }

        logInfo("Unknown domain doesn't corroborate, trying next", {
          url: source.url,
        });
      } catch (e) {
        logError("Source validation failed", {
          url: source.url,
          error: String(e),
        });
      }
    }

    if (validatedAtLeastOne) {
      return "no_corroboration";
    } else {
      return "fetch_failed";
    }
  }

  private sortClaimsByDomainQuality(
    evaluations: ClaimEvaluation[],
    registeredVerifiers: Set<string>,
  ): ClaimEvaluation[] {
    return [...evaluations].sort((a, b) => {
      if (a.bestTier !== b.bestTier) {
        return b.bestTier - a.bestTier;
      }

      if (a.tier3Count !== b.tier3Count) {
        return b.tier3Count - a.tier3Count;
      }

      const aRegistered = registeredVerifiers.has(a.verifierAgentId);
      const bRegistered = registeredVerifiers.has(b.verifierAgentId);
      if (aRegistered !== bRegistered) {
        return aRegistered ? -1 : 1;
      }

      if (a.tier2Count !== b.tier2Count) {
        return b.tier2Count - a.tier2Count;
      }

      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence;
      }

      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

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

    const rankedClaims = claims.map((claim) => ({
      claim,
      evaluation: this.rankClaimByDomains(claim),
    }));

    const sortedClaims = this.sortClaimsByDomainQuality(
      rankedClaims.map((r) => r.evaluation),
      registeredVerifiers,
    );

    const claimMap = new Map(claims.map((c) => [c.id, c]));

    logInfo("Claims ranked by domain quality", {
      order: sortedClaims.map((e) => ({
        id: e.claimId,
        bestTier: e.bestTier,
        tier3: e.tier3Count,
      })),
    });

    for (const evaluation of sortedClaims) {
      const claim = claimMap.get(evaluation.claimId);
      if (!claim) continue;

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
          deletedAt: null,
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
