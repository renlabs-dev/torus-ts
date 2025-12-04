/**
 * Seed Twitter users for scraping
 *
 * Adds specified users to twitter_user_suggestions to be picked up by the scraper.
 */

import { createDb } from "@torus-ts/db/client";
import { twitterUserSuggestionsSchema } from "@torus-ts/db/schema";

// Configure users to seed - modify this array to change which users are tracked
const USERS_TO_SEED = ["SuperForecasts", "metaculus"];

async function seedTwitterUsers() {
  console.log(`Adding ${USERS_TO_SEED.length} users to scraping queue...\n`);

  const db = createDb();

  for (const username of USERS_TO_SEED) {
    await db
      .insert(twitterUserSuggestionsSchema)
      .values({
        username,
        wallet: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", // Placeholder wallet
      })
      .onConflictDoNothing();

    console.log(`✓ Added: ${username}`);
  }

  console.log("\nAll users added to twitter_user_suggestions");
  console.log("\nStart the scraper to begin fetching tweets:");
  console.log("  pnpm --filter swarm-twitter dev\n");

  process.exit(0);
}

seedTwitterUsers().catch((error) => {
  console.error("Failed to seed Twitter users:", error);
  process.exit(1);
});
