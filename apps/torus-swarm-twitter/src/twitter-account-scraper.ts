import { AsyncLocalStorage } from "node:async_hooks";
import { BaseAPIError } from "@torus-network/torus-utils/base-api-client";
import type { DB, Transaction } from "@torus-ts/db/client";
import {
  scrapedTweetSchema,
  twitterScrapingJobsSchema,
  twitterUsersSchema,
  twitterUserSuggestionsSchema,
} from "@torus-ts/db/schema";
import type { ScrapedTweet } from "@torus-ts/db/schema";
import { and, asc, eq, gte, isNotNull, isNull, sql } from "drizzle-orm";
import { decode } from "html-entities";
import { logger } from "./index";
import type { KaitoTwitterAPI, SimpleTweet, User } from "./twitterapi-io";
import {
  KaitoRateLimitError,
  KaitoTwitterAPIError,
  KaitoValidationError,
} from "./twitterapi-io/utils/errors";
import { sleep } from "./utils";

const workerContext = new AsyncLocalStorage<{ workerId: number }>();

function logInfo(message: string, fields?: Record<string, unknown>): void {
  const context = workerContext.getStore();
  const prefix = context ? `[Worker ${context.workerId}]` : "";

  let formatted = message;
  if (fields) {
    const fieldStr = Object.entries(fields)
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      .map(([key, value]) => `${key}=${value}`)
      .join(" ");
    formatted = `${message} ${fieldStr}`;
  }

  logger.info(prefix ? `${prefix} ${formatted}` : formatted);
}

function logError(message: string, fields?: Record<string, unknown>): void {
  const context = workerContext.getStore();
  const prefix = context ? `[Worker ${context.workerId}]` : "";

  let formatted = message;
  if (fields) {
    const fieldStr = Object.entries(fields)
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      .map(([key, value]) => `${key}=${value}`)
      .join(" ");
    formatted = `${message} ${fieldStr}`;
  }

  logger.error(prefix ? `${prefix} ${formatted}` : formatted);
}

/**
 * Configuration for the Twitter Account Scraper worker
 */
export interface AccountScraperConfig {
  /** KaitoTwitterAPI client instance */
  twitterClient: KaitoTwitterAPI;
  /** Number of accounts to process concurrently (default: 3) */
  concurrency?: number;
  /** Delay between Twitter API calls in ms (default: 200) */
  apiDelay?: number;
  /** Maximum tweets to scrape per day (default: 200000) */
  dailyTweetLimit?: number;
  /** Enable debug logging */
  debugMode?: boolean;
}

/**
 * Twitter Account Scraper
 */
export class TwitterAccountScraper {
  private readonly config: Required<Omit<AccountScraperConfig, "debugMode">> & {
    debugMode: boolean;
  };

  private db: DB;

  constructor(config: AccountScraperConfig, db: DB) {
    this.config = {
      twitterClient: config.twitterClient,
      concurrency: config.concurrency ?? 3,
      apiDelay: config.apiDelay ?? 200,
      dailyTweetLimit: config.dailyTweetLimit ?? 200000,
      debugMode: config.debugMode ?? false,
    };

    this.db = db;
  }

  /**
   * Checks if daily tweet limit has been reached by querying tweets updated in the last 24 hours.
   */
  private async isDailyLimitReached(): Promise<boolean> {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(scrapedTweetSchema)
      .where(gte(scrapedTweetSchema.updatedAt, twentyFourHoursAgo));

    const count = result[0]?.count ?? 0;
    return count >= this.config.dailyTweetLimit;
  }

  /**
   * Hydrates incomplete user profiles by batch fetching from Twitter API.
   * Takes up to 100 stub users (id only, no username) and fills in their profile data.
   * This unlocks context for tweets from untracked users.
   */
  async processNextIncompleteUsers(tx: Transaction): Promise<boolean> {
    const incompleteUsers = await this.getNextIncompleteUsers(tx);
    if (!incompleteUsers.length) return false;

    logInfo("Selected incomplete profiles", { count: incompleteUsers.length });
    const infos = await this.config.twitterClient.users.batchGetInfo({
      userIds: incompleteUsers.map(({ id }) => String(id)),
    });

    const userMap = new Map<bigint, User>();
    for (const userInfo of infos) {
      if (!userInfo.unavailable) {
        userMap.set(BigInt(userInfo.id), userInfo);
      }
    }

    for (const incomplete of incompleteUsers) {
      const user = userMap.get(incomplete.id) || {
        unavailable: true,
        message: "user not found",
        unavailableReason: "user not found",
      };
      await this.upsertUserInfo(tx, user, incomplete.tracked, incomplete.id);
    }

    return true;
  }

