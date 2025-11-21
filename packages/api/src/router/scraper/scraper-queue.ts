/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { and, eq, gt, isNotNull, isNull, not, or, sql } from "@torus-ts/db";
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
        newestTrackedTweet: twitterUsersSchema.newestTrackedTweet,

        hasScrapingJob: sql<boolean>`${twitterScrapingJobsSchema.userId} IS NOT NULL`,

        status: sql<string>`
      CASE
        WHEN ${twitterScrapingJobsSchema.userId} IS NOT NULL
             OR ${twitterUsersSchema.scrapedAt} IS NULL
          THEN 'scraping'

        WHEN ${twitterUsersSchema.scrapedAt} < NOW() - INTERVAL '1 day'
             AND ${twitterUsersSchema.newestTrackedTweet} IS NOT NULL
          THEN 'updating'

        WHEN ${twitterScrapingJobsSchema.userId} IS NULL
             AND ${twitterUsersSchema.scrapedAt} IS NOT NULL
          THEN 'complete'

        ELSE 'suggested'
      END
    `.as("status"),
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
      .where(
        and(
          or(
            isNull(twitterUserSuggestionsSchema.deletedAt),
            eq(twitterUsersSchema.tracked, true),
          ),
          or(
            isNull(twitterUsersSchema.scrapedAt),
            and(
              isNotNull(twitterUsersSchema.tweetCount),
              gt(twitterUsersSchema.tweetCount, 0),
            ),
          ),
        ),
      )
      .orderBy(sql`${twitterUserSuggestionsSchema.createdAt} DESC`);

    const enrichedQueue = queue.map((item) => ({
      ...item,
      predictionCount: 0,
      verdictCount: 0,
    }));

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
