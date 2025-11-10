import { sql } from "@torus-ts/db";
import {
  twitterScrapingJobsSchema,
  twitterUsersSchema,
  twitterUserSuggestionsSchema,
} from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
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

      if (item.isTracked) {
        status = "complete";
      } else if (item.tweetCount && item.tweetCount > 0) {
        status = "processing";
      } else if (item.hasScrapingJob || item.userId) {
        status = "scraping";
      } else {
        status = "suggested";
      }

      return {
        ...item,
        status,
        predictionCount: 0,
        verdictCount: 0,
      };
    });

    return enrichedQueue;
  }),
} satisfies TRPCRouterRecord;
