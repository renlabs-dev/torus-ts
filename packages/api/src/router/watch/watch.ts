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
  userWatchesSchema,
  verdictSchema,
} from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { authenticatedProcedure, publicProcedure } from "../../trpc";
import type { RawPrediction } from "../prediction/prediction";
import { groupPredictionsByTweetSimple } from "../prediction/prediction";

export const watchRouter = {
  /**
   * Get the count of users watching a specific Twitter user
   */
  getWatcherCount: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({ count: count() })
        .from(userWatchesSchema)
        .where(eq(userWatchesSchema.watchedUserId, BigInt(input.userId)));

      return result[0]?.count ?? 0;
    }),

  /**
   * Check if a user is watching a specific Twitter user
   */
  getWatchStatus: publicProcedure
    .input(z.object({ userId: z.string(), userKey: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({ id: userWatchesSchema.id })
        .from(userWatchesSchema)
        .where(
          and(
            eq(userWatchesSchema.watcherKey, input.userKey),
            eq(userWatchesSchema.watchedUserId, BigInt(input.userId)),
          ),
        )
        .limit(1);

      return { isWatching: result.length > 0 };
    }),

  /**
   * Get count of how many users a user is watching
   */
  getWatchedCount: publicProcedure
    .input(z.object({ userKey: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({ count: count() })
        .from(userWatchesSchema)
        .where(eq(userWatchesSchema.watcherKey, input.userKey));

      return result[0]?.count ?? 0;
    }),

  /**
   * Get list of user IDs that a user is watching
   */
  getWatchedUserIds: publicProcedure
    .input(z.object({ userKey: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({ userId: userWatchesSchema.watchedUserId })
        .from(userWatchesSchema)
        .where(eq(userWatchesSchema.watcherKey, input.userKey));

      return result.map((r) => r.userId.toString());
    }),

  /**
   * Watch a Twitter user
   */
  watch: authenticatedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(userWatchesSchema)
        .values({
          watcherKey: ctx.sessionData.userKey,
          watchedUserId: BigInt(input.userId),
        })
        .onConflictDoNothing();

      return { success: true };
    }),

  /**
   * Unwatch a Twitter user
   */
  unwatch: authenticatedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(userWatchesSchema)
        .where(
          and(
            eq(userWatchesSchema.watcherKey, ctx.sessionData.userKey),
            eq(userWatchesSchema.watchedUserId, BigInt(input.userId)),
          ),
        );

      return { success: true };
    }),

  /**
   * Get predictions from watched users filtered by verdict status
   */
  getWatchingFeedByVerdict: publicProcedure
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

      // Get watched user IDs
      const watchedUsers = await ctx.db
        .select({ userId: userWatchesSchema.watchedUserId })
        .from(userWatchesSchema)
        .where(eq(userWatchesSchema.watcherKey, userKey));

      if (watchedUsers.length === 0) {
        return [];
      }

      const watchedUserIds = watchedUsers.map((w) => w.userId);

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
            inArray(twitterUsersSchema.id, watchedUserIds),
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
   * Get prediction counts for watched users by verdict status
   */
  getWatchingFeedCounts: publicProcedure
    .input(z.object({ userKey: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get watched user IDs
      const watchedUsers = await ctx.db
        .select({ userId: userWatchesSchema.watchedUserId })
        .from(userWatchesSchema)
        .where(eq(userWatchesSchema.watcherKey, input.userKey));

      if (watchedUsers.length === 0) {
        return { ongoing: 0, true: 0, false: 0 };
      }

      const watchedUserIds = watchedUsers.map((w) => w.userId);

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
        .where(inArray(twitterUsersSchema.id, watchedUserIds))
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
