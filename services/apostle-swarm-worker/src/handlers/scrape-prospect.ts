import { BasicLogger } from "@torus-network/torus-utils/logger";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import {
  jobsQueueSchema,
  memoryStoreSchema,
  prospectsSchema,
} from "@torus-ts/db/schema";
import type { KaitoTwitterAPI } from "@torus-ts/twitter-client";
import { eq } from "drizzle-orm";
import { assert } from "tsafe";
import type { ApostleSwarmDB } from "../db";
import { env } from "../env";
import { ScrapeProspectPayloadSchema } from "../types";

const log = BasicLogger.create({ name: "scrape-prospect" });

export interface ScrapeProspectContext {
  db: ApostleSwarmDB;
  twitterClient: KaitoTwitterAPI;
}

/**
 * Handles SCRAPE_PROSPECT jobs.
 *
 * Fetches Twitter profile data and recent tweets for a prospect, stores them
 * in memory_store, updates the prospect record, and enqueues an EVALUATE_PROSPECT job.
 */
export async function handleScrapeProspect(
  ctx: ScrapeProspectContext,
  payload: unknown,
): Promise<void> {
  // Validate payload
  const parseResult = ScrapeProspectPayloadSchema.safeParse(payload);
  if (!parseResult.success) {
    throw new Error(`Invalid payload: ${parseResult.error.message}`);
  }
  const { prospect_id } = parseResult.data;

  log.info(`Scraping prospect ${prospect_id}`);

  // Fetch prospect from database
  const [prospectErr, prospects] = await tryAsync(
    ctx.db
      .select()
      .from(prospectsSchema)
      .where(eq(prospectsSchema.id, prospect_id))
      .limit(1),
  );
  if (prospectErr !== undefined) {
    throw new Error(`Failed to fetch prospect: ${prospectErr.message}`);
  }

  const prospect = prospects[0];
  if (prospect === undefined) {
    throw new Error(`Prospect ${prospect_id} not found`);
  }

  // Check that prospect is APPROVED
  if (prospect.approvalStatus !== "APPROVED") {
    throw new Error(
      `Prospect ${prospect_id} is not APPROVED (status: ${prospect.approvalStatus})`,
    );
  }

  const xHandle = prospect.xHandle;
  log.info(`Fetching Twitter data for @${xHandle}`);

  // Fetch profile from Twitter API
  const [profileErr, profile] = await tryAsync(
    ctx.twitterClient.users.getInfo({ userName: xHandle }),
  );
  if (profileErr !== undefined) {
    throw new Error(
      `Failed to fetch profile for @${xHandle}: ${profileErr.message}`,
    );
  }
  if (profile === undefined) {
    throw new Error(`Profile not found for @${xHandle}`);
  }

  // Handle unavailable users
  if ("unavailable" in profile && profile.unavailable === true) {
    throw new Error(
      `User @${xHandle} is unavailable: ${profile.message} (${profile.unavailableReason})`,
    );
  }

  // Extract profile data (TypeScript now knows this is an available user)
  const displayName = profile.name ?? xHandle;
  const avatarUrl = profile.profilePicture;
  const bio = profile.description ?? null;

  // Fetch recent tweets
  const [tweetsErr, tweetsResult] = await tryAsync(
    ctx.twitterClient.users.getLastTweets({
      userName: xHandle,
      includeReplies: false,
    }),
  );
  if (tweetsErr !== undefined) {
    throw new Error(
      `Failed to fetch tweets for @${xHandle}: ${tweetsErr.message}`,
    );
  }

  // Limit tweets to configured amount (API returns up to 20 per page)
  const tweets = tweetsResult.data.slice(0, env.SCRAPE_TWEET_LIMIT);
  log.info(`Fetched ${tweets.length} tweets for @${xHandle}`);

  // Upsert memory_store record and update prospect in a transaction
  const [txErr] = await tryAsync(
    ctx.db.transaction(async (tx) => {
      // Upsert memory_store
      await tx
        .insert(memoryStoreSchema)
        .values({
          prospectId: prospect_id,
          xBio: bio,
          xTweetsRaw: tweets,
          lastScrapedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: memoryStoreSchema.prospectId,
          set: {
            xBio: bio,
            xTweetsRaw: tweets,
            lastScrapedAt: new Date(),
            updatedAt: new Date(),
          },
        });

      // Update prospect with display name and avatar
      await tx
        .update(prospectsSchema)
        .set({
          displayName,
          avatarUrl,
          updatedAt: new Date(),
        })
        .where(eq(prospectsSchema.id, prospect_id));

      // Enqueue EVALUATE_PROSPECT job
      const [insertedJob] = await tx
        .insert(jobsQueueSchema)
        .values({
          jobType: "EVALUATE_PROSPECT",
          payload: { prospect_id },
          status: "PENDING",
          runAt: new Date(),
        })
        .returning({ id: jobsQueueSchema.id });

      assert(
        insertedJob !== undefined,
        "Failed to insert EVALUATE_PROSPECT job - no row returned",
      );
      log.info(
        `Enqueued EVALUATE_PROSPECT job ${insertedJob.id} for prospect ${prospect_id}`,
      );
    }),
  );

  if (txErr !== undefined) {
    throw new Error(`Transaction failed: ${txErr.message}`);
  }

  log.info(`Successfully scraped prospect ${prospect_id} (@${xHandle})`);
}
