import {
  and,
  desc,
  eq,
  gte,
  isNotNull,
  isNull,
  lte,
  notExists,
  or,
  sql,
} from "@torus-ts/db";
import {
  parsedPredictionDetailsSchema,
  parsedPredictionFeedbackSchema,
  parsedPredictionSchema,
  predictionDuplicateRelationsSchema,
  predictionSchema,
  scrapedTweetSchema,
  twitterUsersSchema,
  verdictSchema,
} from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../trpc";
import type { TRPCContext } from "../../trpc";

export interface PostSlice {
  source: { tweet_id: string };
  start: number;
  end: number;
}

export interface VerdictContext {
  feedback: string;
}

export interface VerdictSource {
  url: string;
  title?: string;
  content?: string;
}

export interface RawPrediction {
  predictionId: string;
  parsedId: string;
  target: PostSlice[];
  timeframe: PostSlice[];
  llmConfidence: string;
  vagueness: string | null;
  context: unknown;
  predictionQuality: number;
  briefRationale: string;
  topicId: string | null;
  filterAgentId: string | null;
  canonicalId: string | null;
  tweetId: bigint;
  tweetText: string;
  tweetDate: Date;
  conversationId: bigint | null;
  parentTweetId: bigint | null;
  userId: bigint;
  username: string | null;
  screenName: string | null;
  avatarUrl: string | null;
  isVerified: boolean | null;
  verdictId: string | null;
  verdict: boolean | null;
  verdictContext: VerdictContext | null;
  verdictCreatedAt: Date | null;
  verdictSources: VerdictSource[] | null;
  feedbackFailureCause: string | null;
  feedbackReason: string | null;
}

export interface ParentTweet {
  tweetId: bigint;
  tweetText: string;
  tweetDate: Date;
  authorId: bigint;
  username: string | null;
  screenName: string | null;
  avatarUrl: string | null;
}

export interface GroupedTweet {
  tweetId: bigint;
  tweetText: string;
  tweetDate: Date;
  conversationId: bigint | null;
  parentTweetId: bigint | null;
  userId: bigint;
  username: string | null;
  screenName: string | null;
  avatarUrl: string | null;
  isVerified: boolean | null;
  parentTweet: ParentTweet | null;
  rootTweet: ParentTweet | null;
  predictions: {
    parsedId: string;
    predictionId: string;
    target: PostSlice[];
    timeframe: PostSlice[];
    llmConfidence: string;
    vagueness: string | null;
    context: unknown;
    predictionQuality: number;
    briefRationale: string;
    topicId: string | null;
    filterAgentId: string | null;
    canonicalId: string | null;
    duplicateCount?: number;
    verdictId: string | null;
    verdict: boolean | null;
    verdictContext: VerdictContext | null;
    verdictCreatedAt: Date | null;
    verdictSources: VerdictSource[] | null;
    feedbackFailureCause: string | null;
    feedbackReason: string | null;
  }[];
}

/**
 * Fetches parent and root tweets for thread context
 */
export async function fetchThreadContext(
  ctx: TRPCContext,
  tweetIds: bigint[],
): Promise<Map<bigint, ParentTweet>> {
  if (tweetIds.length === 0) return new Map();

  const tweets = await ctx.db
    .select({
      tweetId: scrapedTweetSchema.id,
      tweetText: scrapedTweetSchema.text,
      tweetDate: scrapedTweetSchema.date,
      authorId: scrapedTweetSchema.authorId,
      username: twitterUsersSchema.username,
      screenName: twitterUsersSchema.screenName,
      avatarUrl: twitterUsersSchema.avatarUrl,
    })
    .from(scrapedTweetSchema)
    .leftJoin(
      twitterUsersSchema,
      eq(twitterUsersSchema.id, scrapedTweetSchema.authorId),
    )
    .where(
      sql`${scrapedTweetSchema.id} IN (${sql.join(
        tweetIds.map((id) => sql`${id}`),
        sql`, `,
      )})`,
    );

  const result = new Map<bigint, ParentTweet>();
  tweets.forEach((t) => {
    result.set(t.tweetId, {
      tweetId: t.tweetId,
      tweetText: t.tweetText,
      tweetDate: t.tweetDate,
      authorId: t.authorId,
      username: t.username,
      screenName: t.screenName,
      avatarUrl: t.avatarUrl,
    });
  });
  return result;
}

async function fetchDuplicateCounts(
  ctx: TRPCContext,
  parsedIds: string[],
): Promise<Map<string, number>> {
  if (parsedIds.length === 0) return new Map();

  const duplicateCounts = await ctx.db
    .select({
      canonicalId: predictionDuplicateRelationsSchema.canonicalId,
      count: sql<number>`count(*)::int`,
    })
    .from(predictionDuplicateRelationsSchema)
    .where(
      sql`${predictionDuplicateRelationsSchema.canonicalId} IN (${sql.join(
        parsedIds.map((id) => sql`${id}`),
        sql`, `,
      )})`,
    )
    .groupBy(predictionDuplicateRelationsSchema.canonicalId);

  const result = new Map<string, number>();
  duplicateCounts.forEach((row) => {
    result.set(row.canonicalId, row.count);
  });
  return result;
}