  /**
   * Gets up to 100 incomplete users for batch hydration.
   * The limit is deliberate: Twitter charges 10 credits per user for batches of 100+,
   * vs 18 credits for smaller batches. Prioritizes tracked users first.
   */
  async getNextIncompleteUsers(tx: Transaction): Promise<
    {
      id: bigint;
      tracked: boolean;
    }[]
  > {
    return await tx
      .select({
        id: twitterUsersSchema.id,
        tracked: twitterUsersSchema.tracked,
      })
      .from(twitterUsersSchema)
      .where(
        and(
          isNull(twitterUsersSchema.username),
          isNull(twitterUsersSchema.unavailableReason),
          isNull(twitterUsersSchema.deletedAt),
        ),
      )
      .orderBy(
        sql`${twitterUsersSchema.tracked} DESC, ${twitterUsersSchema.updatedAt} ASC`,
      )
      .limit(100)
      .for("update", { skipLocked: true });
  }

  /**
   * Processes a user suggestion by fetching their profile and creating a query job.
   * This is the entry point for tracking new users. Sets tracked=true and triggers
   * the full scraping pipeline.
   */
  async processNextSuggestion(tx: Transaction): Promise<boolean> {
    if (await this.isDailyLimitReached()) {
      logInfo("Too many suggestions processed in the last hour");
      return false;
    }

    const suggested = await this.getSuggestedUser(tx);
    if (!suggested) return false;

    logInfo("Selected suggested profile", { username: suggested.username });
    const user = (await this.config.twitterClient.users.getInfo({
      userName: suggested.username,
    })) || {
      unavailable: true,
      message: "user not found",
      unavailableReason: "user not found",
    };

    await this.upsertUserInfo(
      tx,
      user,
      suggested.tracked,
      undefined,
      suggested.username,
    );

    return true;
  }

  /**
   * Locks and returns the oldest unprocessed suggestion.
   */
  async getSuggestedUser(tx: Transaction): Promise<
    | {
        username: string;
        tracked: boolean;
      }
    | undefined
  > {
    const suggestedProfiles = await tx
      .select({
        username: twitterUserSuggestionsSchema.username,
      })
      .from(twitterUserSuggestionsSchema)
      .where(isNull(twitterUserSuggestionsSchema.deletedAt))
      .orderBy(asc(twitterUserSuggestionsSchema.createdAt))
      .limit(1)
      .for("update", { skipLocked: true });
    return (
      suggestedProfiles[0] && {
        username: suggestedProfiles[0].username,
        tracked: true,
      }
    );
  }

  /**
   * Stores or updates user profile in the database.
   * If tracked=true and user is available, creates a query job to scrape their tweets.
   * If processing a suggestion, soft-deletes the suggestion row.
   */
  async upsertUserInfo(
    tx: Transaction,
    user: User,
    tracked: boolean,
    original_id?: bigint,
    original_username?: string,
  ): Promise<void> {
    if (user.unavailable && original_id) {
      logInfo("User set to unavailable", { userId: original_id });

      const newValue = {
        username: undefined,
        screenName: undefined,
        description: undefined,
        avatarUrl: undefined,
        isVerified: undefined,
        verifiedType: undefined,
        isAutomated: false,
        automatedBy: undefined,
        unavailable: true,
        unavailableReason: user.unavailableReason,
        userCreatedAt: undefined,
        tweetCount: undefined,
        followerCount: undefined,
        followingCount: undefined,
        tracked: tracked,
        updatedAt: new Date(),
      };
      await tx
        .insert(twitterUsersSchema)
        .values({
          id: original_id,
          ...newValue,
        })
        .onConflictDoUpdate({
          target: twitterUsersSchema.id,
          set: newValue,
        });
    } else if (!user.unavailable) {
      logInfo("User updated", { userId: user.id });

      const newValue = {
        username: user.userName,
        screenName: user.name,
        description: user.description,
        avatarUrl: user.profilePicture,
        isVerified: user.isVerified,
        verifiedType: user.verifiedType ?? undefined,
        isAutomated: user.isAutomated,
        automatedBy: user.automatedBy,
        unavailable: false,
        unavailableReason: undefined,
        userCreatedAt: new Date(user.createdAt),
        tweetCount: user.statusesCount,
        followerCount: user.followers,
        followingCount: user.following,
        tracked: tracked,
        updatedAt: new Date(),
      };

      await tx
        .insert(twitterUsersSchema)
        .values({
          id: BigInt(original_id || user.id),
          ...newValue,
        })
        .onConflictDoUpdate({
          target: twitterUsersSchema.id,
          set: newValue,
        });
    }

    if (tracked) {
      if (original_username) {
        logInfo("Suggestion deleted", { username: original_username });

        await tx
          .update(twitterUserSuggestionsSchema)
          .set({ deletedAt: new Date() })
          .where(
            and(
              isNull(twitterUserSuggestionsSchema.deletedAt),
              eq(twitterUserSuggestionsSchema.username, original_username),
            ),
          );
      }

      if (!user.unavailable) {
        logInfo("User queued for scraping", { userId: user.id });

        const query = `from:${user.userName}`;
        await tx
          .insert(twitterScrapingJobsSchema)
          .values({
            userId: BigInt(user.id),
            query,
          })
          .onConflictDoNothing();
      }
    }
  }

