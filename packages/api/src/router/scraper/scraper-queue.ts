/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { sql } from "@torus-ts/db";
import {
  twitterScrapingJobsSchema,
  twitterUsersSchema,
  twitterUserSuggestionsSchema,
} from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../trpc";

/**
 * Scraper queue router - handles operations for viewing scraping progress
 */
export const scraperQueueRouter = {
  /**
   * Get scraping queue status for all suggested users
   *
   * Returns progress information for each user in the pipeline
   */
  getQueueStatus: publicProcedure.query(async ({ ctx }) => {
    const queue = await ctx.db
      .select({
        username: twitterUserSuggestionsSchema.username,
        suggestedBy: twitterUserSuggestionsSchema.wallet,
        suggestedAt: twitterUserSuggestionsSchema.createdAt,

        userId: twitterUsersSchema.id,
        screenName: twitterUsersSchema.screenName,
        avatarUrl: twitterUsersSchema.avatarUrl,
        isTracked: twitterUsersSchema.tracked,
        scrapedAt: twitterUsersSchema.scrapedAt,

        hasScrapingJob: sql<boolean>`${twitterScrapingJobsSchema.userId} IS NOT NULL`,

        tweetCount: twitterUsersSchema.tweetCount,
      })
      .from(twitterUserSuggestionsSchema)
      .leftJoin(
        twitterUsersSchema,
        sql`LOWER(${twitterUsersSchema.username}) = LOWER(${twitterUserSuggestionsSchema.username})`,
      )
      .leftJoin(
        twitterScrapingJobsSchema,
        sql`${twitterScrapingJobsSchema.userId} = ${twitterUsersSchema.id}`,
      )
      .orderBy(sql`${twitterUserSuggestionsSchema.createdAt} DESC`);

    const enrichedQueue = queue.map((item) => {
      let status: "suggested" | "scraping" | "processing" | "complete";

      if (
        item.hasScrapingJob ||
        (item.userId && (!item.tweetCount || item.tweetCount === 0))
      ) {
        // 2. Scraping - Profile exists, collecting tweets
        status = "scraping";
      } else if (item.tweetCount && item.tweetCount > 0 && !item.isTracked) {
        // 3. Processing - Has tweets, generating predictions/verdicts
        status = "processing";
      } else if (item.isTracked && item.scrapedAt !== null) {
        // 4. Complete - User is tracked and scraped
        status = "complete";
      } else {
        // 1. Suggested - In queue only
        status = "suggested";
      }

      return {
        ...item,
        status,
        predictionCount: 0,
        verdictCount: 0,
        needsVerdictCheck:
          item.tweetCount && item.tweetCount > 0 && !item.isTracked,
      };
    });

    return enrichedQueue;
  }),

  /**
   * Check if user has pending verdicts (expensive query, call separately)
   */
  checkPendingVerdicts: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = BigInt(input.userId);

      const result = await ctx.db.execute(
        sql`
          SELECT COUNT(DISTINCT pp.id)::int AS count
          FROM parsed_prediction pp
          INNER JOIN scraped_tweet st ON CAST(CAST(pp.target AS jsonb)->0->'source'->>'tweet_id' AS BIGINT) = st.id
          LEFT JOIN verdict v ON v.parsed_prediction_id = pp.id
          WHERE st.author_id = ${userId} AND v.id IS NULL
        `,
      );

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-explicit-any
      const pendingCount = ((result[0] as any)?.count as number) ?? 0;

      return {
        hasPending: pendingCount > 0,
        pendingCount,
        isComplete: pendingCount === 0,
      };
    }),
} satisfies TRPCRouterRecord;
