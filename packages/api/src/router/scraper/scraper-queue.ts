import { eq, sql } from "@torus-ts/db";
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
    // Get all suggested users with their metrics
    const queue = await ctx.db
      .select({
        username: twitterUserSuggestionsSchema.username,
        suggestedBy: twitterUserSuggestionsSchema.wallet,
        suggestedAt: twitterUserSuggestionsSchema.createdAt,

        // User data (if profile created)
        userId: twitterUsersSchema.id,
        screenName: twitterUsersSchema.screenName,
        avatarUrl: twitterUsersSchema.avatarUrl,
        isTracked: twitterUsersSchema.tracked,

        // Scraping job status
        hasScrapingJob: sql<boolean>`${twitterScrapingJobsSchema.userId} IS NOT NULL`,

        // Progress metrics - use tweetCount from user profile if available
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

    // Determine status for each user
    const enrichedQueue = queue.map((item) => {
      let status: "suggested" | "scraping" | "processing" | "complete";

      if (item.isTracked) {
        // User is tracked, scraping complete
        status = "complete";
      } else if (item.tweetCount && item.tweetCount > 0) {
        // Has tweets but not tracked yet, still processing
        status = "processing";
      } else if (item.userId || item.hasScrapingJob) {
        // Profile exists or scraping job active
        status = "scraping";
      } else {
        // Just suggested, not started yet
        status = "suggested";
      }

      return {
        ...item,
        status,
        predictionCount: 0, // TODO: Add if needed
        verdictCount: 0, // TODO: Add if needed
      };
    });

    return enrichedQueue;
  }),
} satisfies TRPCRouterRecord;
