/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { assert, beforeAll, describe, expect, it } from "vitest";
import { KaitoTwitterAPI } from "../index";

describe("KaitoTwitterAPI - Users Endpoints", () => {
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

  describe("getInfo", () => {
    it("should handle unavailable/suspended users", async () => {
      // Test with a known suspended account
      const result = await client.users.getInfo({ userName: "twitter" });

      // Check if the response indicates the user is unavailable
      if (result?.unavailable) {
        expect(result.unavailable).toBe(true);
        expect(result.message).toBeDefined();
        expect(result.unavailableReason).toBeDefined();
      }
    });

    it("should get info for an available user", async () => {
      // Test with a known active account
      const result = await client.users.getInfo({ userName: "elonmusk" });

      // If user is available, check for required fields
      if (result && !result.unavailable) {
        expect(result.userName).toBe("elonmusk");
        expect(result.id).toBeDefined();
        expect(result.name).toBeDefined();
        expect(result.followers).toBeGreaterThan(0);
        expect(result.following).toBeGreaterThanOrEqual(0);
        expect(result.profilePicture).toMatch(/^https?:\/\//);
        expect(result.createdAt).toBeDefined();
        expect(result.isBlueVerified).toBeDefined();
      }
    });

    it("should get info for another available user", async () => {
      // Test with another known active account
      const result = await client.users.getInfo({ userName: "jack" });

      if (result && !result.unavailable) {
        expect(result.userName).toBe("jack");
        expect(result.id).toBeDefined();
        expect(result.name).toBeDefined();
        expect(result.followers).toBeGreaterThan(0);
        expect(result.url).toMatch(/^https?:\/\//);
        expect(result.statusesCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("search", () => {
    it.skip("should search for users by keyword (API returns 500 internal error)", async () => {
      const result = await client.users.search({
        keyword: "developer",
        limit: 5,
      });

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(5);

      if (result.data.length > 0) {
        const firstUser = result.data[0]!;
        assert(firstUser);
        expect(firstUser.id).toBeDefined();
        expect(firstUser.userName).toBeDefined();
        expect(firstUser.name).toBeDefined();
      }
    });

    it.skip("should handle pagination with cursor (API returns 500 internal error)", async () => {
      const firstPage = await client.users.search({
        keyword: "tech",
        limit: 2,
      });

      expect(firstPage.data).toBeDefined();

      if (firstPage.cursor) {
        const secondPage = await client.users.search({
          keyword: "tech",
          limit: 2,
          cursor: firstPage.cursor,
        });

        expect(secondPage.data).toBeDefined();
        // Check that we got different users
        if (firstPage.data.length > 0 && secondPage.data.length > 0) {
          assert(firstPage.data[0]);
          assert(secondPage.data[0]);
          expect(firstPage.data[0].id).not.toBe(secondPage.data[0].id);
        }
      }
    });
  });

  describe("getFollowers", () => {
    it("should get followers for a user", async () => {
      const result = await client.users.getFollowers({
        userName: "jack",
      });

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      if (result.data.length > 0) {
        const follower = result.data[0]!;
        assert(follower);
        expect(follower.id).toBeDefined();
        expect(follower.userName).toBeDefined();
        expect(follower.name).toBeDefined();
        expect(follower.profilePicture).toBeDefined();
      }
    });
  });

  describe("getFollowings", () => {
    it("should get users that a user follows", async () => {
      const result = await client.users.getFollowings({
        userName: "jack",
      });

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);

      if (result.data.length > 0) {
        const following = result.data[0]!;
        assert(following);
        expect(following.id).toBeDefined();
        expect(following.userName).toBeDefined();
        expect(following.name).toBeDefined();
      }
    });
  });

  describe("checkFollowRelationship", () => {
    it.skip("should check follow relationship between two users (API returns 500 internal error)", async () => {
      const result = await client.users.checkFollowRelationship({
        sourceUserName: "jack",
        targetUserName: "elonmusk",
      });

      expect(result).toBeDefined();
      expect(typeof result.following).toBe("boolean");
      expect(typeof result.followed_by).toBe("boolean");
    });
  });

  describe("getLastTweets", () => {
    it("should get recent tweets from a user", async () => {
      const result = await client.users.getLastTweets({
        userName: "elonmusk",
      });

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(20);

      if (result.data.length > 0) {
        const tweet = result.data[0]!;
        assert(tweet);
        expect(tweet.id).toBeDefined();
        expect(tweet.text).toBeDefined();
        expect(tweet.createdAt || tweet.created_at).toBeDefined();
      }
    });
  });
});
