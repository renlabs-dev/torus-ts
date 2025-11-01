import { and, desc, eq, isNull, sql } from "@torus-ts/db";
import {
  parsedPredictionFeedbackSchema,
  parsedPredictionSchema,
  predictionSchema,
  scrapedTweetSchema,
  twitterUsersSchema,
  verdictSchema,
} from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../trpc";

export interface PostSlice {
  source: { tweet_id: string };
  start: number;
  end: number;
}

export interface VerdictContext {
  feedback: string;
}

interface RawPrediction {
  predictionId: string;
  predictionCreatedAt: Date;
  predictionVersion: number;
  parsedId: string;
  goal: PostSlice[];
  timeframe: PostSlice[];
  llmConfidence: string;
  vagueness: string | null;
  context: unknown;
  predictionQuality: number;
  briefRationale: string;
  tweetId: bigint;
  tweetText: string;
  tweetDate: Date;
  userId: bigint;
  username: string | null;
  screenName: string | null;
  avatarUrl: string | null;
  isVerified: boolean | null;
  verdictId: string | null;
  verdict: boolean | null;
  verdictContext: VerdictContext | null;
  verdictCreatedAt: Date | null;
}

export interface GroupedTweet {
  tweetId: bigint;
  tweetText: string;
  tweetDate: Date;
  userId: bigint;
  username: string | null;
  screenName: string | null;
  avatarUrl: string | null;
  isVerified: boolean | null;
  predictions: {
    parsedId: string;
    predictionId: string;
    predictionCreatedAt: Date;
    predictionVersion: number;
    goal: PostSlice[];
    timeframe: PostSlice[];
    llmConfidence: string;
    vagueness: string | null;
    context: unknown;
    predictionQuality: number;
    briefRationale: string;
    verdictId: string | null;
    verdict: boolean | null;
    verdictContext: VerdictContext | null;
    verdictCreatedAt: Date | null;
  }[];
}

/**
 * Groups raw predictions by tweet ID
 */
