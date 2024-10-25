import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { and, eq, sql } from "@commune-ts/db";
import {
  commentInteractionSchema,
  commentReportSchema,
  proposalCommentDigestView,
  proposalCommentSchema,
} from "@commune-ts/db/schema";
import {
  COMMENT_INTERACTION_INSERT_SCHEMA,
  COMMENT_REPORT_INSERT_SCHEMA,
  PROPOSAL_COMMENT_INSERT_SCHEMA,
} from "@commune-ts/db/validation";

import { authenticatedProcedure, publicProcedure } from "../trpc";

export const proposalCommentRouter = {
  // GET
  byId: publicProcedure
    .input(
      z.object({
        proposalId: z.number(),
        type: z.enum(["PROPOSAL", "DAO"] as const),
      }),
    )
    .query(({ ctx, input }) => {
      return ctx.db
        .select()
        .from(proposalCommentDigestView)
        .where(
          and(
            eq(proposalCommentDigestView.proposalId, input.proposalId),
            eq(proposalCommentDigestView.governanceModel, input.type),
          ),
        )
        .execute();
    }),
  byUserId: publicProcedure
    .input(z.object({ proposalId: z.number(), userKey: z.string() }))
    .query(async ({ ctx, input }) => {
      const votes = await ctx.db
        .select({
          commentId: commentInteractionSchema.commentId,
          voteType: commentInteractionSchema.voteType,
        })
        .from(commentInteractionSchema)
        .where(
          sql`${commentInteractionSchema.userKey} = ${input.userKey} AND ${commentInteractionSchema.commentId} IN (
          SELECT id FROM ${proposalCommentSchema} WHERE ${proposalCommentSchema.proposalId} = ${input.proposalId}
        )`,
        );
      return votes.reduce(
        (acc, vote) => {
          acc[vote.commentId] = vote.voteType;
          return acc;
        },
        {} as Record<string, string>,
      );
    }),
  byReport: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.commentReportSchema.findMany();
  }),
  // POST
  createComment: authenticatedProcedure
    .input(PROPOSAL_COMMENT_INSERT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const userKey = ctx.sessionData!.userKey;
      await ctx.db.insert(proposalCommentSchema).values({ ...input, userKey });
    }),
  createCommentReport: authenticatedProcedure
    .input(COMMENT_REPORT_INSERT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const userKey = ctx.sessionData!.userKey;
      await ctx.db.insert(commentReportSchema).values({ ...input, userKey });
    }),
  castVote: authenticatedProcedure
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
            voteType: input.voteType,
          },
        });
    }),
  deleteVote: authenticatedProcedure
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
