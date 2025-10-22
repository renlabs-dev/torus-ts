import { ilike } from "@torus-ts/db";
import { twitterUsersSchema } from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../trpc";

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
          .max(50, "Search query is too long"),
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { query, limit } = input;

      // Perform case-insensitive substring search
      // Use ILIKE for PostgreSQL case-insensitive search
      const users = await ctx.db
        .select({
          userId: twitterUsersSchema.id,
          username: twitterUsersSchema.username,
          screenName: twitterUsersSchema.screenName,
          description: twitterUsersSchema.description,
          avatarUrl: twitterUsersSchema.avatarUrl,
          isVerified: twitterUsersSchema.isVerified,
          verifiedType: twitterUsersSchema.verifiedType,
          followerCount: twitterUsersSchema.followerCount,
        })
        .from(twitterUsersSchema)
        .where(ilike(twitterUsersSchema.username, `%${query}%`))
        .limit(limit);

      return users;
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
} satisfies TRPCRouterRecord;
