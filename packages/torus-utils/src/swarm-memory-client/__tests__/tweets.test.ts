import { assert, beforeEach, describe, expect, it } from "vitest";
import { TweetsEndpoint } from "../endpoints/tweets.js";
import type { ListTweetsParams } from "../schemas/tweet.js";
import { SwarmMemoryClient } from "../swarm-client.js";

// Test mnemonic - Alice from Substrate
const TEST_MNEMONIC =
  "bottom drive obey lake curtain smoke basket hold race lonely fit walk";

describe("TweetsEndpoint - Real API", () => {
  let client: SwarmMemoryClient;
  let tweetsEndpoint: TweetsEndpoint;

  beforeEach(async () => {
    client = await SwarmMemoryClient.fromMnemonic({
      mnemonic: TEST_MNEMONIC,
    });

    tweetsEndpoint = client.tweets;
  });

  describe("list tweets", () => {
    it("should list tweets without parameters", async () => {
      const tweets = await tweetsEndpoint.list();

      expect(Array.isArray(tweets)).toBe(true);
      console.log(`Retrieved ${tweets.length} tweets`);

      if (tweets.length > 0) {
        const firstTweet = tweets[0];
        assert(firstTweet);
        expect(firstTweet).toHaveProperty("id");
        expect(firstTweet).toHaveProperty("tweet_id");
        expect(firstTweet).toHaveProperty("author_twitter_username");
        expect(firstTweet).toHaveProperty("full_text");
        expect(firstTweet).toHaveProperty("inserted_by_address");
        console.log("First tweet:", {
          id: firstTweet.id,
          tweet_id: firstTweet.tweet_id,
          author: firstTweet.author_twitter_username,
          text_preview: `${firstTweet.full_text.substring(0, 50)}...`,
        });
      }
    }, 15000);

    it("should list tweets with limit parameter", async () => {
      const params: ListTweetsParams = {
        limit: 5,
      };

      const tweets = await tweetsEndpoint.list(params);

      expect(Array.isArray(tweets)).toBe(true);
      expect(tweets.length).toBeLessThanOrEqual(5);
      console.log(`Retrieved ${tweets.length} tweets with limit=5`);
    }, 15000);

    it("should list tweets with sort order", async () => {
      const paramsDesc: ListTweetsParams = {
        limit: 3,
        sort_order: "desc",
      };

      const tweetsDesc = await tweetsEndpoint.list(paramsDesc);
      expect(Array.isArray(tweetsDesc)).toBe(true);
      console.log(`Retrieved ${tweetsDesc.length} tweets sorted desc`);

      if (tweetsDesc.length > 1) {
        // Check that tweets are sorted by ID in descending order
        const ids = tweetsDesc.map((t) => t.id);
        console.log("Tweet IDs (desc):", ids);
        for (let i = 0; i < ids.length - 1; i++) {
          const next = ids[i + 1];
          assert(next);
          expect(ids[i]).toBeGreaterThanOrEqual(next);
        }
      }
    }, 15000);

    // // This is insertion time in the database (`inserted_at`)
    // it("should list tweets with date range", async () => {
    //   // Get tweets from last 30 days
    //   const thirtyDaysAgo = new Date();
    //   thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    //   const params: ListTweetsParams = {
    //     from: thirtyDaysAgo.toISOString(),
    //     limit: 10,
    //   };
    //   const tweets = await tweetsEndpoint.list(params);
    //   expect(Array.isArray(tweets)).toBe(true);
    //   console.log(`Retrieved ${tweets.length} tweets from last 30 days`);
    //   // All tweets should be from after the from date
    //   tweets.forEach((tweet) => {
    //     const tweetDate = new Date(tweet.tweet_timestamp);
    //     expect(tweetDate.getTime()).toBeGreaterThanOrEqual(thirtyDaysAgo.getTime());
    //   });
    // }, 15000);

    it("should validate list parameters", async () => {
      const invalidParams = {
        limit: -1, // Invalid: negative limit
      } as ListTweetsParams;

      await expect(tweetsEndpoint.list(invalidParams)).rejects.toThrow();
    });

    it("should handle offset pagination", async () => {
      const firstPage = await tweetsEndpoint.list({ limit: 5, offset: 0 });
      const secondPage = await tweetsEndpoint.list({ limit: 5, offset: 5 });

      expect(Array.isArray(firstPage)).toBe(true);
      expect(Array.isArray(secondPage)).toBe(true);

      console.log(`First page: ${firstPage.length} tweets`);
      console.log(`Second page: ${secondPage.length} tweets`);

      // Ensure pages don't overlap (assuming there are at least 10 tweets)
      if (firstPage.length === 5 && secondPage.length > 0) {
        const firstPageIds = new Set(firstPage.map((t) => t.id));
        const secondPageIds = new Set(secondPage.map((t) => t.id));

        // No overlap between pages
        for (const id of secondPageIds) {
          expect(firstPageIds.has(id)).toBe(false);
        }
      }
    }, 15000);
  });

  describe("search functionality", () => {
    it("should search tweets by text query", async () => {
      const tweets = await tweetsEndpoint.search("the", { limit: 5 });

      expect(Array.isArray(tweets)).toBe(true);
      console.log(`Search for "the" returned ${tweets.length} tweets`);

      // Verify search results contain the query term (case-insensitive)
      tweets.forEach((tweet) => {
        expect(tweet.full_text.toLowerCase()).toMatch(/the/);
      });
    }, 15000);

    it("should search tweets with additional filters", async () => {
      const tweets = await tweetsEndpoint.search("bitcoin", {
        limit: 3,
        sort_order: "desc",
      });

      expect(Array.isArray(tweets)).toBe(true);
      console.log(`Search for "bitcoin" returned ${tweets.length} tweets`);
    }, 15000);
  });

  describe("recent tweets", () => {
    it("should get recent tweets (last 24 hours)", async () => {
      const tweets = await tweetsEndpoint.getRecent({ limit: 10 });

      expect(Array.isArray(tweets)).toBe(true);
      console.log(`Found ${tweets.length} recent tweets (last 24 hours)`);

      // All tweets should be from the last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      tweets.forEach((tweet) => {
        const tweetDate = new Date(tweet.tweet_timestamp);
        expect(tweetDate.getTime()).toBeGreaterThanOrEqual(yesterday.getTime());
      });
    }, 15000);
  });

  describe("client integration", () => {
    it("should be accessible from main client", () => {
      expect(client.tweets).toBeInstanceOf(TweetsEndpoint);
      expect(typeof client.tweets.list).toBe("function");
      expect(typeof client.tweets.search).toBe("function");
      expect(typeof client.tweets.getRecent).toBe("function");
    });

    it("should share client instance", () => {
      expect(client.tweets.client).toBe(client);
    });

    it("should get wallet address", async () => {
      const address = await client.getWalletAddress();
      expect(typeof address).toBe("string");
      expect(address).toMatch(/^[a-zA-Z0-9]{47,48}$/); // Substrate address format
      console.log("Client wallet address:", address);
    }, 10000);

    it("should perform health check", async () => {
      const isHealthy = await client.healthCheck();
      expect(typeof isHealthy).toBe("boolean");
      console.log("Health check result:", isHealthy);
    }, 15000);
  });

  describe("error handling", () => {
    it("should handle invalid search queries gracefully", async () => {
      // Empty search query
      const tweets = await tweetsEndpoint.search("");
      expect(Array.isArray(tweets)).toBe(true);
    }, 10000);

    it("should handle large date ranges", async () => {
      // Very old date
      const oldDate = new Date("2020-01-01T00:00:00.000Z");
      const tweets = await tweetsEndpoint.list({
        from: oldDate.toISOString(),
        limit: 5,
      });

      expect(Array.isArray(tweets)).toBe(true);
      console.log(`Found ${tweets.length} tweets since 2020`);
    }, 15000);
  });
});
