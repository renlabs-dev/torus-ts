import { and, eq, isNull, sql } from "@torus-ts/db";
import { agentApplicationVoteSchema, userDiscordInfoSchema, cadreSchema } from "@torus-ts/db/schema";
import { AGENT_APPLICATION_VOTE_INSERT_SCHEMA } from "@torus-ts/db/validation";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { authenticatedProcedure, publicProcedure } from "../../trpc";

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
    return ctx.db
      .select({
        // Original vote fields
        id: agentApplicationVoteSchema.id,
        userKey: agentApplicationVoteSchema.userKey,
        vote: agentApplicationVoteSchema.vote,
        applicationId: agentApplicationVoteSchema.applicationId,
        createdAt: agentApplicationVoteSchema.createdAt,
        updatedAt: agentApplicationVoteSchema.updatedAt,
        deletedAt: agentApplicationVoteSchema.deletedAt,
        // Discord info from joined tables
        userName: userDiscordInfoSchema.userName,
        avatarUrl: userDiscordInfoSchema.avatarUrl,
      })
      .from(agentApplicationVoteSchema)
      .leftJoin(
        cadreSchema,
        eq(agentApplicationVoteSchema.userKey, cadreSchema.userKey)
      )
      .leftJoin(
        userDiscordInfoSchema,
        eq(cadreSchema.discordId, userDiscordInfoSchema.discordId)
      )
      .where(
        and(
          eq(agentApplicationVoteSchema.applicationId, input.applicationId),
          isNull(agentApplicationVoteSchema.deletedAt)
        )
      );
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
      const userKey = ctx.sessionData.userKey;

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
      const userKey = ctx.sessionData.userKey;
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
