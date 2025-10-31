import { and, eq, ilike, isNull, sql } from "@torus-ts/db";
import {
  parsedPredictionFeedbackSchema,
  parsedPredictionSchema,
  predictionSchema,
  scrapedTweetSchema,
  twitterUsersSchema,
  twitterUserSuggestionsSchema,
  verdictSchema,
} from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { authenticatedProcedure, publicProcedure } from "../../trpc";

/**
 * Twitter user router - handles operations for searching and retrieving Twitter user data
 */
export const twitterUserRouter = {
  /**
   * Search Twitter users by username with partial/substring matching
   *
   * Performs case-insensitive substring search on usernames.
   * Only returns tracked users that are not unavailable.
   *
   * @returns Array of matching Twitter users with basic info
   */
  search: publicProcedure
    .input(
      z.object({
        query: z
          .string()
          .min(1, "Search query must be at least 1 character")
          .max(50, "Search query is too long"),
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { query, limit } = input;

      // Perform case-insensitive substring search
      // Use ILIKE for PostgreSQL case-insensitive search
      const users = await ctx.db
        .select({
          userId: twitterUsersSchema.id,
          username: twitterUsersSchema.username,
          screenName: twitterUsersSchema.screenName,
          description: twitterUsersSchema.description,
          avatarUrl: twitterUsersSchema.avatarUrl,
          isVerified: twitterUsersSchema.isVerified,
          verifiedType: twitterUsersSchema.verifiedType,
          followerCount: twitterUsersSchema.followerCount,
        })
        .from(twitterUsersSchema)
        .where(ilike(twitterUsersSchema.username, `%${query}%`))
        .limit(limit);

      return users;
    }),

  /**
   * Get a specific Twitter user by username
   *
   * @returns Twitter user data or null if not found
   */
  getByUsername: publicProcedure
    .input(
      z.object({
        username: z
          .string()
          .min(1, "Username is required")
          .transform((val) => (val.startsWith("@") ? val.slice(1) : val)),
      }),
    )
    .query(async ({ ctx, input }) => {
      const users = await ctx.db
        .select()
        .from(twitterUsersSchema)
        .where(ilike(twitterUsersSchema.username, input.username))
        .limit(1);

      return users[0] ?? null;
    }),

  /**
   * Suggest a Twitter user to be added to the swarm
   *
   * Creates a suggestion record linking the authenticated user's wallet
   * to a Twitter username they want tracked.
   */
  suggestUser: authenticatedProcedure
    .input(
      z.object({
        username: z
          .string()
          .min(1, "Username is required")
          .max(15, "Username too long")
          .transform((val) => (val.startsWith("@") ? val.slice(1) : val)),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userKey = ctx.sessionData.userKey;
      await ctx.db.insert(twitterUserSuggestionsSchema).values({
        username: input.username,
        wallet: userKey,
      });
    }),

  /**
   * Check if user is being scraped (in suggestions but not in twitter_users)
   */
  getScrapingStatus: publicProcedure
    .input(
      z.object({
        username: z
          .string()
          .min(1)
          .transform((val) => (val.startsWith("@") ? val.slice(1) : val)),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Check if user exists in twitter_users
      const existingUsers = await ctx.db
        .select()
        .from(twitterUsersSchema)
        .where(ilike(twitterUsersSchema.username, input.username))
        .limit(1);

      if (existingUsers[0]) {
        return { status: "ready" as const, username: input.username };
      }

      // Check if user is in suggestions (being scraped)
      const suggestions = await ctx.db
        .select()
        .from(twitterUserSuggestionsSchema)
        .where(ilike(twitterUserSuggestionsSchema.username, input.username))
        .limit(1);

      if (suggestions[0]) {
        return { status: "scraping" as const, username: input.username };
      }

      return { status: "not_found" as const, username: input.username };
    }),

  /**
   * Get top predictors ranked by accuracy
   *
   * Calculates accuracy for each user based on their verdicted predictions
   * and returns users sorted by accuracy percentage.
   */
  getTopPredictors: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        minPredictions: z.number().min(1).default(5),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, minPredictions } = input;

      // Get all predictions with verdicts grouped by user
      const userStats = await ctx.db
        .select({
          userId: twitterUsersSchema.id,
          username: twitterUsersSchema.username,
          screenName: twitterUsersSchema.screenName,
          avatarUrl: twitterUsersSchema.avatarUrl,
          isVerified: twitterUsersSchema.isVerified,
          followerCount: twitterUsersSchema.followerCount,
          totalPredictions: sql<number>`COUNT(DISTINCT ${parsedPredictionSchema.id})`,
          verdictedPredictions: sql<number>`COUNT(DISTINCT CASE WHEN ${verdictSchema.id} IS NOT NULL THEN ${parsedPredictionSchema.id} END)`,
          truePredictions: sql<number>`COUNT(DISTINCT CASE WHEN ${verdictSchema.verdict} = true THEN ${parsedPredictionSchema.id} END)`,
        })
        .from(twitterUsersSchema)
        .innerJoin(
          scrapedTweetSchema,
          eq(scrapedTweetSchema.authorId, twitterUsersSchema.id),
        )
        .innerJoin(
          predictionSchema,
          sql`true`, // We'll filter via parsedPrediction
        )
        .innerJoin(
          parsedPredictionSchema,
          and(
            eq(parsedPredictionSchema.predictionId, predictionSchema.id),
            sql`${scrapedTweetSchema.id} = CAST(CAST(${parsedPredictionSchema.goal} AS jsonb)->0->'source'->>'tweet_id' AS BIGINT)`,
          ),
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
        .groupBy(
          twitterUsersSchema.id,
          twitterUsersSchema.username,
          twitterUsersSchema.screenName,
          twitterUsersSchema.avatarUrl,
          twitterUsersSchema.isVerified,
          twitterUsersSchema.followerCount,
        )
        .having(
          sql`COUNT(DISTINCT CASE WHEN ${verdictSchema.id} IS NOT NULL THEN ${parsedPredictionSchema.id} END) >= ${minPredictions}`,
        );

      // Calculate accuracy and score
      const topPredictors = userStats
        .map((user) => {
          const r = user.truePredictions;
          // verdictedPredictions includes both true and false
          // So n should just be verdictedPredictions, and w = n - r
          const n = user.verdictedPredictions;
          const w = n - r;

          const accuracy =
            user.verdictedPredictions > 0
              ? Math.round((r / n) * 100)
              : 0;

          // Score formula: (r / n) * log10(n + 1)
          const score =
            n > 0 ? (r / n) * Math.log10(n + 1) : 0;

          console.log(`${user.username}: r=${r}, n=${n}, accuracy=${accuracy}, score=${score}`);

          return {
            ...user,
            accuracy,
            score,
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return topPredictors;
    }),
} satisfies TRPCRouterRecord;
