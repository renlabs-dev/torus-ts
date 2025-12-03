/**
 * Seed mock data for testing swarm-filter
 *
 * Creates sample data in:
 * - twitterUsersSchema
 * - twitterUserSuggestionsSchema
 * - scrapedTweetSchema (with some tweets older than 12 hours)
 */

import { createDb } from "@torus-ts/db/client";
import {
  scrapedTweetSchema,
  twitterUsersSchema,
  twitterUserSuggestionsSchema,
} from "@torus-ts/db/schema";

async function seedMockData() {
  console.log("Seeding mock data...\n");

  const db = createDb();

  // Insert mock Twitter users
  console.log("Inserting Twitter users...");
  await db
    .insert(twitterUsersSchema)
    .values([
      {
        id: 123456789n,
        username: "elonmusk",
        screenName: "Elon Musk",
        description: "Tesla & SpaceX CEO",
        followerCount: 100000000,
        followingCount: 500,
        tweetCount: 50000,
        tracked: true,
      },
      {
        id: 987654321n,
        username: "vitalikbuterin",
        screenName: "Vitalik Buterin",
        description: "Ethereum co-founder",
        followerCount: 5000000,
        followingCount: 200,
        tweetCount: 20000,
        tracked: true,
      },
    ])
    .onConflictDoNothing();
  console.log("✓ Twitter users inserted\n");

  // Insert user suggestions
  console.log("Inserting user suggestions...");
  await db
    .insert(twitterUserSuggestionsSchema)
    .values([
      {
        username: "elonmusk",
        wallet: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
      },
      {
        username: "vitalikbuterin",
        wallet: "5DoVVgN7R6vHw4mvPX8s4EkkR8fgN1UJ5TDfKzab8eW9z89b",
      },
    ])
    .onConflictDoNothing();
  console.log("✓ User suggestions inserted\n");

  // Insert scraped tweets (some old, some recent)
  console.log("Inserting scraped tweets...");

  const now = new Date();
  const thirteenHoursAgo = new Date(now.getTime() - 13 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);

  await db
    .insert(scrapedTweetSchema)
    .values([
      // Old tweets (>12 hours)
      {
        id: 1001n,
        text: "Bitcoin will hit $100k by end of 2024",
        authorId: 123456789n,
        date: twentyFourHoursAgo,
        quotedId: null,
        conversationId: 1001n,
        parentTweetId: null,
      },
      {
        id: 1002n,
        text: "Some analysts say BTC will reach $90k in December",
        authorId: 987654321n,
        date: thirteenHoursAgo,
        quotedId: null,
        conversationId: 1002n,
        parentTweetId: null,
      },
      {
        id: 1003n,
        text: "This will definitely happen",
        authorId: 123456789n,
        date: thirteenHoursAgo,
        quotedId: null,
        conversationId: 1002n,
        parentTweetId: 1002n,
      },
      {
        id: 1004n,
        text: "AI will transform every industry within 5 years",
        authorId: 987654321n,
        date: thirteenHoursAgo,
        quotedId: null,
        conversationId: 1004n,
        parentTweetId: null,
      },

      // Recent tweets (<12 hours)
      {
        id: 2001n,
        text: "Just had coffee, great day!",
        authorId: 123456789n,
        date: oneHourAgo,
        quotedId: null,
        conversationId: 2001n,
        parentTweetId: null,
      },
    ])
    .onConflictDoNothing();

  console.log("✓ Scraped tweets inserted");
  console.log("  - 4 tweets >12 hours old");
  console.log("  - 1 tweet <12 hours old\n");

  console.log("Mock data seeding complete!");
  process.exit(0);
}

seedMockData().catch((error) => {
  console.error("Failed to seed mock data:", error);
  process.exit(1);
});