/**
 * Groups raw predictions by tweet ID and includes thread context.
 * Simple version without duplicate counts - used by watch/star routers.
 */
export async function groupPredictionsByTweetSimple(
  rawPredictions: RawPrediction[],
  ctx: TRPCContext,
): Promise<GroupedTweet[]> {
  const groupedByTweet: Record<string, GroupedTweet> = {};

  const contextTweetIds = new Set<bigint>();

  rawPredictions.forEach((pred) => {
    if (pred.parentTweetId) contextTweetIds.add(pred.parentTweetId);
    if (pred.conversationId && pred.conversationId !== pred.tweetId) {
      contextTweetIds.add(pred.conversationId);
    }
  });

  const threadContext = await fetchThreadContext(
    ctx,
    Array.from(contextTweetIds),
  );

  rawPredictions.forEach((pred) => {
    const tweetId = pred.tweetId.toString();

    if (!groupedByTweet[tweetId]) {
      groupedByTweet[tweetId] = {
        tweetId: pred.tweetId,
        tweetText: pred.tweetText,
        tweetDate: pred.tweetDate,
        conversationId: pred.conversationId,
        parentTweetId: pred.parentTweetId,
        userId: pred.userId,
        username: pred.username,
        screenName: pred.screenName,
        avatarUrl: pred.avatarUrl,
        isVerified: pred.isVerified,
        parentTweet: pred.parentTweetId
          ? (threadContext.get(pred.parentTweetId) ?? null)
          : null,
        rootTweet:
          pred.conversationId && pred.conversationId !== pred.tweetId
            ? (threadContext.get(pred.conversationId) ?? null)
            : null,
        predictions: [],
      };
    }
    groupedByTweet[tweetId].predictions.push({
      parsedId: pred.parsedId,
      predictionId: pred.predictionId,
      target: pred.target,
      timeframe: pred.timeframe,
      llmConfidence: pred.llmConfidence,
      vagueness: pred.vagueness,
      context: pred.context,
      predictionQuality: pred.predictionQuality,
      briefRationale: pred.briefRationale,
      topicId: pred.topicId,
      filterAgentId: pred.filterAgentId,
      canonicalId: pred.canonicalId,
      verdictId: pred.verdictId,
      verdict: pred.verdict,
      verdictContext: pred.verdictContext,
      verdictCreatedAt: pred.verdictCreatedAt,
      verdictSources: pred.verdictSources,
      feedbackFailureCause: pred.feedbackFailureCause,
      feedbackReason: pred.feedbackReason,
    });
  });

  return Object.values(groupedByTweet);
}

/**
 * Groups raw predictions by tweet ID with duplicate counts and timing.
 * Full version used by the main prediction router.
 */
async function groupPredictionsByTweet(
  rawPredictions: RawPrediction[],
  ctx: TRPCContext,
): Promise<GroupedTweet[]> {
  const groupedByTweet: Record<string, GroupedTweet> = {};

  const contextTweetIds = new Set<bigint>();

  rawPredictions.forEach((pred) => {
    if (pred.parentTweetId) contextTweetIds.add(pred.parentTweetId);
    if (pred.conversationId && pred.conversationId !== pred.tweetId) {
      contextTweetIds.add(pred.conversationId);
    }
  });

  const allContextIds = Array.from(contextTweetIds);

  const start = process.hrtime.bigint();
  const contextTweets = await fetchThreadContext(ctx, allContextIds);
  const total = process.hrtime.bigint() - start;
  console.log(
    `fetched ${Array.from(contextTweets.keys()).length}/${allContextIds.length} in ${total / 1_000_000n}ms`,
  );

  const canonicalParsedIds = rawPredictions
    .filter((pred) => !pred.canonicalId)
    .map((pred) => pred.parsedId);
  const duplicateCounts = await fetchDuplicateCounts(ctx, canonicalParsedIds);

  rawPredictions.forEach((pred) => {
    const tweetId = pred.tweetId.toString();

    if (!groupedByTweet[tweetId]) {
      groupedByTweet[tweetId] = {
        tweetId: pred.tweetId,
        tweetText: pred.tweetText,
        tweetDate: pred.tweetDate,
        conversationId: pred.conversationId,
        parentTweetId: pred.parentTweetId,
        userId: pred.userId,
        username: pred.username,
        screenName: pred.screenName,
        avatarUrl: pred.avatarUrl,
        isVerified: pred.isVerified,
        parentTweet: pred.parentTweetId
          ? (contextTweets.get(pred.parentTweetId) ?? null)
          : null,
        rootTweet:
          pred.conversationId && pred.conversationId !== pred.tweetId
            ? (contextTweets.get(pred.conversationId) ?? null)
            : null,
        predictions: [],
      };
    }
    const duplicateCount = duplicateCounts.get(pred.parsedId);
    groupedByTweet[tweetId].predictions.push({
      parsedId: pred.parsedId,
      predictionId: pred.predictionId,
      target: pred.target,
      timeframe: pred.timeframe,
      llmConfidence: pred.llmConfidence,
      vagueness: pred.vagueness,
      context: pred.context,
      predictionQuality: pred.predictionQuality,
      briefRationale: pred.briefRationale,
      topicId: pred.topicId,
      filterAgentId: pred.filterAgentId,
      canonicalId: pred.canonicalId,
      duplicateCount,
      verdictId: pred.verdictId,
      verdict: pred.verdict,
      verdictContext: pred.verdictContext,
      verdictCreatedAt: pred.verdictCreatedAt,
      verdictSources: pred.verdictSources,
      feedbackFailureCause: pred.feedbackFailureCause,
      feedbackReason: pred.feedbackReason,
    });
  });

  // Sort predictions within each tweet by quality score, then by confidence
  Object.values(groupedByTweet).forEach((tweet) => {
    tweet.predictions.sort((a, b) => {
      // Primary: quality score (higher is better)
      if (a.predictionQuality !== b.predictionQuality) {
        return b.predictionQuality - a.predictionQuality;
      }
      // Secondary: LLM confidence (higher is better)
      return parseFloat(b.llmConfidence) - parseFloat(a.llmConfidence);
    });
  });

  // Convert to array and sort by most recent tweet
  return Object.values(groupedByTweet).sort(
    (a, b) => b.tweetDate.getTime() - a.tweetDate.getTime(),
  );
}

