import { BasicLogger } from "@torus-network/torus-utils/logger";
import { createDb } from "@torus-ts/db/client";
import { KaitoTwitterAPI } from "@torus-ts/twitter-client";
import { TwitterAccountScraper } from "./twitter-account-scraper";

export const logger = BasicLogger.create({ name: "torus-swarm-twitter" });

if (!process.env.TWITTERAPI_IO_KEY) {
  console.error("missing TWITTERAPI_IO_KEY env var");
  process.exit(1);
}

const scraper = new TwitterAccountScraper(
  {
    twitterClient: new KaitoTwitterAPI({
      apiKey: process.env.TWITTERAPI_IO_KEY,
    }),
    concurrency: 8,
    dailyTweetLimit: 800_000,
  },
  createDb(),
);

await scraper.runScraper(() => false);
