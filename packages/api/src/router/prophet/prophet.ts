import { SwarmMemory } from "@torus-network/torus-utils/swarm-memory-client";
import { and, eq, gt, inArray, notExists, or, sql } from "@torus-ts/db";
import {
  parsedPredictionSchema,
  predictionSchema,
  predictionTopicSchema,
  scrapedTweetSchema,
  twitterScrapingJobsSchema,
  twitterUsersSchema,
} from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { requireNamespacePermission } from "../../middleware/namespace-permission";
import { authenticatedProcedure } from "../../trpc";

const filterPermissionProcedure = requireNamespacePermission([
  "prediction.filter",
]);

const TWITTER_USER_INSERT_SCHEMA = createInsertSchema(twitterUsersSchema).omit({
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

const PARSED_PREDICTION_INSERT_SCHEMA = createInsertSchema(
  parsedPredictionSchema,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

// Export types derived from schemas
export type ParsedPredictionInsert = z.infer<
  typeof PARSED_PREDICTION_INSERT_SCHEMA
>;

/**
 * Cursor schema for pagination.
 * Format: "microseconds_tweetId" (e.g., "1761695940615040_1234567890")
 */
const cursorSchema = z.string().transform((cursor, ctx) => {
  const lastUnderscore = cursor.lastIndexOf("_");
  if (lastUnderscore === -1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Cursor must be in format: microseconds_tweetId",
    });
    return z.NEVER;
  }

  const timestamp = cursor.substring(0, lastUnderscore);
  const id = cursor.substring(lastUnderscore + 1);

  if (!timestamp || !id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Cursor must be in format: microseconds_tweetId",
    });
    return z.NEVER;
  }

  try {
    return {
      createdAt: Number(timestamp),
      id: BigInt(id),
    };
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid microseconds or tweet ID in cursor",
    });
    return z.NEVER;
  }
});

/**
 * Encodes a tweet into a cursor string for pagination.
 */
export function encodeCursor(tweet: {
  createdAt: number;
  id: bigint | string;
}): string {
  return `${tweet.createdAt}_${tweet.id}`;
}

/**
 * Prophet router - handles operations for adding Twitter accounts to SwarmMemory
 */