/**
 * Prediction router - handles operations for retrieving predictions
 */
export const predictionRouter = {
  /**
   * Get predictions by Twitter username
   *
   * Fetches all predictions made by a specific Twitter user, ordered by date.
   * Includes parsed prediction data, confidence scores, and source tweet information.
   *
   * @returns Array of predictions with user and tweet data
   */
  getByUsername: publicProcedure
    .input(
      z.object({
        username: z
          .string()
          .min(1, "Username is required")
          .transform((val) => (val.startsWith("@") ? val.slice(1) : val)),
        limit: z.number().min(1).max(10000).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { username, limit, offset } = input;

      // Start from twitter_users to leverage indexes for username filtering
      const rawPredictions = await ctx.db
        .select({
          predictionId: parsedPredictionSchema.predictionId,
          parsedId: parsedPredictionSchema.id,
          target: parsedPredictionSchema.target,
          timeframe: parsedPredictionSchema.timeframe,
          llmConfidence: parsedPredictionSchema.llmConfidence,
          vagueness: parsedPredictionSchema.vagueness,
          context: parsedPredictionSchema.context,
          predictionQuality: parsedPredictionSchema.predictionQuality,
          briefRationale: parsedPredictionSchema.briefRationale,
          topicId: parsedPredictionSchema.topicId,
          filterAgentId: parsedPredictionSchema.filterAgentId,
          canonicalId: predictionDuplicateRelationsSchema.canonicalId,
          tweetId: scrapedTweetSchema.id,
          tweetText: scrapedTweetSchema.text,
          tweetDate: scrapedTweetSchema.date,
          conversationId: scrapedTweetSchema.conversationId,
          parentTweetId: scrapedTweetSchema.parentTweetId,
          verdictId: verdictSchema.id,
          verdict: verdictSchema.verdict,
          verdictContext: verdictSchema.context,
          verdictCreatedAt: verdictSchema.createdAt,
          verdictSources: parsedPredictionDetailsSchema.verdictSources,
          feedbackFailureCause: parsedPredictionFeedbackSchema.failureCause,
          feedbackReason: parsedPredictionFeedbackSchema.reason,
          userId: twitterUsersSchema.id,
          username: twitterUsersSchema.username,
          screenName: twitterUsersSchema.screenName,
          avatarUrl: twitterUsersSchema.avatarUrl,
          isVerified: twitterUsersSchema.isVerified,
        })
        .from(twitterUsersSchema)
        .innerJoin(
          scrapedTweetSchema,
          and(
            eq(scrapedTweetSchema.authorId, twitterUsersSchema.id),
            isNotNull(scrapedTweetSchema.predictionId),
          ),
        )
        .innerJoin(
          parsedPredictionSchema,
          and(
            eq(
              parsedPredictionSchema.predictionId,
              scrapedTweetSchema.predictionId,
            ),
            notExists(
              ctx.db
                .select({
                  id: parsedPredictionFeedbackSchema.parsedPredictionId,
                })
                .from(parsedPredictionFeedbackSchema)
                .where(
                  and(
                    eq(
                      parsedPredictionFeedbackSchema.parsedPredictionId,
                      parsedPredictionSchema.id,
                    ),
                    or(
                      sql`${parsedPredictionFeedbackSchema.failureCause} != 'FUTURE_TIMEFRAME'`,
                      isNull(parsedPredictionFeedbackSchema.failureCause),
                    ),
                  ),
                ),
            ),
          ),
        )
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
        .leftJoin(
          parsedPredictionDetailsSchema,
          eq(
            parsedPredictionDetailsSchema.parsedPredictionId,
            parsedPredictionSchema.id,
          ),
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
            eq(
              sql`LOWER(${twitterUsersSchema.username})`,
              username.toLowerCase(),
            ),
            eq(twitterUsersSchema.tracked, true),
          ),
        )
        .orderBy(desc(parsedPredictionSchema.createdAt))
        .limit(limit)
        .offset(offset);

      return await groupPredictionsByTweet(
        rawPredictions as RawPrediction[],
        ctx,
      );
    }),

  /**
   * Get predictions feed for multiple users
   *
   * Fetches predictions from all tracked users, ordered by date.
   * Useful for displaying an aggregated feed.
   *
   * @returns Array of predictions from all users
   */
  getFeed: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(10000).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, offset } = input;

      const rawPredictions = await ctx.db
        .select({
          // Prediction data
          predictionId: predictionSchema.id,

          // Parsed prediction data
          parsedId: parsedPredictionSchema.id,
          target: parsedPredictionSchema.target,
          timeframe: parsedPredictionSchema.timeframe,
          llmConfidence: parsedPredictionSchema.llmConfidence,
          vagueness: parsedPredictionSchema.vagueness,
          context: parsedPredictionSchema.context,
          predictionQuality: parsedPredictionSchema.predictionQuality,
          briefRationale: parsedPredictionSchema.briefRationale,
          topicId: parsedPredictionSchema.topicId,

          // Tweet data
          tweetId: scrapedTweetSchema.id,
          tweetText: scrapedTweetSchema.text,
          tweetDate: scrapedTweetSchema.date,
          conversationId: scrapedTweetSchema.conversationId,
          parentTweetId: scrapedTweetSchema.parentTweetId,

          // User data
          userId: twitterUsersSchema.id,
          username: twitterUsersSchema.username,
          screenName: twitterUsersSchema.screenName,
          avatarUrl: twitterUsersSchema.avatarUrl,
          isVerified: twitterUsersSchema.isVerified,

          // Verdict data (optional)
          verdictId: verdictSchema.id,
          verdict: verdictSchema.verdict,
          verdictContext: verdictSchema.context,
          verdictCreatedAt: verdictSchema.createdAt,
          verdictSources: parsedPredictionDetailsSchema.verdictSources,

          // Feedback data (for FUTURE_TIMEFRAME)
          feedbackFailureCause: parsedPredictionFeedbackSchema.failureCause,
          feedbackReason: parsedPredictionFeedbackSchema.reason,
        })
        .from(predictionSchema)
        .innerJoin(
          parsedPredictionSchema,
          and(
            eq(parsedPredictionSchema.predictionId, predictionSchema.id),
            notExists(
              ctx.db
                .select({
                  id: parsedPredictionFeedbackSchema.parsedPredictionId,
                })
                .from(parsedPredictionFeedbackSchema)
                .where(
                  and(
                    eq(
                      parsedPredictionFeedbackSchema.parsedPredictionId,
                      parsedPredictionSchema.id,
                    ),
                    or(
                      sql`${parsedPredictionFeedbackSchema.failureCause} != 'FUTURE_TIMEFRAME'`,
                      isNull(parsedPredictionFeedbackSchema.failureCause),
                    ),
                  ),
                ),
            ),
          ),
        )
        .innerJoin(
          scrapedTweetSchema,
          eq(
            scrapedTweetSchema.predictionId,
            parsedPredictionSchema.predictionId,
          ),
        )
        .innerJoin(
          twitterUsersSchema,
          eq(twitterUsersSchema.id, scrapedTweetSchema.authorId),
        )
        .leftJoin(
          verdictSchema,
          eq(verdictSchema.parsedPredictionId, parsedPredictionSchema.id),
        )
        .leftJoin(
          parsedPredictionDetailsSchema,
          eq(
            parsedPredictionDetailsSchema.parsedPredictionId,
            parsedPredictionSchema.id,
          ),
        )
        .leftJoin(
          parsedPredictionFeedbackSchema,
          eq(
            parsedPredictionFeedbackSchema.parsedPredictionId,
            parsedPredictionSchema.id,
          ),
        )
        .where(and(eq(twitterUsersSchema.tracked, true)))
        .orderBy(desc(predictionSchema.createdAt))
        .limit(limit)
        .offset(offset);

      return await groupPredictionsByTweet(
        rawPredictions as RawPrediction[],
        ctx,
      );
    }),

  /**
   * Get prediction counts by username (for pagination)
   */
  getCountsByUsername: publicProcedure
    .input(
      z.object({
        username: z
          .string()
          .min(1)
          .transform((val) => (val.startsWith("@") ? val.slice(1) : val)),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { username } = input;

      // Start from twitter_users to leverage indexes for username filtering
      const counts = await ctx.db
        .select({
          verdictStatus: sql<string | null>`CASE
            WHEN ${verdictSchema.id} IS NULL THEN 'ongoing'
            WHEN ${verdictSchema.verdict} = true THEN 'true'
            WHEN ${verdictSchema.verdict} = false THEN 'false'
          END`.as("verdict_status"),
          count: sql<number>`COUNT(DISTINCT ${parsedPredictionSchema.id})`,
        })
        .from(twitterUsersSchema)
        .innerJoin(
          scrapedTweetSchema,
          and(
            eq(scrapedTweetSchema.authorId, twitterUsersSchema.id),
            isNotNull(scrapedTweetSchema.predictionId),
          ),
        )
        .innerJoin(
          parsedPredictionSchema,
          and(
            eq(
              parsedPredictionSchema.predictionId,
              scrapedTweetSchema.predictionId,
            ),
            notExists(
              ctx.db
                .select({
                  id: parsedPredictionFeedbackSchema.parsedPredictionId,
                })
                .from(parsedPredictionFeedbackSchema)
                .where(
                  and(
                    eq(
                      parsedPredictionFeedbackSchema.parsedPredictionId,
                      parsedPredictionSchema.id,
                    ),
                    or(
                      sql`${parsedPredictionFeedbackSchema.failureCause} != 'FUTURE_TIMEFRAME'`,
                      isNull(parsedPredictionFeedbackSchema.failureCause),
                    ),
                  ),
                ),
            ),
          ),
        )
        .leftJoin(
          verdictSchema,
          eq(verdictSchema.parsedPredictionId, parsedPredictionSchema.id),
        )
        .where(
          and(
            eq(
              sql`LOWER(${twitterUsersSchema.username})`,
              username.toLowerCase(),
            ),
            eq(twitterUsersSchema.tracked, true),
          ),
        )
        .groupBy(sql`verdict_status`);

      const result = {
        ongoing: 0,
        true: 0,
        false: 0,
      };

      counts.forEach((row) => {
        if (row.verdictStatus === "ongoing") result.ongoing = row.count;
        if (row.verdictStatus === "true") result.true = row.count;
        if (row.verdictStatus === "false") result.false = row.count;
      });

      return result;
    }),

  /**
   * Get predictions by username filtered by verdict status
   */
  getByUsernameAndVerdict: publicProcedure
    .input(
      z.object({
        username: z
          .string()
          .min(1)
          .transform((val) => (val.startsWith("@") ? val.slice(1) : val)),
        verdictStatus: z.enum(["ongoing", "true", "false"]),
        limit: z.number().min(1).max(100).default(30),
        offset: z.number().min(0).default(0),
        dateFrom: z.string().datetime().optional(),
        dateTo: z.string().datetime().optional(),
        topicIds: z.array(z.string()).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const {
        username,
        verdictStatus,
        limit,
        offset,
        dateFrom,
        dateTo,
        topicIds,
      } = input;

      const rawPredictions = await ctx.db
        .select({
          predictionId: parsedPredictionSchema.predictionId,
          parsedId: parsedPredictionSchema.id,
          target: parsedPredictionSchema.target,
          timeframe: parsedPredictionSchema.timeframe,
          llmConfidence: parsedPredictionSchema.llmConfidence,
          vagueness: parsedPredictionSchema.vagueness,
          context: parsedPredictionSchema.context,
          predictionQuality: parsedPredictionSchema.predictionQuality,
          briefRationale: parsedPredictionSchema.briefRationale,
          topicId: parsedPredictionSchema.topicId,
          filterAgentId: parsedPredictionSchema.filterAgentId,
          canonicalId: predictionDuplicateRelationsSchema.canonicalId,
          tweetId: scrapedTweetSchema.id,
          tweetText: scrapedTweetSchema.text,
          tweetDate: scrapedTweetSchema.date,
          conversationId: scrapedTweetSchema.conversationId,
          parentTweetId: scrapedTweetSchema.parentTweetId,
          verdictId: verdictSchema.id,
          verdict: verdictSchema.verdict,
          verdictContext: verdictSchema.context,
          verdictCreatedAt: verdictSchema.createdAt,
          verdictSources: parsedPredictionDetailsSchema.verdictSources,
          feedbackFailureCause: parsedPredictionFeedbackSchema.failureCause,
          feedbackReason: parsedPredictionFeedbackSchema.reason,
          userId: twitterUsersSchema.id,
          username: twitterUsersSchema.username,
          screenName: twitterUsersSchema.screenName,
          avatarUrl: twitterUsersSchema.avatarUrl,
          isVerified: twitterUsersSchema.isVerified,
        })
        .from(twitterUsersSchema)
        .innerJoin(
          scrapedTweetSchema,
          and(
            eq(scrapedTweetSchema.authorId, twitterUsersSchema.id),
            isNotNull(scrapedTweetSchema.predictionId),
          ),
        )
        .innerJoin(
          parsedPredictionSchema,
          and(
            eq(
              parsedPredictionSchema.predictionId,
              scrapedTweetSchema.predictionId,
            ),
            notExists(
              ctx.db
                .select({
                  id: parsedPredictionFeedbackSchema.parsedPredictionId,
                })
                .from(parsedPredictionFeedbackSchema)
                .where(
                  and(
                    eq(
                      parsedPredictionFeedbackSchema.parsedPredictionId,
                      parsedPredictionSchema.id,
                    ),
                    or(
                      sql`${parsedPredictionFeedbackSchema.failureCause} != 'FUTURE_TIMEFRAME'`,
                      isNull(parsedPredictionFeedbackSchema.failureCause),
                    ),
                  ),
                ),
            ),
          ),
        )
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
        .leftJoin(
          parsedPredictionDetailsSchema,
          eq(
            parsedPredictionDetailsSchema.parsedPredictionId,
            parsedPredictionSchema.id,
          ),
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
            eq(
              sql`LOWER(${twitterUsersSchema.username})`,
              username.toLowerCase(),
            ),
            verdictStatus === "ongoing"
              ? isNull(verdictSchema.id)
              : eq(
                  verdictSchema.verdict,
                  verdictStatus === "true" ? true : false,
                ),
            dateFrom
              ? gte(scrapedTweetSchema.date, new Date(dateFrom))
              : undefined,
            dateTo ? lte(scrapedTweetSchema.date, new Date(dateTo)) : undefined,
            topicIds && topicIds.length > 0
              ? sql`${parsedPredictionSchema.topicId} IN (${sql.join(
                  topicIds.map((id) => sql`${id}`),
                  sql`, `,
                )})`
              : undefined,
          ),
        )
        .orderBy(desc(parsedPredictionSchema.createdAt))
        .limit(limit)
        .offset(offset);

      return await groupPredictionsByTweet(
        rawPredictions as RawPrediction[],
        ctx,
      );
    }),

  /**
   * Get feed predictions filtered by verdict status
   */
  getFeedByVerdict: publicProcedure
    .input(
      z.object({
        verdictStatus: z.enum(["ongoing", "true", "false"]),
        limit: z.number().min(1).max(100).default(30),
        offset: z.number().min(0).default(0),
        dateFrom: z.string().datetime().optional(),
        dateTo: z.string().datetime().optional(),
        topicIds: z.array(z.string()).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { verdictStatus, limit, offset, dateFrom, dateTo, topicIds } =
        input;

      const rawPredictions = await ctx.db
        .select({
          predictionId: predictionSchema.id,
          parsedId: parsedPredictionSchema.id,
          target: parsedPredictionSchema.target,
          timeframe: parsedPredictionSchema.timeframe,
          llmConfidence: parsedPredictionSchema.llmConfidence,
          vagueness: parsedPredictionSchema.vagueness,
          context: parsedPredictionSchema.context,
          predictionQuality: parsedPredictionSchema.predictionQuality,
          briefRationale: parsedPredictionSchema.briefRationale,
          topicId: parsedPredictionSchema.topicId,
          tweetId: scrapedTweetSchema.id,
          tweetText: scrapedTweetSchema.text,
          tweetDate: scrapedTweetSchema.date,
          conversationId: scrapedTweetSchema.conversationId,
          parentTweetId: scrapedTweetSchema.parentTweetId,
          userId: twitterUsersSchema.id,
          username: twitterUsersSchema.username,
          screenName: twitterUsersSchema.screenName,
          avatarUrl: twitterUsersSchema.avatarUrl,
          isVerified: twitterUsersSchema.isVerified,
          verdictId: verdictSchema.id,
          verdict: verdictSchema.verdict,
          verdictContext: verdictSchema.context,
          verdictCreatedAt: verdictSchema.createdAt,
          verdictSources: parsedPredictionDetailsSchema.verdictSources,
          feedbackFailureCause: parsedPredictionFeedbackSchema.failureCause,
          feedbackReason: parsedPredictionFeedbackSchema.reason,
        })
        .from(predictionSchema)
        .innerJoin(
          parsedPredictionSchema,
          and(
            eq(parsedPredictionSchema.predictionId, predictionSchema.id),
            notExists(
              ctx.db
                .select({
                  id: parsedPredictionFeedbackSchema.parsedPredictionId,
                })
                .from(parsedPredictionFeedbackSchema)
                .where(
                  and(
                    eq(
                      parsedPredictionFeedbackSchema.parsedPredictionId,
                      parsedPredictionSchema.id,
                    ),
                    or(
                      sql`${parsedPredictionFeedbackSchema.failureCause} != 'FUTURE_TIMEFRAME'`,
                      isNull(parsedPredictionFeedbackSchema.failureCause),
                    ),
                  ),
                ),
            ),
          ),
        )
        .innerJoin(
          scrapedTweetSchema,
          eq(
            scrapedTweetSchema.predictionId,
            parsedPredictionSchema.predictionId,
          ),
        )
        .innerJoin(
          twitterUsersSchema,
          eq(twitterUsersSchema.id, scrapedTweetSchema.authorId),
        )
        .leftJoin(
          verdictSchema,
          eq(verdictSchema.parsedPredictionId, parsedPredictionSchema.id),
        )
        .leftJoin(
          parsedPredictionDetailsSchema,
          eq(
            parsedPredictionDetailsSchema.parsedPredictionId,
            parsedPredictionSchema.id,
          ),
        )
        .leftJoin(
          parsedPredictionFeedbackSchema,
          eq(
            parsedPredictionFeedbackSchema.parsedPredictionId,
            parsedPredictionSchema.id,
          ),
        )
        .where(
          and(
            eq(twitterUsersSchema.tracked, true),
            verdictStatus === "ongoing"
              ? isNull(verdictSchema.id)
              : verdictStatus === "true"
                ? eq(verdictSchema.verdict, true)
                : eq(verdictSchema.verdict, false),
            dateFrom
              ? gte(scrapedTweetSchema.date, new Date(dateFrom))
              : undefined,
            dateTo ? lte(scrapedTweetSchema.date, new Date(dateTo)) : undefined,
            topicIds && topicIds.length > 0
              ? sql`${parsedPredictionSchema.topicId} IN (${sql.join(
                  topicIds.map((id) => sql`${id}`),
                  sql`, `,
                )})`
              : undefined,
          ),
        )
        .orderBy(desc(predictionSchema.createdAt))
        .limit(limit)
        .offset(offset);

      return await groupPredictionsByTweet(
        rawPredictions as RawPrediction[],
        ctx,
      );
    }),

  /**
   * Get feed prediction counts
   */
  getFeedCounts: publicProcedure.query(async ({ ctx }) => {
    const counts = await ctx.db
      .select({
        verdictStatus: sql<string | null>`CASE
          WHEN ${verdictSchema.id} IS NULL AND (${parsedPredictionFeedbackSchema.parsedPredictionId} IS NULL OR ${parsedPredictionFeedbackSchema.failureCause} = 'FUTURE_TIMEFRAME') THEN 'ongoing'
          WHEN ${verdictSchema.verdict} = true THEN 'true'
          WHEN ${verdictSchema.verdict} = false THEN 'false'
        END`.as("verdict_status"),
        count: sql<number>`COUNT(DISTINCT ${parsedPredictionSchema.id})`,
      })
      .from(predictionSchema)
      .innerJoin(
        parsedPredictionSchema,
        and(
          eq(parsedPredictionSchema.predictionId, predictionSchema.id),
          notExists(
            ctx.db
              .select({
                id: parsedPredictionFeedbackSchema.parsedPredictionId,
              })
              .from(parsedPredictionFeedbackSchema)
              .where(
                and(
                  eq(
                    parsedPredictionFeedbackSchema.parsedPredictionId,
                    parsedPredictionSchema.id,
                  ),
                  or(
                    sql`${parsedPredictionFeedbackSchema.failureCause} != 'FUTURE_TIMEFRAME'`,
                    isNull(parsedPredictionFeedbackSchema.failureCause),
                  ),
                ),
              ),
          ),
        ),
      )
      .innerJoin(
        scrapedTweetSchema,
        eq(
          scrapedTweetSchema.predictionId,
          parsedPredictionSchema.predictionId,
        ),
      )
      .innerJoin(
        twitterUsersSchema,
        eq(twitterUsersSchema.id, scrapedTweetSchema.authorId),
      )
      .leftJoin(
        verdictSchema,
        eq(verdictSchema.parsedPredictionId, parsedPredictionSchema.id),
      )
      .leftJoin(
        parsedPredictionFeedbackSchema,
        eq(
          parsedPredictionFeedbackSchema.parsedPredictionId,
          parsedPredictionSchema.id,
        ),
      )
      .where(and(eq(twitterUsersSchema.tracked, true)))
      .groupBy(sql`verdict_status`);

    const result = {
      ongoing: 0,
      true: 0,
      false: 0,
    };

    counts.forEach((row) => {
      if (row.verdictStatus === "ongoing") result.ongoing = row.count;
      if (row.verdictStatus === "true") result.true = row.count;
      if (row.verdictStatus === "false") result.false = row.count;
    });

    return result;
  }),
  /**
   * Get prediction counts for multiple tickers
   */
  getTickerCounts: publicProcedure
    .input(
      z.object({
        tickers: z.array(z.string()).min(1).max(100),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { tickers } = input;

      const counts: Record<string, number> = {};

      await Promise.all(
        tickers.map(async (ticker) => {
          const tickerUpper = ticker.toUpperCase();
          const result = await ctx.db
            .select({
              count: sql<number>`COUNT(DISTINCT ${parsedPredictionSchema.id})`,
            })
            .from(parsedPredictionSchema)
            .where(
              and(
                sql`${parsedPredictionSchema.context}->>'schema_type' = 'crypto'`,
                sql`${parsedPredictionSchema.context}->'tickers' @> ${JSON.stringify([tickerUpper])}`,
                // Same feedback filter as other queries
                notExists(
                  ctx.db
                    .select({
                      id: parsedPredictionFeedbackSchema.parsedPredictionId,
                    })
                    .from(parsedPredictionFeedbackSchema)
                    .where(
                      and(
                        eq(
                          parsedPredictionFeedbackSchema.parsedPredictionId,
                          parsedPredictionSchema.id,
                        ),
                        or(
                          sql`${parsedPredictionFeedbackSchema.failureCause} != 'FUTURE_TIMEFRAME'`,
                          isNull(parsedPredictionFeedbackSchema.failureCause),
                        ),
                      ),
                    ),
                ),
              ),
            )
            .execute();

          counts[tickerUpper] = result[0]?.count ?? 0;
        }),
      );

      return counts;
    }),

  /**
   * Get predictions by ticker symbol (e.g., "BTC", "ETH").
   *
   * Searches the context.tickers JSONB array field for predictions containing
   * the specified ticker symbol (case-insensitive).
   */
  getByTickerSymbol: publicProcedure
    .input(
      z.object({
        symbol: z.string().min(1).max(20),
        limit: z.number().int().positive().max(100).default(50),
        offset: z.number().int().nonnegative().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { symbol, limit, offset } = input;
      const symbolUpper = symbol.toUpperCase();

      const rawPredictions = await ctx.db
        .select({
          // Prediction data
          predictionId: parsedPredictionSchema.predictionId,

          // Parsed prediction data
          parsedId: parsedPredictionSchema.id,
          target: parsedPredictionSchema.target,
          timeframe: parsedPredictionSchema.timeframe,
          llmConfidence: parsedPredictionSchema.llmConfidence,
          vagueness: parsedPredictionSchema.vagueness,
          context: parsedPredictionSchema.context,
          predictionQuality: parsedPredictionSchema.predictionQuality,
          briefRationale: parsedPredictionSchema.briefRationale,
          topicId: parsedPredictionSchema.topicId,

          // Tweet data
          tweetId: scrapedTweetSchema.id,
          tweetText: scrapedTweetSchema.text,
          tweetDate: scrapedTweetSchema.date,
          conversationId: scrapedTweetSchema.conversationId,
          parentTweetId: scrapedTweetSchema.parentTweetId,

          // User data
          userId: twitterUsersSchema.id,
          username: twitterUsersSchema.username,
          screenName: twitterUsersSchema.screenName,
          avatarUrl: twitterUsersSchema.avatarUrl,
          isVerified: twitterUsersSchema.isVerified,

          // Verdict data (optional)
          verdictId: verdictSchema.id,
          verdict: verdictSchema.verdict,
          verdictContext: verdictSchema.context,
          verdictCreatedAt: verdictSchema.createdAt,
          verdictSources: parsedPredictionDetailsSchema.verdictSources,

          // Feedback data (for FUTURE_TIMEFRAME)
          feedbackFailureCause: parsedPredictionFeedbackSchema.failureCause,
          feedbackReason: parsedPredictionFeedbackSchema.reason,
        })
        .from(predictionSchema)
        .innerJoin(
          parsedPredictionSchema,
          and(
            eq(parsedPredictionSchema.predictionId, predictionSchema.id),
            notExists(
              ctx.db
                .select({
                  id: parsedPredictionFeedbackSchema.parsedPredictionId,
                })
                .from(parsedPredictionFeedbackSchema)
                .where(
                  and(
                    eq(
                      parsedPredictionFeedbackSchema.parsedPredictionId,
                      parsedPredictionSchema.id,
                    ),
                    or(
                      sql`${parsedPredictionFeedbackSchema.failureCause} != 'FUTURE_TIMEFRAME'`,
                      isNull(parsedPredictionFeedbackSchema.failureCause),
                    ),
                  ),
                ),
            ),
          ),
        )
        .innerJoin(
          scrapedTweetSchema,
          eq(
            scrapedTweetSchema.predictionId,
            parsedPredictionSchema.predictionId,
          ),
        )
        .innerJoin(
          twitterUsersSchema,
          eq(twitterUsersSchema.id, scrapedTweetSchema.authorId),
        )
        .leftJoin(
          verdictSchema,
          eq(verdictSchema.parsedPredictionId, parsedPredictionSchema.id),
        )
        .leftJoin(
          parsedPredictionDetailsSchema,
          eq(
            parsedPredictionDetailsSchema.parsedPredictionId,
            parsedPredictionSchema.id,
          ),
        )
        .leftJoin(
          parsedPredictionFeedbackSchema,
          eq(
            parsedPredictionFeedbackSchema.parsedPredictionId,
            parsedPredictionSchema.id,
          ),
        )
        .where(
          and(
            sql`${parsedPredictionSchema.context}->>'schema_type' = 'crypto'`,
            sql`${parsedPredictionSchema.context}->'tickers' @> ${JSON.stringify([symbolUpper])}`,
            eq(twitterUsersSchema.tracked, true),
          ),
        )
        .orderBy(desc(parsedPredictionSchema.predictionQuality))
        .limit(limit)
        .offset(offset);

      return await groupPredictionsByTweet(
        rawPredictions as RawPrediction[],
        ctx,
      );
    }),
} satisfies TRPCRouterRecord;