function groupPredictionsByTweet(
  rawPredictions: RawPrediction[],
): GroupedTweet[] {
  const groupedByTweet: Record<string, GroupedTweet> = {};

  rawPredictions.forEach((pred) => {
    const tweetId = pred.tweetId.toString();
    if (!groupedByTweet[tweetId]) {
      groupedByTweet[tweetId] = {
        tweetId: pred.tweetId,
        tweetText: pred.tweetText,
        tweetDate: pred.tweetDate,
        userId: pred.userId,
        username: pred.username,
        screenName: pred.screenName,
        avatarUrl: pred.avatarUrl,
        isVerified: pred.isVerified,
        predictions: [],
      };
    }
    groupedByTweet[tweetId].predictions.push({
      parsedId: pred.parsedId,
      predictionId: pred.predictionId,
      predictionCreatedAt: pred.predictionCreatedAt,
      predictionVersion: pred.predictionVersion,
      goal: pred.goal,
      timeframe: pred.timeframe,
      llmConfidence: pred.llmConfidence,
      vagueness: pred.vagueness,
      context: pred.context,
      predictionQuality: pred.predictionQuality,
      briefRationale: pred.briefRationale,
      verdictId: pred.verdictId,
      verdict: pred.verdict,
      verdictContext: pred.verdictContext,
      verdictCreatedAt: pred.verdictCreatedAt,
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
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { username, offset } = input;

      // Get all predictions with their data
      const rawPredictions = await ctx.db
        .select({
          // Prediction data
          predictionId: predictionSchema.id,
          predictionCreatedAt: predictionSchema.createdAt,
          predictionVersion: predictionSchema.version,

          // Parsed prediction data
          parsedId: parsedPredictionSchema.id,
          goal: parsedPredictionSchema.goal,
          timeframe: parsedPredictionSchema.timeframe,
          llmConfidence: parsedPredictionSchema.llmConfidence,
          vagueness: parsedPredictionSchema.vagueness,
          context: parsedPredictionSchema.context,
          predictionQuality: parsedPredictionSchema.predictionQuality,
          briefRationale: parsedPredictionSchema.briefRationale,

          // Tweet data
          tweetId: scrapedTweetSchema.id,
          tweetText: scrapedTweetSchema.text,
          tweetDate: scrapedTweetSchema.date,

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
        })
        .from(predictionSchema)
        .innerJoin(
          parsedPredictionSchema,
          eq(parsedPredictionSchema.predictionId, predictionSchema.id),
        )
        .innerJoin(
          scrapedTweetSchema,
          sql`${scrapedTweetSchema.id} = CAST(CAST(${parsedPredictionSchema.goal} AS jsonb)->0->'source'->>'tweet_id' AS BIGINT)`,
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
        .where(
          and(
            eq(
              sql`LOWER(${twitterUsersSchema.username})`,
              username.toLowerCase(),
            ),
            eq(twitterUsersSchema.tracked, true),
            isNull(parsedPredictionFeedbackSchema.parsedPredictionId),
          ),
        )
        .orderBy(desc(predictionSchema.createdAt))
        .offset(offset);

      return groupPredictionsByTweet(rawPredictions as RawPrediction[]);
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
          predictionCreatedAt: predictionSchema.createdAt,
          predictionVersion: predictionSchema.version,

          // Parsed prediction data
          parsedId: parsedPredictionSchema.id,
          goal: parsedPredictionSchema.goal,
          timeframe: parsedPredictionSchema.timeframe,
          llmConfidence: parsedPredictionSchema.llmConfidence,
          vagueness: parsedPredictionSchema.vagueness,
          context: parsedPredictionSchema.context,
          predictionQuality: parsedPredictionSchema.predictionQuality,
          briefRationale: parsedPredictionSchema.briefRationale,

          // Tweet data
          tweetId: scrapedTweetSchema.id,
          tweetText: scrapedTweetSchema.text,
          tweetDate: scrapedTweetSchema.date,

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
        })
        .from(predictionSchema)
        .innerJoin(
          parsedPredictionSchema,
          eq(parsedPredictionSchema.predictionId, predictionSchema.id),
        )
        .innerJoin(
          scrapedTweetSchema,
          sql`${scrapedTweetSchema.id} = CAST(CAST(${parsedPredictionSchema.goal} AS jsonb)->0->'source'->>'tweet_id' AS BIGINT)`,
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
        .where(
          and(
            eq(twitterUsersSchema.tracked, true),
            isNull(parsedPredictionFeedbackSchema.parsedPredictionId),
          ),
        )
        .orderBy(desc(predictionSchema.createdAt))
        .limit(limit)
        .offset(offset);

      return groupPredictionsByTweet(rawPredictions as RawPrediction[]);
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

      // Count all predictions grouped by verdict status
      const counts = await ctx.db
        .select({
          verdictStatus: sql<string | null>`CASE
            WHEN ${verdictSchema.id} IS NULL THEN 'ongoing'
            WHEN ${verdictSchema.verdict} = true THEN 'true'
            WHEN ${verdictSchema.verdict} = false THEN 'false'
          END`.as("verdict_status"),
          count: sql<number>`COUNT(DISTINCT ${parsedPredictionSchema.id})`,
        })
        .from(predictionSchema)
        .innerJoin(
          parsedPredictionSchema,
          eq(parsedPredictionSchema.predictionId, predictionSchema.id),
        )
        .innerJoin(
          scrapedTweetSchema,
          sql`${scrapedTweetSchema.id} = CAST(CAST(${parsedPredictionSchema.goal} AS jsonb)->0->'source'->>'tweet_id' AS BIGINT)`,
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
        .where(
          and(
            eq(
              sql`LOWER(${twitterUsersSchema.username})`,
              username.toLowerCase(),
            ),
            eq(twitterUsersSchema.tracked, true),
            isNull(parsedPredictionFeedbackSchema.parsedPredictionId),
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
      }),
    )
    .query(async ({ ctx, input }) => {
      const { username, verdictStatus, limit, offset } = input;

      const rawPredictions = await ctx.db
        .select({
          predictionId: predictionSchema.id,
          predictionCreatedAt: predictionSchema.createdAt,
          predictionVersion: predictionSchema.version,
          parsedId: parsedPredictionSchema.id,
          goal: parsedPredictionSchema.goal,
          timeframe: parsedPredictionSchema.timeframe,
          llmConfidence: parsedPredictionSchema.llmConfidence,
          vagueness: parsedPredictionSchema.vagueness,
          context: parsedPredictionSchema.context,
          predictionQuality: parsedPredictionSchema.predictionQuality,
          briefRationale: parsedPredictionSchema.briefRationale,
          tweetId: scrapedTweetSchema.id,
          tweetText: scrapedTweetSchema.text,
          tweetDate: scrapedTweetSchema.date,
          userId: twitterUsersSchema.id,
          username: twitterUsersSchema.username,
          screenName: twitterUsersSchema.screenName,
          avatarUrl: twitterUsersSchema.avatarUrl,
          isVerified: twitterUsersSchema.isVerified,
          verdictId: verdictSchema.id,
          verdict: verdictSchema.verdict,
          verdictContext: verdictSchema.context,
          verdictCreatedAt: verdictSchema.createdAt,
        })
        .from(predictionSchema)
        .innerJoin(
          parsedPredictionSchema,
          eq(parsedPredictionSchema.predictionId, predictionSchema.id),
        )
        .innerJoin(
          scrapedTweetSchema,
          sql`${scrapedTweetSchema.id} = CAST(CAST(${parsedPredictionSchema.goal} AS jsonb)->0->'source'->>'tweet_id' AS BIGINT)`,
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
        .where(
          and(
            eq(
              sql`LOWER(${twitterUsersSchema.username})`,
              username.toLowerCase(),
            ),
            eq(twitterUsersSchema.tracked, true),
            isNull(parsedPredictionFeedbackSchema.parsedPredictionId),
            verdictStatus === "ongoing"
              ? isNull(verdictSchema.id)
              : verdictStatus === "true"
                ? eq(verdictSchema.verdict, true)
                : eq(verdictSchema.verdict, false),
          ),
        )
        .orderBy(desc(predictionSchema.createdAt))
        .limit(limit)
        .offset(offset);

      return groupPredictionsByTweet(rawPredictions as RawPrediction[]);
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
      }),
    )
    .query(async ({ ctx, input }) => {
      const { verdictStatus, limit, offset } = input;

      const rawPredictions = await ctx.db
        .select({
          predictionId: predictionSchema.id,
          predictionCreatedAt: predictionSchema.createdAt,
          predictionVersion: predictionSchema.version,
          parsedId: parsedPredictionSchema.id,
          goal: parsedPredictionSchema.goal,
          timeframe: parsedPredictionSchema.timeframe,
          llmConfidence: parsedPredictionSchema.llmConfidence,
          vagueness: parsedPredictionSchema.vagueness,
          context: parsedPredictionSchema.context,
          predictionQuality: parsedPredictionSchema.predictionQuality,
          briefRationale: parsedPredictionSchema.briefRationale,
          tweetId: scrapedTweetSchema.id,
          tweetText: scrapedTweetSchema.text,
          tweetDate: scrapedTweetSchema.date,
          userId: twitterUsersSchema.id,
          username: twitterUsersSchema.username,
          screenName: twitterUsersSchema.screenName,
          avatarUrl: twitterUsersSchema.avatarUrl,
          isVerified: twitterUsersSchema.isVerified,
          verdictId: verdictSchema.id,
          verdict: verdictSchema.verdict,
          verdictContext: verdictSchema.context,
          verdictCreatedAt: verdictSchema.createdAt,
        })
        .from(predictionSchema)
        .innerJoin(
          parsedPredictionSchema,
          eq(parsedPredictionSchema.predictionId, predictionSchema.id),
        )
        .innerJoin(
          scrapedTweetSchema,
          sql`${scrapedTweetSchema.id} = CAST(CAST(${parsedPredictionSchema.goal} AS jsonb)->0->'source'->>'tweet_id' AS BIGINT)`,
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
        .where(
          and(
            eq(twitterUsersSchema.tracked, true),
            isNull(parsedPredictionFeedbackSchema.parsedPredictionId),
            verdictStatus === "ongoing"
              ? isNull(verdictSchema.id)
              : verdictStatus === "true"
                ? eq(verdictSchema.verdict, true)
                : eq(verdictSchema.verdict, false),
          ),
        )
        .orderBy(desc(predictionSchema.createdAt))
        .limit(limit)
        .offset(offset);

      return groupPredictionsByTweet(rawPredictions as RawPrediction[]);
    }),

  /**
   * Get feed prediction counts
   */
  getFeedCounts: publicProcedure.query(async ({ ctx }) => {
    const counts = await ctx.db
      .select({
        verdictStatus: sql<string | null>`CASE
          WHEN ${verdictSchema.id} IS NULL THEN 'ongoing'
          WHEN ${verdictSchema.verdict} = true THEN 'true'
          WHEN ${verdictSchema.verdict} = false THEN 'false'
        END`.as("verdict_status"),
        count: sql<number>`COUNT(DISTINCT ${parsedPredictionSchema.id})`,
      })
      .from(predictionSchema)
      .innerJoin(
        parsedPredictionSchema,
        eq(parsedPredictionSchema.predictionId, predictionSchema.id),
      )
      .innerJoin(
        scrapedTweetSchema,
        sql`${scrapedTweetSchema.id} = CAST(CAST(${parsedPredictionSchema.goal} AS jsonb)->0->'source'->>'tweet_id' AS BIGINT)`,
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
      .where(
        and(
          eq(twitterUsersSchema.tracked, true),
          isNull(parsedPredictionFeedbackSchema.parsedPredictionId),
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
   * Get predictions by topic ID
   *
   * Fetches predictions filtered by a specific topic/ticker.
   */
  getByTopic: publicProcedure
    .input(
      z.object({
        topicId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { topicId, limit, offset } = input;

      const rawPredictions = await ctx.db
        .select({
          // Prediction data
          predictionId: predictionSchema.id,
          predictionCreatedAt: predictionSchema.createdAt,
          predictionVersion: predictionSchema.version,

          // Parsed prediction data
          parsedId: parsedPredictionSchema.id,
          goal: parsedPredictionSchema.goal,
          timeframe: parsedPredictionSchema.timeframe,
          llmConfidence: parsedPredictionSchema.llmConfidence,
          vagueness: parsedPredictionSchema.vagueness,
          context: parsedPredictionSchema.context,
          predictionQuality: parsedPredictionSchema.predictionQuality,
          briefRationale: parsedPredictionSchema.briefRationale,

          // Tweet data
          tweetId: scrapedTweetSchema.id,
          tweetText: scrapedTweetSchema.text,
          tweetDate: scrapedTweetSchema.date,

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
        })
        .from(predictionSchema)
        .innerJoin(
          parsedPredictionSchema,
          eq(parsedPredictionSchema.predictionId, predictionSchema.id),
        )
        .innerJoin(
          scrapedTweetSchema,
          sql`${scrapedTweetSchema.id} = CAST(CAST(${parsedPredictionSchema.goal} AS jsonb)->0->'source'->>'tweet_id' AS BIGINT)`,
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
        .where(
          and(
            eq(parsedPredictionSchema.topicId, topicId),
            eq(twitterUsersSchema.tracked, true),
            isNull(parsedPredictionFeedbackSchema.parsedPredictionId),
          ),
        )
        .orderBy(desc(predictionSchema.createdAt))
        .limit(limit)
        .offset(offset);

      return groupPredictionsByTweet(rawPredictions as RawPrediction[]);
    }),
} satisfies TRPCRouterRecord;