export const prophetRouter = {
  /**
   * Add a new tracked Twitter user to the database
   *
   * Inserts a Twitter user into the twitter_users table.
   * Requires authentication.
   */
  addNewTwitterUser: authenticatedProcedure
    .input(TWITTER_USER_INSERT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .insert(twitterUsersSchema)
        .values(input)
        .returning();
      return result;
    }),

  /**
   * Add a Twitter username to SwarmMemory for scraping
   *
   * Creates a task to scrape all tweets from the specified user.
   * Requires authentication but uses server wallet for SwarmMemory operations.
   *
   * @returns Task creation result with taskId
   */

  addToMemory: authenticatedProcedure
    .input(
      z.object({
        username: z
          .string()
          .min(1, "Username is required")
          .transform((val) => (val.startsWith("@") ? val.slice(1) : val)),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // User is authenticated via ctx.sessionData.userKey

      // Validate SwarmMemory configuration is available
      if (!ctx.swarmMnemonic || !ctx.swarmApiUrl) {
        throw new Error(
          "SwarmMemory is not configured. Please provide swarmMnemonic and swarmApiUrl in tRPC context.",
        );
      }

      // Initialize SwarmMemory with server wallet
      // Remove trailing /api/ from baseUrl if present since SwarmMemory adds it
      const baseUrl = ctx.swarmApiUrl.replace(/\/api\/?$/, "");

      const client = await SwarmMemory.fromMnemonic({
        mnemonic: ctx.swarmMnemonic,
        baseUrl,
      });

      // Create scraping task
      const task = await client.tasks.createTask({
        task_type: "ScrapeAllTweetsOfUser",
        value: input.username,
        priority: 5,
      });

      return {
        success: true,
        username: input.username,
        taskId: task.id,
      };
    }),

  /**
   * Get next batch of tweets to process with cursor-based pagination.
   *
   * Returns tweets with status='DONE' starting from the cursor.
   * Each response contains the main tweet and its context tweets.
   * Requires authentication - caller's SS58 address is available in ctx.sessionData.userKey
   */
  getTweetsNext: filterPermissionProcedure
    .input(
      z.object({
        from: cursorSchema,
        limit: z.number().int().positive().default(10),
        excludeProcessedByAgent: z.boolean().optional().default(false),
      }),
    )
    .query(async ({ input, ctx }) => {
      const fromData = input.from;
      // TODO: stop using a bunch of subselects
      const createdAt = sql<number>`EXTRACT(EPOCH FROM ${scrapedTweetSchema.createdAt}) * 1000000`;

      const greaterThanCursor = or(
        gt(createdAt, fromData.createdAt),
        and(
          eq(createdAt, fromData.createdAt),
          gt(scrapedTweetSchema.id, fromData.id),
        ),
      );
      const conversationScraped = notExists(
        ctx.db
          .select()
          .from(twitterScrapingJobsSchema)
          .where(
            eq(
              twitterScrapingJobsSchema.conversationId,
              scrapedTweetSchema.conversationId,
            ),
          ),
      );
      const fromTrackedUser = inArray(
        scrapedTweetSchema.authorId,
        ctx.db.select({ id: twitterUsersSchema.id }).from(twitterUsersSchema),
      );
      const notProcessedByAgent = (agentAddress: string) =>
        notExists(
          ctx.db
            .select()
            .from(parsedPredictionSchema)
            .where(
              and(
                eq(
                  parsedPredictionSchema.predictionId,
                  scrapedTweetSchema.predictionId,
                ),
                eq(parsedPredictionSchema.filterAgentId, agentAddress),
              ),
            ),
        );

      const conditions = [
        greaterThanCursor,
        conversationScraped,
        fromTrackedUser,
      ];

      if (input.excludeProcessedByAgent) {
        const agentAddress = ctx.sessionData.userKey;
        conditions.push(notProcessedByAgent(agentAddress));
      }

      const tweets = await ctx.db
        .select({
          id: scrapedTweetSchema.id,
          text: scrapedTweetSchema.text,
          authorId: scrapedTweetSchema.authorId,
          date: scrapedTweetSchema.date,
          createdAt: createdAt,
          quotedId: scrapedTweetSchema.quotedId,
          conversationId: scrapedTweetSchema.conversationId,
          parentTweetId: scrapedTweetSchema.parentTweetId,
        })
        .from(scrapedTweetSchema)
        .where(and(...conditions))
        .orderBy(scrapedTweetSchema.createdAt, scrapedTweetSchema.id)
        .limit(input.limit);

      // Build map of tweetId -> conversationId
      const tweetConversationMap = new Map<bigint, bigint>();
      const conversationIds = tweets
        .map((t) => {
          if (t.conversationId) {
            tweetConversationMap.set(t.id, t.conversationId);
          }
          return t.conversationId;
        })
        .filter((id) => id !== null);

      // Fetch context tweets
      // TODO: query this in the same query that we get the tweets
      let allContextTweets: typeof tweets = [];
      if (conversationIds.length > 0) {
        allContextTweets = await ctx.db
          .select({
            id: scrapedTweetSchema.id,
            text: scrapedTweetSchema.text,
            authorId: scrapedTweetSchema.authorId,
            date: scrapedTweetSchema.date,
            createdAt: createdAt,
            quotedId: scrapedTweetSchema.quotedId,
            conversationId: scrapedTweetSchema.conversationId,
            parentTweetId: scrapedTweetSchema.parentTweetId,
          })
          .from(scrapedTweetSchema)
          .where(inArray(scrapedTweetSchema.conversationId, conversationIds));
      }

      // Group context tweets by conversationId
      const contextByConversation = new Map<bigint, typeof allContextTweets>();
      for (const ctxTweet of allContextTweets) {
        if (ctxTweet.conversationId) {
          const existing =
            contextByConversation.get(ctxTweet.conversationId) ?? [];
          existing.push(ctxTweet);
          contextByConversation.set(ctxTweet.conversationId, existing);
        }
      }

      // Build result
      const result = [];
      for (const tweet of tweets) {
        const conversationId = tweetConversationMap.get(tweet.id);
        const conversationTweets = conversationId
          ? (contextByConversation.get(conversationId) ?? [])
          : [];

        // Build context tweets for this conversation (exclude main tweet during building)
        const contextTweets: Record<
          string,
          {
            id: string;
            text: string;
            authorId: string;
            date: Date;
            quotedId: string | null;
            conversationId: string | null;
            parentTweetId: string | null;
          }
        > = {};

        for (const ctxTweet of conversationTweets) {
          if (ctxTweet.id !== tweet.id) {
            contextTweets[ctxTweet.id.toString()] = {
              id: ctxTweet.id.toString(),
              text: ctxTweet.text,
              authorId: ctxTweet.authorId.toString(),
              date: ctxTweet.date,
              quotedId: ctxTweet.quotedId?.toString() ?? null,
              conversationId: ctxTweet.conversationId?.toString() ?? null,
              parentTweetId: ctxTweet.parentTweetId?.toString() ?? null,
            };
          }
        }

        result.push({
          main: {
            id: tweet.id.toString(),
            text: tweet.text,
            authorId: tweet.authorId.toString(),
            date: tweet.date,
            quotedId: tweet.quotedId?.toString() ?? null,
            conversationId: tweet.conversationId?.toString() ?? null,
            parentTweetId: tweet.parentTweetId?.toString() ?? null,
          },
          context: contextTweets,
        });
      }

      const lastTweet = tweets[tweets.length - 1];
      const nextCursor = lastTweet ? encodeCursor(lastTweet) : null;

      return {
        tweets: result,
        nextCursor,
        hasMore: tweets.length === input.limit,
      };
    }),

  /**
   * Store extracted predictions with race-condition handling.
   *
   * Uses advisory locks to prevent duplicate prediction containers.
   * If predictionId already exists, reuses it and adds new parsedPrediction.
   * Automatically sets filterAgentId from authenticated user.
   * Called by the swarm-filter service after LLM extraction.
   */
  storePredictions: filterPermissionProcedure
    .input(
      z.array(
        z.object({
          tweetId: z.string(),
          prediction: PARSED_PREDICTION_INSERT_SCHEMA.omit({
            predictionId: true,
            topicId: true,
            filterAgentId: true,
          }).extend({
            topicName: z.string().min(1),
          }),
        }),
      ),
    )
    .mutation(async ({ input, ctx }) => {
      const agentAddress = ctx.sessionData.userKey;

      return await ctx.db.transaction(async (tx) => {
        if (input.length === 0) {
          return { inserted: 0 };
        }

        if (input.length > 500) {
          throw new Error(
            "Batch size too large. Maximum 500 predictions per request.",
          );
        }

        const tweetIds = input.map((i) => BigInt(i.tweetId));

        await tx.execute(sql`
          SELECT pg_advisory_xact_lock(id)
          FROM unnest(ARRAY[${sql.join(tweetIds, sql`, `)}]::bigint[]) as id
          ORDER BY id
        `);

        const uniqueTopicNames = [
          ...new Set(
            input.map((i) => i.prediction.topicName.toLowerCase().trim()),
          ),
        ];

        const existingTopics = await tx
          .select({
            id: predictionTopicSchema.id,
            name: predictionTopicSchema.name,
          })
          .from(predictionTopicSchema)
          .where(inArray(predictionTopicSchema.name, uniqueTopicNames));

        const topicMap = new Map(existingTopics.map((t) => [t.name, t.id]));

        const missingTopics = uniqueTopicNames.filter((n) => !topicMap.has(n));
        if (missingTopics.length > 0) {
          const newTopics = await tx
            .insert(predictionTopicSchema)
            .values(missingTopics.map((name) => ({ name })))
            .onConflictDoNothing()
            .returning();

          newTopics.forEach((t) => topicMap.set(t.name, t.id));

          // Re-fetch if onConflict hit
          if (newTopics.length < missingTopics.length) {
            const stillMissing = missingTopics.filter((n) => !topicMap.has(n));
            const refetched = await tx
              .select()
              .from(predictionTopicSchema)
              .where(inArray(predictionTopicSchema.name, stillMissing));
            refetched.forEach((t) => topicMap.set(t.name, t.id));
          }
        }

        const tweets = await tx
          .select({
            id: scrapedTweetSchema.id,
            predictionId: scrapedTweetSchema.predictionId,
          })
          .from(scrapedTweetSchema)
          .where(inArray(scrapedTweetSchema.id, tweetIds));

        const tweetMap = new Map(tweets.map((t) => [t.id.toString(), t]));

        const predictionIdMap = new Map<string, string>();

        // Separate tweets that already have predictions from those that need them
        const tweetsNeedingPredictions = input.filter((item) => {
          const tweet = tweetMap.get(item.tweetId);
          if (!tweet) {
            throw new Error(`Tweet ${item.tweetId} not found`);
          }

          if (tweet.predictionId) {
            predictionIdMap.set(item.tweetId, tweet.predictionId);
            return false;
          }
          return true;
        });

        if (tweetsNeedingPredictions.length > 0) {
          const newPredictions = await tx
            .insert(predictionSchema)
            .values(tweetsNeedingPredictions.map(() => ({ version: 1 })))
            .returning();

          // Map predictions to tweets
          tweetsNeedingPredictions.forEach((item, i) => {
            const prediction = newPredictions[i];
            if (!prediction) {
              throw new Error(
                `Failed to create prediction for tweet ${item.tweetId}`,
              );
            }
            predictionIdMap.set(item.tweetId, prediction.id);
          });

          // Batch UPDATE all tweets with raw SQL (1 query)
          await tx.execute(sql`
            UPDATE scraped_tweet
            SET prediction_id = data.pred_id
            FROM (VALUES ${sql.join(
              tweetsNeedingPredictions.map((item, i) => {
                const prediction = newPredictions[i];
                if (!prediction) {
                  throw new Error(
                    `Failed to create prediction for tweet ${item.tweetId}`,
                  );
                }
                return sql`(${BigInt(item.tweetId)}, ${prediction.id}::uuid)`;
              }),
              sql`, `,
            )}) AS data(tweet_id, pred_id)
            WHERE scraped_tweet.id = data.tweet_id
          `);
        }

        await tx.insert(parsedPredictionSchema).values(
          input.map((item) => {
            const topicName = item.prediction.topicName.toLowerCase().trim();
            const predictionId = predictionIdMap.get(item.tweetId);
            const topicId = topicMap.get(topicName);

            if (!predictionId || !topicId) {
              throw new Error(
                `Missing predictionId or topicId for tweet ${item.tweetId}`,
              );
            }

            return {
              predictionId,
              topicId,
              filterAgentId: agentAddress,
              goal: item.prediction.goal,
              timeframe: item.prediction.timeframe,
              predictionQuality: item.prediction.predictionQuality,
              briefRationale: item.prediction.briefRationale,
              llmConfidence: item.prediction.llmConfidence,
              vagueness: item.prediction.vagueness,
              context: item.prediction.context,
            };
          }),
        );

        return { inserted: input.length };
      });
    }),
} satisfies TRPCRouterRecord;
