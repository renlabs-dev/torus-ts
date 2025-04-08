import { and, eq, isNull, sql } from "@torus-ts/db";
import {
  commentDigestView,
  commentInteractionSchema,
  commentSchema,
} from "@torus-ts/db/schema";
import { COMMENT_INTERACTION_INSERT_SCHEMA } from "@torus-ts/db/validation";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { authenticatedProcedure, publicProcedure } from "../../trpc";

export const commentInteractionRouter = {
  // GET
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.commentInteractionSchema.findFirst({
        where: and(
          eq(commentInteractionSchema.id, input.id),
          isNull(commentInteractionSchema.deletedAt),
        ),
      });
    }),
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
          and(
            sql`${commentInteractionSchema.userKey} = ${input.userKey} AND ${commentSchema.itemId} = ${input.proposalId}`,
            isNull(commentInteractionSchema.deletedAt),
          ),
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
        .values({
          commentId: input.commentId,
          userKey,
          reactionType: input.reactionType,
        })
        .onConflictDoUpdate({
          target: [
            commentInteractionSchema.commentId,
            commentInteractionSchema.userKey,
          ],
          set: {
            reactionType: input.reactionType,
            updatedAt: new Date(),
          },
        });
      await ctx.db.refreshMaterializedView(commentDigestView);
    }),
  deleteReaction: authenticatedProcedure
    .input(COMMENT_INTERACTION_INSERT_SCHEMA.pick({ commentId: true }))
    .mutation(async ({ ctx, input }) => {
      const userKey = ctx.sessionData?.userKey;
      await ctx.db
        .delete(commentInteractionSchema)
        .where(
          sql`${commentInteractionSchema.commentId} = ${input.commentId} AND ${commentInteractionSchema.userKey} = ${userKey}`,
        );
      await ctx.db.refreshMaterializedView(commentDigestView);
    }),
} satisfies TRPCRouterRecord;
