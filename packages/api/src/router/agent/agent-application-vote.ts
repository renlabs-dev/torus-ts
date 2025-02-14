import { authenticatedProcedure, publicProcedure } from "../../trpc";
import { and, eq, isNull, sql } from "@torus-ts/db";
import { agentApplicationVoteSchema } from "@torus-ts/db/schema";
import { AGENT_APPLICATION_VOTE_INSERT_SCHEMA } from "@torus-ts/db/validation";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

export const agentApplicationVoteRouter = {
  // GET
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.agentApplicationVoteSchema.findFirst({
        where: and(
          eq(agentApplicationVoteSchema.id, input.id),
          isNull(agentApplicationVoteSchema.deletedAt),
        ),
      });
    }),
  byApplicationId: publicProcedure
    .input(AGENT_APPLICATION_VOTE_INSERT_SCHEMA.pick({ applicationId: true }))
    .query(({ ctx, input }) => {
      return ctx.db.query.agentApplicationVoteSchema.findMany({
        where: and(
          eq(agentApplicationVoteSchema.applicationId, input.applicationId),
          isNull(agentApplicationVoteSchema.deletedAt),
        ),
      });
    }),
  byUserKey: publicProcedure
    .input(z.object({ userKey: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.agentApplicationVoteSchema.findMany({
        where: and(
          eq(agentApplicationVoteSchema.userKey, input.userKey),
          isNull(agentApplicationVoteSchema.deletedAt),
        ),
      });
    }),
  // POST
  create: authenticatedProcedure
    .input(AGENT_APPLICATION_VOTE_INSERT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const userKey = ctx.sessionData!.userKey;

      await ctx.db
        .insert(agentApplicationVoteSchema)
        .values({
          applicationId: input.applicationId,
          userKey,
          vote: input.vote,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [
            agentApplicationVoteSchema.applicationId,
            agentApplicationVoteSchema.userKey,
          ],
          set: {
            vote: sql`excluded.vote`,
            updatedAt: sql`excluded.updated_at`,
          },
        })
        .returning({
          id: agentApplicationVoteSchema.id,
          vote: agentApplicationVoteSchema.vote,
          updatedAt: agentApplicationVoteSchema.updatedAt,
        });

      return { success: true };
    }),

  delete: authenticatedProcedure
    .input(AGENT_APPLICATION_VOTE_INSERT_SCHEMA.pick({ applicationId: true }))
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const userKey = ctx.sessionData!.userKey;
      await ctx.db
        .delete(agentApplicationVoteSchema)
        .where(
          and(
            eq(agentApplicationVoteSchema.userKey, userKey),
            eq(agentApplicationVoteSchema.applicationId, input.applicationId),
          ),
        );

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
