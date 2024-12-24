import type { TRPCRouterRecord } from "@trpc/server";

import "@torus-ts/db/schema";
import { authenticatedProcedure, publicProcedure } from "../../trpc";
import { z } from "zod";
import { agentApplicationVoteSchema } from "@torus-ts/db/schema";
import { and, eq, isNull } from "@torus-ts/db";
import { AGENT_APPLICATION_VOTE_INSERT_SCHEMA } from "@torus-ts/db/validation";

export const agentApplicationVoteRouter = {
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.agentApplicationVoteSchema.findFirst({
        where: eq(agentApplicationVoteSchema.id, input.id),
      });
    }),
  byIdActive: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.agentApplicationVoteSchema.findMany({
        where: and(
          eq(agentApplicationVoteSchema.id, input.id),
          isNull(agentApplicationVoteSchema.deletedAt),
        ),
      });
    }),
  create: authenticatedProcedure
    .input(AGENT_APPLICATION_VOTE_INSERT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const userKey = ctx.sessionData!.userKey;
      await ctx.db
        .update(agentApplicationVoteSchema)
        .set({
          deletedAt: new Date(),
        })
        .where(
          and(
            eq(agentApplicationVoteSchema.userKey, userKey),
            eq(agentApplicationVoteSchema.applicationId, input.applicationId),
            isNull(agentApplicationVoteSchema.deletedAt),
          ),
        )
        .execute();

      await ctx.db
        .insert(agentApplicationVoteSchema)
        .values({ ...input, userKey: userKey })
        .execute();
    }),
  delete: authenticatedProcedure
    .input(z.object({ applicationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const userKey = ctx.sessionData!.userKey;
      await ctx.db
        .update(agentApplicationVoteSchema)
        .set({
          deletedAt: new Date(),
        })
        .where(
          and(
            eq(agentApplicationVoteSchema.userKey, userKey),
            eq(agentApplicationVoteSchema.applicationId, input.applicationId),
          ),
        );
    }),
} satisfies TRPCRouterRecord;
