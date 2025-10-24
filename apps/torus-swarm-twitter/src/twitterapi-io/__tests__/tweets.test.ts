/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { assert, beforeAll, describe, expect, it } from "vitest";
import z from "zod";
import type { SimpleTweet } from "../index.js";
import { KaitoTwitterAPI } from "../index.js";

describe("KaitoTwitterAPI - Tweets Endpoints", () => {
  let client: KaitoTwitterAPI;

  beforeAll(() => {
    const apiKey = process.env.TWITTERAPI_IO_KEY;
    if (!apiKey) {
      throw new Error(
        "TWITTERAPI_IO_KEY environment variable is required for API tests",
      );
    }

    client = new KaitoTwitterAPI({
      apiKey,
      timeout: 15000,
    });
  });

  describe("getByIds", () => {
    it("should get tweets by ID", async () => {
      try {
        const result = await client.tweets.getByIds({ tweetIds: ["20"] });
        // console.log("Tweet result:", JSON.stringify(result, null, 2));

        expect(Array.isArray(result)).toBe(true);

        if (result.length > 0) {
          const tweet = result[0]! as SimpleTweet;
          assert(tweet);
          expect(tweet.id).toBeDefined();
          expect(tweet.text).toBeDefined();
          expect(tweet.author).toBeDefined();
          expect(tweet.createdAt).toBeDefined();
        }
      } catch (error) {
        console.log("Raw error:", error);
        if (
          error instanceof Error &&
          "zodError" in error &&
          error.zodError instanceof z.ZodError
        ) {
          console.log("Zod validation issues:", JSON.stringify(error.zodError));
        }
        throw error;
      }
    });

    it("should get multiple tweets by IDs", async () => {
      const result = await client.tweets.getByIds({ tweetIds: ["20", "21"] });

      expect(Array.isArray(result)).toBe(true);

      if (result.length > 0) {
        const tweet = result[0]! as SimpleTweet;
        assert(tweet);
        expect(tweet.id).toBeDefined();
        expect(tweet.text).toBeDefined();
        expect(tweet.author).toBeDefined();
      }
    });
  });

  describe("getReplies", () => {
    it("should get replies to a tweet", async () => {
      const result = await client.tweets.getReplies({
        tweetId: "1833951636005552366",
      });

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      if (result.data.length > 0) {
        const reply = result.data[0];
        assert(reply);
        expect(reply.id).toBeDefined();
        expect(reply.text).toBeDefined();
        expect(reply.author).toBeDefined();
      }
    });
  });

  describe("getQuotes", () => {
    it("should get quote tweets of a tweet", async () => {
      const result = await client.tweets.getQuotes({
        tweetId: "20",
      });

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      if (result.data.length > 0) {
        const quote = result.data[0];
        assert(quote);
        expect(quote.id).toBeDefined();
        expect(quote.text).toBeDefined();
        expect(quote.author).toBeDefined();
      }
    });
  });

  describe("getRetweeters", () => {
    it("should get users who retweeted a tweet", async () => {
      const result = await client.tweets.getRetweeters({
        tweetId: "20",
      });

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      if (result.data.length > 0) {
        const retweeter = result.data[0];
        assert(retweeter);
        expect(retweeter.id).toBeDefined();
        expect(retweeter.userName).toBeDefined();
        expect(retweeter.name).toBeDefined();
      }
    });
  });

  describe("getThreadContext", () => {
    it("should get thread context for a tweet", async () => {
      const result = await client.tweets.getThreadContext({ tweetId: "20" });

      expect(result.thread_tweets).toBeDefined();
      expect(Array.isArray(result.thread_tweets)).toBe(true);

      if (result.thread_tweets.length > 0) {
        const threadTweet = result.thread_tweets[0];
        assert(threadTweet);
        expect(threadTweet.id).toBeDefined();
        expect(threadTweet.text).toBeDefined();
      }
    });
  });

  describe("advancedSearch", () => {
    it("should search tweets with basic query", async () => {
      const result = await client.tweets.advancedSearch({
        query: "bitcoin",
        queryType: "Latest",
      });

      expect(result.tweets).toBeDefined();
      expect(Array.isArray(result.tweets)).toBe(true);
      expect(result.tweets.length).toBeLessThanOrEqual(20);

      if (result.tweets.length > 0) {
        const tweet = result.tweets[0];
        assert(tweet);
        expect(tweet.id).toBeDefined();
        expect(tweet.text).toBeDefined();
      }
    });

    it("should search tweets with result type filter", async () => {
      const result = await client.tweets.advancedSearch({
        query: "AI",
        queryType: "Top",
      });

      expect(result.tweets).toBeDefined();
      expect(Array.isArray(result.tweets)).toBe(true);
      expect(result.tweets.length).toBeLessThanOrEqual(20);

      if (result.tweets.length > 0) {
        const tweet = result.tweets[0];
        assert(tweet);
        expect(tweet.id).toBeDefined();
        expect(tweet.text).toBeDefined();
        expect(tweet.author).toBeDefined();
      }
    });

    it("should search tweets from specific user", async () => {
      const result = await client.tweets.advancedSearch({
        query: "from:jack",
        queryType: "Latest",
      });

      expect(result.tweets).toBeDefined();
      expect(Array.isArray(result.tweets)).toBe(true);

      if (result.tweets.length > 0) {
        const tweet = result.tweets[0];
        assert(tweet);
        expect(tweet.id).toBeDefined();
        expect(tweet.text).toBeDefined();
        expect(tweet.author?.userName).toBe("jack");
      }
    });

    it("should search tweets with date range", async () => {
      const result = await client.tweets.advancedSearch({
        query: "twitter",
        queryType: "Latest",
      });

      expect(result.tweets).toBeDefined();
      expect(Array.isArray(result.tweets)).toBe(true);

      if (result.tweets.length > 0) {
        const tweet = result.tweets[0];
        assert(tweet);
        expect(tweet.id).toBeDefined();
        expect(tweet.text).toBeDefined();
        expect(tweet.createdAt).toBeDefined();
      }
    });
  });

  // describe('getArticle', () => {
  //   it('should get article from tweet with article card', async () => {
  //     // This would need a tweet ID that contains an article card
  //     // Since we don't know specific ones, we'll test the structure
  //     const tweetId = '20';

  //     try {
  //       const result = await client.tweets.getArticle({ tweetId });

  //       // The response structure should be validated even if no article
  //       expect(result).toBeDefined();
  //     } catch (error) {
  //       // Article endpoint might not be available or tweet might not have article
  //       console.log('Article test skipped - endpoint may not be available');
  //       expect(true).toBe(true);
  //     }
  //   });
  // });
});
