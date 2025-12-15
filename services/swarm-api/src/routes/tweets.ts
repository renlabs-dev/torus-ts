import { and, eq, gt, inArray, notExists, or, sql } from "@torus-ts/db";
import {
  parsedPredictionSchema,
  scrapedTweetSchema,
  twitterScrapingJobsSchema,
  twitterUsersSchema,
} from "@torus-ts/db/schema";
import { authPlugin } from "../middleware/auth";
import type { ContextApp } from "../middleware/context";
import { getTweetsNextQuerySchema } from "../schemas/tweets";
import { cursorSchema, encodeCursor } from "../utils/cursor";

export const tweetsRouter = (app: ContextApp) =>
  app.use(authPlugin).group("/v1", (app) =>
    app.get(
      "/getTweetsNext",
      async ({ query, db, userKey }) => {
        const fromData = cursorSchema.parse(query.from);
        const limit = query.limit;
        const excludeProcessedByAgent = query.excludeProcessedByAgent;

        const createdAt = sql<number>`EXTRACT(EPOCH FROM ${scrapedTweetSchema.createdAt}) * 1000000`;

        const greaterThanCursor = or(
          gt(createdAt, fromData.createdAt),
          and(
            eq(createdAt, fromData.createdAt),
            gt(scrapedTweetSchema.id, fromData.id),
          ),
        );

        const conversationScraped = notExists(
          db
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
          db.select({ id: twitterUsersSchema.id }).from(twitterUsersSchema),
        );

        const notProcessedByAgent = (agentAddress: string) =>
          notExists(
            db
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

        if (excludeProcessedByAgent) {
          conditions.push(notProcessedByAgent(userKey));
        }

        const tweets = await db
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
          .limit(limit);

        const tweetConversationMap = new Map<bigint, bigint>();
        const conversationIds = tweets
          .map((tweet) => {
            if (tweet.conversationId) {
              tweetConversationMap.set(tweet.id, tweet.conversationId);
            }
            return tweet.conversationId;
          })
          .filter((id) => id !== null);

        let allContextTweets: typeof tweets = [];
        if (conversationIds.length > 0) {
          allContextTweets = await db
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

        const tweetsByConversation = new Map<
          bigint,
          Map<bigint, (typeof allContextTweets)[number]>
        >();
        for (const ctxTweet of allContextTweets) {
          if (!ctxTweet.conversationId) continue;
          let convMap = tweetsByConversation.get(ctxTweet.conversationId);
          if (!convMap) {
            convMap = new Map();
            tweetsByConversation.set(ctxTweet.conversationId, convMap);
          }
          convMap.set(ctxTweet.id, ctxTweet);
        }

        const buildReplyChain = (
          tweetId: bigint,
          allTweets: Map<bigint, (typeof allContextTweets)[number]>,
        ): (typeof allContextTweets)[number][] => {
          const chain: (typeof allContextTweets)[number][] = [];
          let currentId: bigint | null = tweetId;

          while (currentId !== null) {
            const tweet = allTweets.get(currentId);
            if (!tweet) break;
            chain.unshift(tweet);
            currentId = tweet.parentTweetId;
          }

          return chain;
        };

        const result = [];
        for (const tweet of tweets) {
          const conversationId = tweetConversationMap.get(tweet.id);
          const convTweetsMap = conversationId
            ? tweetsByConversation.get(conversationId)
            : undefined;

          const replyChain = convTweetsMap
            ? buildReplyChain(tweet.id, convTweetsMap)
            : [];

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

          for (const ctxTweet of replyChain) {
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
          hasMore: tweets.length === limit,
        };
      },
      {
        query: getTweetsNextQuerySchema,
      },
    ),
  );
