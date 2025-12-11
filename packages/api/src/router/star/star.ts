import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  notExists,
  or,
  sql,
} from "@torus-ts/db";
import {
  parsedPredictionFeedbackSchema,
  parsedPredictionSchema,
  predictionSchema,
  scrapedTweetSchema,
  twitterUsersSchema,
  userStarsSchema,
  verdictSchema,
} from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { authenticatedProcedure, publicProcedure } from "../../trpc";
import type { RawPrediction } from "../prediction/prediction";
import { groupPredictionsByTweetSimple } from "../prediction/prediction";

export const starRouter = {
  /**
   * Check if a user has starred a specific tweet
   */
  getStarStatus: publicProcedure
    .input(z.object({ tweetId: z.string(), userKey: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({ id: userStarsSchema.id })
        .from(userStarsSchema)
        .where(
          and(
            eq(userStarsSchema.userKey, input.userKey),
            eq(userStarsSchema.tweetId, BigInt(input.tweetId)),
          ),
        )
        .limit(1);

      return { isStarred: result.length > 0 };
    }),

  /**
   * Get count of how many tweets a user has starred
   */
  getStarredCount: publicProcedure
    .input(z.object({ userKey: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({ count: count() })
        .from(userStarsSchema)
        .where(eq(userStarsSchema.userKey, input.userKey));

      return result[0]?.count ?? 0;
    }),

  /**
   * Star a tweet
   */
  star: authenticatedProcedure
    .input(z.object({ tweetId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(userStarsSchema)
        .values({
          userKey: ctx.sessionData.userKey,
          tweetId: BigInt(input.tweetId),
        })
        .onConflictDoNothing();

      return { success: true };
    }),

  /**
   * Unstar a tweet
   */
  unstar: authenticatedProcedure
    .input(z.object({ tweetId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(userStarsSchema)
        .where(
          and(
            eq(userStarsSchema.userKey, ctx.sessionData.userKey),
            eq(userStarsSchema.tweetId, BigInt(input.tweetId)),
          ),
        );

      return { success: true };
    }),

  /**
   * Get predictions from starred tweets filtered by verdict status
   */
  getStarredFeedByVerdict: publicProcedure
    .input(
      z.object({
        userKey: z.string(),
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
        userKey,
        verdictStatus,
        limit,
        offset,
        dateFrom,
        dateTo,
        topicIds,
      } = input;

      // Get starred tweet IDs
      const starredTweets = await ctx.db
        .select({ tweetId: userStarsSchema.tweetId })
        .from(userStarsSchema)
        .where(eq(userStarsSchema.userKey, userKey));

      if (starredTweets.length === 0) {
        return [];
      }

      const starredTweetIds = starredTweets.map((s) => s.tweetId);

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
          filterAgentId: parsedPredictionSchema.filterAgentId,
          canonicalId: sql<string | null>`NULL`,
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
          parsedPredictionFeedbackSchema,
          eq(
            parsedPredictionFeedbackSchema.parsedPredictionId,
            parsedPredictionSchema.id,
          ),
        )
        .where(
          and(
            inArray(scrapedTweetSchema.id, starredTweetIds),
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

      return await groupPredictionsByTweetSimple(
        rawPredictions as RawPrediction[],
        ctx,
      );
    }),

  /**
   * Get prediction counts for starred tweets by verdict status
   */
  getStarredFeedCounts: publicProcedure
    .input(
      z.object({
        userKey: z.string(),
        dateFrom: z.string().datetime().optional(),
        dateTo: z.string().datetime().optional(),
        topicIds: z.array(z.string()).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Get starred tweet IDs
      const starredTweets = await ctx.db
        .select({ tweetId: userStarsSchema.tweetId })
        .from(userStarsSchema)
        .where(eq(userStarsSchema.userKey, input.userKey));

      if (starredTweets.length === 0) {
        return { ongoing: 0, true: 0, false: 0 };
      }

      const starredTweetIds = starredTweets.map((s) => s.tweetId);

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
        .where(
          and(
            inArray(scrapedTweetSchema.id, starredTweetIds),
            input.dateFrom
              ? gte(scrapedTweetSchema.date, new Date(input.dateFrom))
              : undefined,
            input.dateTo
              ? lte(scrapedTweetSchema.date, new Date(input.dateTo))
              : undefined,
            input.topicIds && input.topicIds.length > 0
              ? sql`${parsedPredictionSchema.topicId} IN (${sql.join(
                  input.topicIds.map((id) => sql`${id}`),
                  sql`, `,
                )})`
              : undefined,
          ),
        )
        .groupBy(sql`verdict_status`);

      const result = { ongoing: 0, true: 0, false: 0 };
      counts.forEach((row) => {
        if (row.verdictStatus === "ongoing") result.ongoing = Number(row.count);
        if (row.verdictStatus === "true") result.true = Number(row.count);
        if (row.verdictStatus === "false") result.false = Number(row.count);
      });

      return result;
    }),
} satisfies TRPCRouterRecord;