  /**
   * Processes a query job to scrape tweets from a tracked user.
   * Uses backward pagination with max_id cursor to walk through tweet history.
   * The oldestTrackedTweet boundary lets us resume from exactly where we left off
   * after crashes. Creates thread jobs for any replies with missing parents.
   */
  async processNextCursorJob(tx: Transaction): Promise<boolean> {
    const cursorSearch = await this.getNextCursorSearch(tx);
    if (!cursorSearch) return false;

    logInfo("Found user scraping job", {
      userId: cursorSearch.userId,
      query: cursorSearch.query,
    });

    const trackedTweetInfo = await tx
      .select({
        oldestTrackedTweet: twitterUsersSchema.oldestTrackedTweet,
        newestTrackedTweet: twitterUsersSchema.newestTrackedTweet,
      })
      .from(twitterUsersSchema)
      .where(eq(twitterUsersSchema.id, cursorSearch.userId));

    if (trackedTweetInfo[0]) {
      if (trackedTweetInfo[0].oldestTrackedTweet) {
        cursorSearch.query += ` max_id:${trackedTweetInfo[0].oldestTrackedTweet - 1n}`;
      }
    }

    const res = await this.config.twitterClient.tweets.advancedSearch({
      query: cursorSearch.query,
      queryType: "Latest",
    });

    await this.insertTweets(tx, res.tweets);
    await this.createJobsForNewTweets(tx, cursorSearch.userId, res.tweets);

    if (res.tweets.length > 0) {
      logInfo("User search scheduled for one more run", {
        userId: cursorSearch.userId,
      });
      await tx
        .update(twitterScrapingJobsSchema)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(twitterScrapingJobsSchema.userId, cursorSearch.userId));
    } else {
      logInfo("Reached end of search");
      await tx
        .delete(twitterScrapingJobsSchema)
        .where(eq(twitterScrapingJobsSchema.userId, cursorSearch.userId));
    }

