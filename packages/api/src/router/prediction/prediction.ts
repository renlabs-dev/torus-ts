import { and, desc, eq, sql } from "@torus-ts/db";
import {
  parsedPredictionSchema,
  predictionSchema,
  scrapedTweetSchema,
  twitterUsersSchema,
  verdictSchema,
} from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../trpc";

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

      // Join predictions with parsed predictions, tweets, users, and verdicts
      const predictions = await ctx.db
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
        .where(
          and(
            eq(
              sql`LOWER(${twitterUsersSchema.username})`,
              username.toLowerCase(),
            ),
            eq(twitterUsersSchema.tracked, true),
          ),
        )
        .orderBy(desc(predictionSchema.createdAt))
        .offset(offset);

      return predictions;
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
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, offset } = input;

      const predictions = await ctx.db
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
        .where(eq(twitterUsersSchema.tracked, true))
        .orderBy(desc(predictionSchema.createdAt))
        .limit(limit)
        .offset(offset);

      return predictions;
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

      const predictions = await ctx.db
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
        .where(
          and(
            eq(parsedPredictionSchema.topicId, topicId),
            eq(twitterUsersSchema.tracked, true),
          ),
        )
        .orderBy(desc(predictionSchema.createdAt))
        .limit(limit)
        .offset(offset);

      return predictions;
    }),
} satisfies TRPCRouterRecord;
