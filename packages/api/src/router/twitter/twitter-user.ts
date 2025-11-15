import {
  BASELINE_METADATA_COST,
  calculateScrapingCost,
} from "@torus-network/torus-utils";
import { makeTorAmount } from "@torus-network/torus-utils/torus/token";
import { and, eq, gte, ilike, notExists, sql } from "@torus-ts/db";
import {
  parsedPredictionFeedbackSchema,
  parsedPredictionSchema,
  predictionPurchasesSchema,
  predictionSchema,
  scrapedTweetSchema,
  twitterScrapingJobsSchema,
  twitterUsersSchema,
  twitterUserSuggestionsSchema,
  userCreditsSchema,
  verdictSchema,
} from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { authenticatedProcedure, publicProcedure } from "../../trpc";

const torAmountSchema = z
  .bigint()
  .transform((val) => makeTorAmount(val.toString()));

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
          .max(50, "Search query is too long")
          .transform((val) => {
            // Strip @ symbol and Twitter URL if present
            let cleaned = val.trim();
            cleaned = cleaned.replace(/^@/, ""); // Remove leading @

            // Extract username from Twitter URLs
            const urlMatch = /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/.exec(
              cleaned,
            );
            if (urlMatch) {
              cleaned = urlMatch[1] ?? cleaned;
            }

            return cleaned;
          }),
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { query, limit } = input;

      // Validate username format (alphanumeric + underscore only)
      if (!/^[a-zA-Z0-9_]+$/.test(query)) {
        return [];
      }

      // Three-tier search for ranking (only tracked users)
      // 1. Exact match
      const exactMatch = await ctx.db
        .select({
          userId: twitterUsersSchema.id,
          username: twitterUsersSchema.username,
          screenName: twitterUsersSchema.screenName,
          description: twitterUsersSchema.description,
          avatarUrl: twitterUsersSchema.avatarUrl,
          isVerified: twitterUsersSchema.isVerified,
          verifiedType: twitterUsersSchema.verifiedType,
          followerCount: twitterUsersSchema.followerCount,
          tracked: twitterUsersSchema.tracked,
          matchType: sql<string>`'exact'`.as("match_type"),
        })
        .from(twitterUsersSchema)
        .where(
          and(
            ilike(twitterUsersSchema.username, query),
            eq(twitterUsersSchema.tracked, true),
          ),
        )
        .limit(1);

      // 2. Starts with
      const startsWithMatch = await ctx.db
        .select({
          userId: twitterUsersSchema.id,
          username: twitterUsersSchema.username,
          screenName: twitterUsersSchema.screenName,
          description: twitterUsersSchema.description,
          avatarUrl: twitterUsersSchema.avatarUrl,
          isVerified: twitterUsersSchema.isVerified,
          verifiedType: twitterUsersSchema.verifiedType,
          followerCount: twitterUsersSchema.followerCount,
          tracked: twitterUsersSchema.tracked,
          matchType: sql<string>`'starts_with'`.as("match_type"),
        })
        .from(twitterUsersSchema)
        .where(
          and(
            ilike(twitterUsersSchema.username, `${query}%`),
            sql`LOWER(${twitterUsersSchema.username}) != LOWER(${query})`, // Exclude exact match
            eq(twitterUsersSchema.tracked, true),
          ),
        )
        .limit(5);

      // 3. Contains (limited to avoid false positives)
      const containsMatch = await ctx.db
        .select({
          userId: twitterUsersSchema.id,
          username: twitterUsersSchema.username,
          screenName: twitterUsersSchema.screenName,
          description: twitterUsersSchema.description,
          avatarUrl: twitterUsersSchema.avatarUrl,
          isVerified: twitterUsersSchema.isVerified,
          verifiedType: twitterUsersSchema.verifiedType,
          followerCount: twitterUsersSchema.followerCount,
          tracked: twitterUsersSchema.tracked,
          matchType: sql<string>`'contains'`.as("match_type"),
        })
        .from(twitterUsersSchema)
        .where(
          and(
            ilike(twitterUsersSchema.username, `%${query}%`),
            sql`LOWER(${twitterUsersSchema.username}) NOT LIKE LOWER(${query} || '%')`, // Exclude starts-with
            sql`LOWER(${twitterUsersSchema.username}) != LOWER(${query})`, // Exclude exact
            eq(twitterUsersSchema.tracked, true),
          ),
        )
        .limit(4);

      // Combine results in order of relevance
      const allResults = [...exactMatch, ...startsWithMatch, ...containsMatch];

      return allResults.slice(0, limit);
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
   * Purchase user metadata by fetching from Twitter API.
   *
   * Costs BASELINE_METADATA_COST credits.
   * Optional budget parameter - fails if cost would exceed budget.
   * Idempotent - returns existing data if user already in DB (free).
   * Single transaction - if Twitter API fails, credits are not deducted.
   */
  purchaseMetadata: authenticatedProcedure
    .input(
      z.object({
        username: z
          .string()
          .min(1)
          .max(15)
          .transform((val) => (val.startsWith("@") ? val.slice(1) : val)),
        budget: torAmountSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userKey = ctx.sessionData.userKey;

      return await ctx.db.transaction(async (tx) => {
        // 1. Idempotent check - return existing if already purchased
        const existing = await tx.query.twitterUsersSchema.findFirst({
          where: eq(twitterUsersSchema.username, input.username),
        });

        if (existing) {
          return {
            alreadyExists: true,
            creditsSpent: 0,
            user: {
              userId: existing.id.toString(),
              username: existing.username,
              screenName: existing.screenName,
              tweetCount: existing.tweetCount,
              followerCount: existing.followerCount,
              avatarUrl: existing.avatarUrl,
              isVerified: existing.isVerified,
              unavailable: existing.unavailable,
            },
          };
        }

        // 2. Budget check BEFORE locking/charging
        if (input.budget && BASELINE_METADATA_COST > input.budget) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Metadata cost (${BASELINE_METADATA_COST.toString()} credits) exceeds budget (${input.budget.toString()} credits)`,
          });
        }

        // 3. Lock user credits row to prevent race conditions
        const [locked] = await tx.execute<{ balance: string }>(sql`
          SELECT balance
          FROM user_credits
          WHERE user_key = ${userKey}
          FOR UPDATE
        `);

        if (
          !locked ||
          makeTorAmount(locked.balance).isLessThan(BASELINE_METADATA_COST)
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Insufficient credits. Required: ${BASELINE_METADATA_COST.toString()}, Available: ${locked?.balance ?? 0}`,
          });
        }

        // 3. Deduct metadata cost
        await tx
          .update(userCreditsSchema)
          .set({
            balance: sql`${userCreditsSchema.balance} - ${BASELINE_METADATA_COST}`,
            totalSpent: sql`${userCreditsSchema.totalSpent} + ${BASELINE_METADATA_COST}`,
            updatedAt: new Date(),
          })
          .where(eq(userCreditsSchema.userKey, userKey));

        // 4. Fetch metadata from Twitter API
        // If this fails, entire transaction rolls back (credits restored)
        const user = await ctx.twitterClient.users.getInfo({
          userName: input.username,
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Twitter user not found",
          });
        }

        // 5. Check if user is unavailable - fail without refund (API call was made)
        if (user.unavailable) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `User is unavailable: ${user.unavailableReason}. Credits have been deducted.`,
          });
        }

        // 6. Store available user with full metadata
        await tx.insert(twitterUsersSchema).values({
          id: BigInt(user.id),
          username: user.userName,
          screenName: user.name,
          description: user.description,
          avatarUrl: user.profilePicture,
          isVerified: user.isVerified,
          verifiedType: user.verifiedType ?? undefined,
          isAutomated: user.isAutomated,
          automatedBy: user.automatedBy ?? undefined,
          unavailable: false,
          userCreatedAt: new Date(user.createdAt),
          tweetCount: user.statusesCount,
          followerCount: user.followers,
          followingCount: user.following,
          tracked: false,
        });

        // 7. Record metadata purchase
        await tx.insert(predictionPurchasesSchema).values({
          userKey,
          username: user.userName,
          purchaseType: "metadata",
          creditsSpent: BASELINE_METADATA_COST.toString(),
        });

        return {
          creditsSpent: BASELINE_METADATA_COST,
          user: {
            userId: user.id,
            username: user.userName,
            screenName: user.name,
            tweetCount: user.statusesCount,
            followerCount: user.followers,
            avatarUrl: user.profilePicture,
            isVerified: user.isVerified,
            unavailable: false,
          },
        };
      });
    }),

  /**
   * Suggest a Twitter user for scraping.
   *
   * Idempotent - if user already queued or tracked, returns without charging.
   * Requires user metadata to exist in DB (call purchaseMetadata first if not).
   * Optional budget parameter - fails if scraping cost would exceed budget.
   * Deducts credits and queues user for scraping.
   */
  suggestUser: authenticatedProcedure
    .input(
      z.object({
        username: z
          .string()
          .min(1, "Username is required")
          .max(15, "Username too long")
          .transform((val) => (val.startsWith("@") ? val.slice(1) : val)),
        budget: torAmountSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userKey = ctx.sessionData.userKey;

      return await ctx.db.transaction(async (tx) => {
        // 1. Get user metadata (must exist)
        const user = await tx.query.twitterUsersSchema.findFirst({
          where: eq(twitterUsersSchema.username, input.username),
        });

        if (!user) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "User metadata not found. Purchase metadata first using purchaseMetadata endpoint.",
          });
        }

        // 2. Check if already tracked (scraping completed)
        if (user.tracked) {
          return {
            alreadyQueued: true,
            creditsSpent: makeTorAmount(0),
          };
        }

        // 3. Calculate scraping cost
        const cost = calculateScrapingCost(user.tweetCount ?? 0);

        // 4. Budget check BEFORE locking/charging
        if (input.budget && cost > input.budget) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Scraping cost (${cost.toString()} credits) exceeds budget (${input.budget.toString()} credits)`,
          });
        }

        // 5. Try to insert suggestion - if conflict, already queued
        const insertedRows = await tx
          .insert(twitterUserSuggestionsSchema)
          .values({
            username: input.username,
            wallet: userKey,
          })
          .onConflictDoNothing()
          .returning();

        // If no rows returned, already queued by this or another user
        if (insertedRows.length === 0) {
          return {
            alreadyQueued: true,
            creditsSpent: makeTorAmount(0),
          };
        }

        // 6. Deduct credits atomically (only if sufficient balance)
        const updatedRows = await tx
          .update(userCreditsSchema)
          .set({
            balance: sql`${userCreditsSchema.balance} - ${cost}`,
            totalSpent: sql`${userCreditsSchema.totalSpent} + ${cost}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(userCreditsSchema.userKey, userKey),
              gte(userCreditsSchema.balance, cost.toString()),
            ),
          )
          .returning({ balance: userCreditsSchema.balance });

        // Check if update actually happened (empty array = insufficient balance)
        if (updatedRows.length === 0) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Insufficient credits. Required: ${cost.toString()}, check your balance with getBalance.`,
          });
        }

        // 7. Record scraping purchase
        await tx.insert(predictionPurchasesSchema).values({
          userKey,
          username: input.username,
          purchaseType: "scraping",
          creditsSpent: cost.toString(),
        });

        return {
          creditsSpent: cost,
        };
      });
    }),

  /**
   * Get user's scraping suggestions with status.
   *
   * Returns all usernames the authenticated user has requested to scrape,
   * with their current status matching scraper queue page:
   * - "suggested": In queue, not yet started
   * - "scraping": Profile exists, collecting tweets
   * - "processing": Has tweets, generating predictions/verdicts
   * - "complete": User is tracked and ready
   */
  getUserSuggestions: authenticatedProcedure
    .input(
      z.object({
        status: z
          .enum(["suggested", "scraping", "processing", "complete"])
          .optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userKey = ctx.sessionData.userKey;

      // Get suggestions with user and scraping job data
      const suggestions = await ctx.db
        .select({
          username: twitterUserSuggestionsSchema.username,
          requestedAt: twitterUserSuggestionsSchema.createdAt,
          userId: twitterUsersSchema.id,
          tracked: twitterUsersSchema.tracked,
          tweetCount: twitterUsersSchema.tweetCount,
          hasScrapingJob: sql<boolean>`${twitterScrapingJobsSchema.userId} IS NOT NULL`,
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
        .where(eq(twitterUserSuggestionsSchema.wallet, userKey))
        .orderBy(sql`${twitterUserSuggestionsSchema.createdAt} DESC`)
        .limit(input.limit)
        .offset(input.offset);

      // Map to include status using same logic as scraper queue
      const withStatus = suggestions.map((s) => {
        let status: "suggested" | "scraping" | "processing" | "complete";

        if (
          s.hasScrapingJob ||
          (s.userId && (!s.tweetCount || s.tweetCount === 0))
        ) {
          // 2. Scraping - Profile exists, collecting tweets
          status = "scraping";
        } else if (s.tweetCount && s.tweetCount > 0 && !s.tracked) {
          // 3. Processing - Has tweets, generating predictions/verdicts
          status = "processing";
        } else if (s.tracked) {
          // 4. Complete - User is tracked and ready
          status = "complete";
        } else {
          // 1. Suggested - In queue only
          status = "suggested";
        }

        return {
          username: s.username,
          requestedAt: s.requestedAt,
          status,
        };
      });

      // Apply status filter if provided
      if (input.status) {
        return withStatus.filter((s) => s.status === input.status);
      }

      return withStatus;
    }),

  /**
   * Check if user is being scraped or exists with tracked status
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
      const suggestions = await ctx.db
        .select()
        .from(twitterUserSuggestionsSchema)
        .where(ilike(twitterUserSuggestionsSchema.username, input.username))
        .limit(1);

      if (suggestions[0]) {
        return { status: "scraping" as const, username: input.username };
      }

      const existingUsers = await ctx.db
        .select()
        .from(twitterUsersSchema)
        .where(ilike(twitterUsersSchema.username, input.username))
        .limit(1);

      if (existingUsers[0]) {
        // Check if user is tracked (has predictions) or untracked (only profile scraped)
        if (existingUsers[0].tracked) {
          return { status: "ready" as const, username: input.username };
        } else {
          return { status: "untracked" as const, username: input.username };
        }
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
        .innerJoin(predictionSchema, sql`true`)
        .rightJoin(
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
                    sql`${parsedPredictionFeedbackSchema.failureCause} != 'FUTURE_TIMEFRAME'`,
                  ),
                ),
            ),
          ),
        )
        .innerJoin(
          scrapedTweetSchema,
          and(
            eq(scrapedTweetSchema.authorId, twitterUsersSchema.id),
            eq(
              scrapedTweetSchema.predictionId,
              parsedPredictionSchema.predictionId,
            ),
          ),
        )
        .leftJoin(
          verdictSchema,
          eq(verdictSchema.parsedPredictionId, parsedPredictionSchema.id),
        )
        .where(eq(twitterUsersSchema.tracked, true))
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

      const topPredictors = userStats
        .map((user) => {
          const r = user.truePredictions;
          // verdictedPredictions includes both true and false
          // So n should just be verdictedPredictions, and w = n - r
          const n = user.verdictedPredictions;

          const accuracy =
            user.verdictedPredictions > 0 ? Math.round((r / n) * 100) : 0;

          // Score formula: (r / n) * log10(n + 1)
          const score = n > 0 ? (r / n) * Math.log10(n + 1) : 0;

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
