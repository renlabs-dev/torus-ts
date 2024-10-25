import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { and, asc, desc, eq, sql } from "@commune-ts/db";
import {
  forumCategoriesSchema,
  forumCommentSchema,
  forumPostDigestView,
  forumPostSchema,
  forumPostViewCountSchema,
  forumPostVotesSchema,
} from "@commune-ts/db/schema";

import { authenticatedProcedure, publicProcedure } from "../trpc";

let cachedCategories:
  | { id: number; name: string; description?: string }[]
  | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour in milliseconds

export const forumRouter = {
  // GET
  all: publicProcedure
    .input(
      z.object({
        sortOrder: z.enum(["ASC", "DESC"]).default("DESC"),
        sortBy: z.enum(["createdAt", "upvotes"]).default("createdAt"),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(15),
        categoryId: z.number().nullable().default(null),
      }),
    )
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;

      const whereConditions = [];

      if (input.categoryId !== null) {
        whereConditions.push(
          eq(forumPostDigestView.categoryId, input.categoryId),
        );
      }

      const sortByColumn =
        input.sortBy === "createdAt"
          ? forumPostDigestView.createdAt
          : forumPostDigestView.upvotes;

      const totalPostsResult = await ctx.db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(forumPostDigestView)
        .where(
          whereConditions.length > 0 ? and(...whereConditions) : undefined,
        );

      const totalPosts = totalPostsResult[0]?.count ?? 0;

      const posts = await ctx.db
        .select({
          id: forumPostDigestView.id,
          title: forumPostDigestView.title,
          userKey: forumPostDigestView.userKey,
          isAnonymous: forumPostDigestView.isAnonymous,
          categoryName: forumPostDigestView.categoryName,
          href: forumPostDigestView.href,
          createdAt: forumPostDigestView.createdAt,
          downvotes: forumPostDigestView.downvotes,
          upvotes: forumPostDigestView.upvotes,
          categoryId: forumPostDigestView.categoryId,
          isPinned: forumPostDigestView.isPinned,
          commentCount: forumPostDigestView.commentCount,
          viewCount: forumPostViewCountSchema.viewCount,
        })
        .from(forumPostDigestView)
        .leftJoin(
          forumPostViewCountSchema,
          eq(forumPostDigestView.id, forumPostViewCountSchema.postId),
        )
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(
          desc(forumPostDigestView.isPinned),
          input.sortOrder === "DESC" ? desc(sortByColumn) : asc(sortByColumn),
        )
        .limit(input.pageSize)
        .offset(offset);

      const totalPages = Math.ceil(totalPosts / input.pageSize);

      return {
        posts,
        totalPosts,
        totalPages,
      };
    }),
  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          id: forumPostDigestView.id,
          title: forumPostDigestView.title,
          userKey: forumPostDigestView.userKey,
          isAnonymous: forumPostDigestView.isAnonymous,
          categoryName: forumPostDigestView.categoryName,
          href: forumPostDigestView.href,
          content: forumPostDigestView.content,
          createdAt: forumPostDigestView.createdAt,
          downvotes: forumPostDigestView.downvotes,
          upvotes: forumPostDigestView.upvotes,
          categoryId: forumPostDigestView.categoryId,
          isPinned: forumPostDigestView.isPinned,
          commentCount: forumPostDigestView.commentCount,
          viewCount: forumPostViewCountSchema.viewCount,
        })
        .from(forumPostDigestView)
        .leftJoin(
          forumPostViewCountSchema,
          eq(forumPostDigestView.id, forumPostViewCountSchema.postId),
        )
        .where(eq(forumPostDigestView.id, input.id))
        .limit(1);
      return result[0] ?? null;
    }),

  getCommentsByPost: publicProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const comments = await ctx.db
        .select()
        .from(forumCommentSchema)
        .where(
          and(
            eq(forumCommentSchema.postId, input.postId),
            sql`${forumCommentSchema.deletedAt} IS NULL`,
          ),
        )
        .orderBy(asc(forumCommentSchema.createdAt));
      return comments;
    }),

  getCategories: publicProcedure.query(async ({ ctx }) => {
    try {
      const now = Date.now();
      if (cachedCategories && now - cacheTimestamp < CACHE_DURATION) {
        return cachedCategories;
      }

      const categories = await ctx.db
        .select({
          id: forumCategoriesSchema.id,
          name: forumCategoriesSchema.name,
        })
        .from(forumCategoriesSchema)
        .where(sql`${forumCategoriesSchema.deletedAt} IS NULL`)
        .orderBy(forumCategoriesSchema.name);

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      cachedCategories = categories;
      cacheTimestamp = now;

      return categories;
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw new Error("Something went wrong while fetching categories.");
    }
  }),

  // getViewsByPost: publicProcedure.input(z.object({postId: z.string()})).query(async ({ ctx, input }) => {
  //   try {
  //       const postViewCount = await ctx.db.query.forumPostViewCountSchema.findFirst({
  //         columns: {
  //           postId: true,
  //           viewCount: true,
  //         },
  //         where: eq(forumPostViewCountSchema.postId, input.postId),
  //       })

  //     return postViewCount;

  //   } catch (error) {
  //     console.error("Error fetching views by id:", error);
  //     throw new Error("Something went wrong while fetching views by id.");
  //   }
  // }),

  getPostVotesByUserId: publicProcedure
    .input(
      z.object({
        userKey: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const votes = await ctx.db.query.forumPostVotesSchema.findMany({
          where: input.userKey
            ? eq(forumPostVotesSchema.userKey, input.userKey)
            : undefined,
        });

        return votes;
      } catch (error) {
        console.error("Error fetching views by id:", error);
        throw new Error("Something went wrong while fetching views by id.");
      }
    }),

  getPostVotesByPostId: publicProcedure
    .input(
      z.object({
        postId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const votes = await ctx.db.query.forumPostVotesSchema.findMany({
          where: input.postId
            ? eq(forumPostVotesSchema.postId, input.postId)
            : undefined,
        });
        return votes;
      } catch (error) {
        console.error("Error fetching votes by post id:", error);
        throw new Error(
          "Something went wrong while fetching votes by post id.",
        );
      }
    }),

  // POST
  createPost: authenticatedProcedure
    .input(
      z.object({
        userKey: z.string(),
        isAnonymous: z.boolean().default(false),
        title: z.string().min(1),
        content: z.string().optional(),
        href: z.string().url().optional(),
        categoryId: z.number().int(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Ensure either content or href is provided, but not both
        if (!(input.content || input.href) || (input.content && input.href)) {
          throw new Error(
            "Either content or href must be provided, but not both.",
          );
        }

        // Validate that the categoryId exists and is not deleted
        const categoryExists = await ctx.db
          .select({ id: forumCategoriesSchema.id })
          .from(forumCategoriesSchema)
          .where(
            and(
              eq(forumCategoriesSchema.id, input.categoryId),
              sql`${forumCategoriesSchema.deletedAt} IS NULL`,
            ),
          )
          .limit(1);

        if (categoryExists.length === 0) {
          throw new Error("The provided categoryId does not exist.");
        }

        const newPost = await ctx.db
          .insert(forumPostSchema)
          .values({
            userKey: input.userKey,
            isAnonymous: input.isAnonymous,
            title: input.title,
            content: input.content,
            href: input.href,
            categoryId: input.categoryId,
          })
          .returning();

        return newPost[0];
      } catch (error) {
        console.error("Error creating post:", error);
        throw new Error("Something went wrong while creating the post.");
      }
    }),

  createComment: authenticatedProcedure
    .input(
      z.object({
        userKey: z.string(),
        postId: z.string().uuid(),
        content: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const newComment = await ctx.db
        .insert(forumCommentSchema)
        .values({
          postId: input.postId,
          userKey: input.userKey,
          content: input.content,
        })
        .returning();
      return newComment[0];
    }),

  votePost: authenticatedProcedure
    .input(
      z.object({
        userKey: z.string(),
        postId: z.string().uuid(),
        voteType: z.enum(["UPVOTE", "DOWNVOTE"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const existingVote = await ctx.db.query.forumPostVotesSchema.findFirst({
          where: and(
            eq(forumPostVotesSchema.postId, input.postId),
            eq(forumPostVotesSchema.userKey, input.userKey),
          ),
        });

        if (existingVote?.voteType === input.voteType) {
          await ctx.db
            .delete(forumPostVotesSchema)
            .where(eq(forumPostVotesSchema.id, existingVote.id));
          return { success: true };
        }

        if (existingVote) {
          await ctx.db
            .update(forumPostVotesSchema)
            .set({ voteType: input.voteType })
            .where(eq(forumPostVotesSchema.id, existingVote.id));
        } else {
          await ctx.db.insert(forumPostVotesSchema).values({
            postId: input.postId,
            userKey: input.userKey,
            voteType: input.voteType,
          });
        }

        return { success: true };
      } catch (error) {
        console.error("Error processing vote:", error);
        throw new Error("Something went wrong while processing the vote.");
      }
    }),

  // TODO: IMPLEMENT UPDATE COMMENTS FUNCTIONALITY
  // updateComment: authenticatedProcedure
  //   .input(
  //     z.object({
  //       userKey: z.string(),
  //       commentId: z.string().uuid(),
  //       content: z.string().min(1),
  //     })
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     const result = await ctx.db
  //       .update(forumCommentSchema)
  //       .set({ content: input.content })
  //       .where(
  //         and(
  //           eq(forumCommentSchema.id, input.commentId),
  //           eq(forumCommentSchema.userKey, input.userKey),
  //           sql`${forumCommentSchema.deletedAt} IS NULL`
  //         )
  //       );

  //     return { success: result.count > 0 };
  //   }),

  // TODO: IMPLEMENT DELETE COMMENTS FUNCTIONALITY
  // deleteComment: authenticatedProcedure
  //   .input(
  //     z.object({
  //       userKey: z.string(),
  //       commentId: z.string().uuid(),
  //     })
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     const result = await ctx.db
  //       .update(forumCommentSchema)
  //       .set({ deletedAt: new Date() })
  //       .where(
  //         and(
  //           eq(forumCommentSchema.id, input.commentId),
  //           eq(forumCommentSchema.userKey, input.userKey),
  //           sql`${forumCommentSchema.deletedAt} IS NULL`
  //         )
  //       );
  //     return { success: result.count > 0 };
  //   }),

  // TODO: IMPLEMENT PIN POST FUNCTIONALITY
  // pinPost: authenticatedProcedure // This should be restricted to admins
  //   .input(z.object({ postId: z.string().uuid(), isPinned: z.boolean() }))
  //   .mutation(async ({ ctx, input }) => {
  //     await ctx.db
  //       .update(forumPostSchema)
  //       .set({ isPinned: input.isPinned })
  //       .where(eq(forumPostSchema.id, input.postId));
  //     return { success: true };
  //   }),

  incrementViewCount: publicProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Ensure the post exists and is not deleted
      const postExists = await ctx.db
        .select({ id: forumPostSchema.id })
        .from(forumPostSchema)
        .where(
          and(
            eq(forumPostSchema.id, input.postId),
            sql`${forumPostSchema.deletedAt} IS NULL`,
          ),
        )
        .limit(1);

      if (postExists.length === 0) {
        throw new Error("The post does not exist.");
      }

      await ctx.db
        .insert(forumPostViewCountSchema)
        .values({ postId: input.postId, viewCount: 1 })
        .onConflictDoUpdate({
          target: forumPostViewCountSchema.postId,
          set: {
            viewCount: sql`${forumPostViewCountSchema.viewCount} + 1`,
          },
        });

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
