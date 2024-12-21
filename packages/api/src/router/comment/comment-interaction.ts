import type { TRPCRouterRecord } from "@trpc/server";

import "@torus-ts/db/schema";

import { eq, sql } from "@torus-ts/db";

import { authenticatedProcedure, publicProcedure } from "../../trpc";
import { z } from "zod";

import { commentInteractionSchema, commentSchema } from "@torus-ts/db/schema";
import { COMMENT_INTERACTION_INSERT_SCHEMA } from "@torus-ts/db/validation";

export const commentInteractionRouter = {
  // GET
  byUserId: publicProcedure
    .input(z.object({ proposalId: z.number(), userKey: z.string() }))
    .query(async ({ ctx, input }) => {
      const reactions = await ctx.db
        .select({
          commentId: commentInteractionSchema.commentId,
          reactionType: commentInteractionSchema.reactionType,
        })
        .from(commentInteractionSchema)
        .innerJoin(
          commentSchema,
          eq(commentSchema.id, commentInteractionSchema.commentId),
        )
        .where(
          sql`${commentInteractionSchema.userKey} = ${input.userKey} AND ${commentSchema.itemId} = ${input.proposalId}`,
        );

      return Object.fromEntries(
        reactions.map((reaction) => [
          reaction.commentId,
          reaction.reactionType,
        ]),
      );
    }),
  // POST
  reaction: authenticatedProcedure
    .input(COMMENT_INTERACTION_INSERT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const userKey = ctx.sessionData!.userKey;
      await ctx.db
        .insert(commentInteractionSchema)
        .values({ ...input, userKey })
        .onConflictDoUpdate({
          target: [
            commentInteractionSchema.commentId,
            commentInteractionSchema.userKey,
          ],
          set: {
            reactionType: input.reactionType,
          },
        });
    }),
  deleteReaction: authenticatedProcedure
    .input(z.object({ commentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userKey = ctx.sessionData?.userKey;
      await ctx.db
        .delete(commentInteractionSchema)
        .where(
          sql`${commentInteractionSchema.commentId} = ${input.commentId} AND ${commentInteractionSchema.userKey} = ${userKey}`,
        );
    }),
} satisfies TRPCRouterRecord;