    return true;
  }

  /**
   * Processes up to 20 thread jobs in a batch, walking reply chains upward.
   * Each job fetches one parent tweet and advances the traversal. Stops when
   * reaching a root tweet, existing tweet, or deleted tweet. Batch processing
   * reduces API overhead by fetching all parents in a single getByIds call.
   */
  async processNextThreadJobs(tx: Transaction): Promise<boolean> {
    const batchTweets = await this.getNextBatchTweets(tx);
    if (!batchTweets.length) return false;

    const toFetch = [];
    for (const row of batchTweets) {
      logInfo("Found thread scraping job", {
        conversationId: row.conversationId,
        originalReplyId: row.originalReplyId,
        nextReplyId: row.nextReplyId,
      });

      const existingParent = await tx
        .select({ id: scrapedTweetSchema.id })
        .from(scrapedTweetSchema)
        .where(eq(scrapedTweetSchema.id, BigInt(row.nextReplyId)))
        .limit(1);

      if (existingParent.length) {
        logInfo("Parent reply already scraped, breaking traversal", {
          conversationId: row.conversationId,
          originalReplyId: row.originalReplyId,
          nextReplyId: row.nextReplyId,
        });

        await this.finishThreadScraping(
          tx,
          row.conversationId,
          row.originalReplyId,
        );

        continue;
      }

      toFetch.push(row);
    }

    if (!toFetch.length) {
      return true;
    }

    logInfo("Fetching thread tweets", {
      tweetIds: toFetch.map((row) => String(row.nextReplyId)).join(","),
    });

    const tweets = (
      await this.config.twitterClient.tweets.getByIds({
        tweetIds: toFetch.map((row) => String(row.nextReplyId)),
      })
    )
      .filter((tweet) => tweet.id.length > 0)
      .map((tweet) => tweet as SimpleTweet);

    for (const { conversationId, originalReplyId, nextReplyId } of toFetch) {
      const tweet = tweets.find((tweet) => nextReplyId === BigInt(tweet.id));

      if (!tweet?.inReplyToId) {
        logInfo(
          !tweet
            ? "Parent tweet not found, breaking traversal"
            : "Reached root tweet, breaking traversal",
          {
            conversationId,
            originalReplyId,
            nextReplyId,
          },
        );

        await this.finishThreadScraping(tx, conversationId, originalReplyId);
      } else {
        await tx
          .update(twitterScrapingJobsSchema)
          .set({
            nextReplyId: BigInt(tweet.inReplyToId),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(twitterScrapingJobsSchema.conversationId, conversationId),
              eq(twitterScrapingJobsSchema.originalReplyId, originalReplyId),
            ),
          );
      }
    }

    await this.insertTweets(tx, tweets);

    return tweets.length > 0;
  }

  /**
   * Locks and returns the oldest query job waiting to be processed.
   */
  async getNextCursorSearch(
    tx: Transaction,
  ): Promise<{ userId: bigint; query: string } | undefined> {
    const job = await tx
      .select({
        userId: twitterScrapingJobsSchema.userId,
        query: twitterScrapingJobsSchema.query,
      })
      .from(twitterScrapingJobsSchema)
      .where(
        and(
          isNotNull(twitterScrapingJobsSchema.userId),
          isNotNull(twitterScrapingJobsSchema.query),
        ),
      )
      .orderBy(asc(twitterScrapingJobsSchema.createdAt))
      .limit(1)
      .for("update", { skipLocked: true });
    return (
      job[0] && {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        userId: job[0].userId!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        query: job[0].query!,
      }
    );
  }

  /**
   * Locks and returns up to 20 thread jobs for batch processing.
   */
  async getNextBatchTweets(tx: Transaction): Promise<
    {
      conversationId: bigint;
      originalReplyId: bigint;
      nextReplyId: bigint;
    }[]
  > {
    return (
      await tx
        .select({
          conversationId: twitterScrapingJobsSchema.conversationId,
          originalReplyId: twitterScrapingJobsSchema.originalReplyId,
          nextReplyId: twitterScrapingJobsSchema.nextReplyId,
        })
        .from(twitterScrapingJobsSchema)
        .where(
          and(
            isNotNull(twitterScrapingJobsSchema.conversationId),
            isNotNull(twitterScrapingJobsSchema.originalReplyId),
            isNotNull(twitterScrapingJobsSchema.nextReplyId),
          ),
        )
        .orderBy(asc(twitterScrapingJobsSchema.createdAt))
        .limit(20)
        .for("update", { skipLocked: true })
    ).map(({ conversationId, originalReplyId, nextReplyId }) => ({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      conversationId: conversationId!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      originalReplyId: originalReplyId!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      nextReplyId: nextReplyId!,
    }));
  }

  /**
   * Deletes a thread job, signaling that the reply chain has been walked to completion.
   * Called when reaching a root tweet, existing tweet, or deleted tweet.
   */
  async finishThreadScraping(
    tx: Transaction,
    conversationId: bigint,
    originalReplyId: bigint,
  ) {
    await tx
      .delete(twitterScrapingJobsSchema)
      .where(
        and(
          eq(twitterScrapingJobsSchema.conversationId, conversationId),
          eq(twitterScrapingJobsSchema.originalReplyId, originalReplyId),
        ),
      );
  }

  /**
   * Handles quoted tweet insertion, user stub creation, and thread job creation.
   * Called from insertTweets when a tweet has a quoted_tweet.
   */
  private async handleQuotedTweet(
    tx: Transaction,
    quotedTweet: SimpleTweet["quoted_tweet"],
  ) {
    if (!quotedTweet?.id || !quotedTweet.author_id) return;

    const quotedTweetId = BigInt(quotedTweet.id);
    const quotedAuthorId = BigInt(quotedTweet.author_id || "0");
    const quotedConversationId = quotedTweet.conversationId
      ? BigInt(quotedTweet.conversationId)
      : null;
    const quotedInReplyToId =
      quotedTweet.inReplyToId && quotedTweet.inReplyToId !== ""
        ? BigInt(quotedTweet.inReplyToId)
        : null;

    const quotedTweetData: ScrapedTweet = {
      id: quotedTweetId,
      text: decode(quotedTweet.text),
      authorId: quotedAuthorId,
      date: new Date(
        quotedTweet.createdAt || quotedTweet.created_at || new Date(),
      ),
      quotedId: quotedTweet.quoted_tweet?.id
        ? BigInt(String(quotedTweet.quoted_tweet.id))
        : null,
      conversationId: quotedConversationId,
      parentTweetId: quotedInReplyToId,
    };

    await tx
      .insert(scrapedTweetSchema)
      .values(quotedTweetData)
      .onConflictDoNothing();

    await tx
      .insert(twitterUsersSchema)
      .values({
        id: quotedAuthorId,
        tracked: false,
      })
      .onConflictDoNothing();

    if (quotedConversationId && quotedInReplyToId) {
      const existingParent = await tx
        .select({ id: scrapedTweetSchema.id })
        .from(scrapedTweetSchema)
        .where(eq(scrapedTweetSchema.id, quotedInReplyToId))
        .limit(1);

      if (!existingParent.length) {
        logInfo("Quoted tweet is in thread, creating thread job", {
          conversationId: quotedConversationId,
          quotedTweetId,
          parentId: quotedInReplyToId,
        });

        await tx
          .insert(twitterScrapingJobsSchema)
          .values({
            conversationId: quotedConversationId,
            originalReplyId: quotedTweetId,
            nextReplyId: quotedInReplyToId,
          })
          .onConflictDoNothing();

        if (quotedTweet.inReplyToUserId) {
          await tx
            .insert(twitterUsersSchema)
            .values({
              id: BigInt(quotedTweet.inReplyToUserId),
              tracked: false,
            })
            .onConflictDoNothing();
        }
      }
    }
  }

  /**
   * Upserts tweets into the database.
   */
  async insertTweets(tx: Transaction, tweets: SimpleTweet[]) {
    if (tweets.length === 0) return;

    logInfo("Inserted tweets", { count: tweets.length });

    for (const tweet of tweets) {
      const conversationId = tweet.conversationId
        ? BigInt(tweet.conversationId)
        : null;
      const inReplyToId =
        tweet.inReplyToId && tweet.inReplyToId !== ""
          ? tweet.inReplyToId
          : null;
      const parentTweetId = inReplyToId ? BigInt(inReplyToId) : null;

      const tweetData: ScrapedTweet = {
        id: BigInt(tweet.id),
        text: decode(tweet.text),
        authorId: BigInt(tweet.author_id || tweet.author?.id || "0"),
        date: new Date(tweet.createdAt || tweet.created_at || new Date()),
        quotedId: tweet.quoted_tweet
          ? BigInt(String(tweet.quoted_tweet.id))
          : null,
        conversationId,
        parentTweetId,
      };

      await tx
        .insert(scrapedTweetSchema)
        .values(tweetData)
        .onConflictDoUpdate({
          target: scrapedTweetSchema.id,
          set: {
            ...tweetData,
            updatedAt: new Date(),
          },
        });

      if (tweet.quoted_tweet) {
        await this.handleQuotedTweet(tx, tweet.quoted_tweet);
      }
    }
  }

  /**
   * Creates thread jobs for replies with missing parents and updates boundary tracking.
   * For each reply, checks if parent exists. If not, creates a thread job to fetch it
   * and opportunistically creates a stub user for the parent author. Updates
   * oldestTrackedTweet and newestTrackedTweet boundaries.
   */
  async createJobsForNewTweets(
    tx: Transaction,
    author: bigint,
    tweets: SimpleTweet[],
  ) {
    if (!tweets[0]) {
      return;
    }

    let highestId = BigInt(tweets[0].id);
    let lowestId = BigInt(tweets[0].id);

    for (const {
      id: strId,
      conversationId,
      inReplyToId,
      inReplyToUserId,
    } of tweets) {
      const id = BigInt(strId);
      if (id > highestId) highestId = id;
      if (id < lowestId) lowestId = id;

      if (inReplyToId && conversationId) {
        const existingParent = await tx
          .select({ id: scrapedTweetSchema.id })
          .from(scrapedTweetSchema)
          .where(eq(scrapedTweetSchema.id, BigInt(inReplyToId)))
          .limit(1);

        if (!existingParent.length) {
          logInfo("Found reply, creating thread traversal job", {
            conversationId,
            originalReplyId: id,
          });

          await tx
            .insert(twitterScrapingJobsSchema)
            .values({
              conversationId: BigInt(conversationId),
              originalReplyId: BigInt(id),
              nextReplyId: BigInt(inReplyToId),
            })
            .onConflictDoNothing();

          if (inReplyToUserId) {
            await tx
              .insert(twitterUsersSchema)
              .values({
                id: BigInt(inReplyToUserId),
                tracked: false,
              })
              .onConflictDoNothing();
          }
        }
      }
    }

    await tx
      .update(twitterUsersSchema)
      .set({
        oldestTrackedTweet: sql`LEAST(COALESCE(${twitterUsersSchema.oldestTrackedTweet}, ${lowestId}), ${lowestId})`,
        newestTrackedTweet: sql`GREATEST(COALESCE(${twitterUsersSchema.newestTrackedTweet}, ${highestId}), ${highestId})`,
      })
      .where(
        and(
          eq(twitterUsersSchema.id, author),
          sql`(
            ${twitterUsersSchema.oldestTrackedTweet} IS NULL
            OR ${lowestId} < ${twitterUsersSchema.oldestTrackedTweet}
            OR ${twitterUsersSchema.newestTrackedTweet} IS NULL
            OR ${highestId} > ${twitterUsersSchema.newestTrackedTweet}
          )`,
        ),
      );
  }

  /**
   * Worker loop that polls for jobs and processes them continuously.
   * Respects daily tweet limits and backs off exponentially on failures.
   * Rate limit errors get special handling with longer wait times.
   */
  private async runWorker(
    workerId: number,
    stopHook: () => boolean,
  ): Promise<void> {
    await workerContext.run({ workerId }, async () => {
      let consecutiveFailures = 0;
      const maxBackoff = 1000 * 60 * 30;

      logInfo("Worker started");

      while (!stopHook()) {
        try {
          const progress = await this.db.transaction(
            async (tx) =>
              (await this.processNextCursorJob(tx)) ||
              (await this.processNextThreadJobs(tx)) ||
              (await this.processNextIncompleteUsers(tx)) ||
              (await this.processNextSuggestion(tx)),
          );

          consecutiveFailures = 0;

          if (!progress) {
            logInfo("No progress made, waiting 1 minute");
            await sleep(1000 * 60);
          }
        } catch (e) {
          consecutiveFailures++;

          if (e instanceof BaseAPIError) {
            const cause = e.cause;

            if (cause instanceof KaitoRateLimitError) {
              const waitTime = cause.retryAfter
                ? cause.retryAfter * 1000
                : 1000 * 60 * 15;
              logError("Rate limit hit", {
                message: cause.message,
                waitSeconds: waitTime / 1000,
              });
              await sleep(waitTime);
              consecutiveFailures = 0;
              continue;
            } else if (cause instanceof KaitoValidationError) {
              logError("Validation error", {
                message: cause.message,
                issues: JSON.stringify(cause.zodError.issues),
              });
            } else if (cause instanceof KaitoTwitterAPIError) {
              logError("Twitter API error", {
                message: cause.message,
                status: cause.status,
              });
            } else {
              logError("Scraper failed", { error: String(cause) });
            }
          } else {
            logError("Scraper failed", { error: String(e) });
          }

          const backoffTime = Math.min(
            1000 * 60 * Math.pow(2, consecutiveFailures - 1),
            maxBackoff,
          );
          logInfo("Backing off", {
            seconds: backoffTime / 1000,
            failureCount: consecutiveFailures,
          });
          await sleep(backoffTime);
        }
      }

      logInfo("Worker stopped");
    });
  }

  /**
   * Starts multiple concurrent workers that process jobs in parallel.
   */
  async runScraper(stopHook: () => boolean): Promise<void> {
    const workers = Array.from({ length: this.config.concurrency }, (_, i) =>
      this.runWorker(i + 1, stopHook),
    );

    await Promise.all(workers);
  }
}
