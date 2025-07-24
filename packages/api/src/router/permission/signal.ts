import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { and, eq, isNotNull, isNull } from "@torus-ts/db";
import {
  agentDemandSignalSchema,
  agentSchema,
  emissionDistributionTargetsSchema,
} from "@torus-ts/db/schema";
import { AGENT_DEMAND_SIGNAL_INSERT_SCHEMA } from "@torus-ts/db/validation";

import { authenticatedProcedure, publicProcedure } from "../../trpc";

export const signalRouter = {
  // GET
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.agentDemandSignalSchema.findMany({
      where: and(
        and(isNull(agentDemandSignalSchema.deletedAt)),
        eq(agentDemandSignalSchema.fulfilled, false),
      ),
    });
  }),
  fulfilled: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.agentDemandSignalSchema.findMany({
      where: and(
        isNull(agentDemandSignalSchema.deletedAt),
        eq(agentDemandSignalSchema.fulfilled, true),
      ),
    });
  }),
  deleted: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.agentDemandSignalSchema.findMany({
      where: and(
        isNotNull(agentDemandSignalSchema.deletedAt),
        eq(agentDemandSignalSchema.fulfilled, false),
      ),
    });
  }),
  byCreatorId: publicProcedure
    .input(z.object({ creatorId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.agentDemandSignalSchema.findMany({
        where: and(
          isNull(agentDemandSignalSchema.deletedAt),
          eq(agentDemandSignalSchema.agentKey, input.creatorId),
        ),
      });
    }),
  create: authenticatedProcedure
    .input(AGENT_DEMAND_SIGNAL_INSERT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      const agentKey = ctx.sessionData.userKey;

      // Check if user is a root agent or a target of emission permissions
      const [rootAgent, emissionTarget] = await Promise.all([
        // Check if user is a root agent
        ctx.db.query.agentSchema.findFirst({
          where: and(
            eq(agentSchema.key, agentKey),
            isNull(agentSchema.deletedAt),
          ),
        }),
        // Check if user is a target of any emission permission
        ctx.db.query.emissionDistributionTargetsSchema.findFirst({
          where: and(
            eq(emissionDistributionTargetsSchema.targetAccountId, agentKey),
            isNull(emissionDistributionTargetsSchema.deletedAt),
          ),
        }),
      ]);

      if (!rootAgent && !emissionTarget) {
        throw new Error(
          "Only root agents or targets of emission permissions can create signals",
        );
      }

      await ctx.db
        .insert(agentDemandSignalSchema)
        .values({ ...input, agentKey });
    }),
  delete: authenticatedProcedure
    .input(z.object({ signalId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userKey = ctx.sessionData.userKey;
      await ctx.db
        .update(agentDemandSignalSchema)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(agentDemandSignalSchema.id, input.signalId),
            eq(agentDemandSignalSchema.agentKey, userKey),
            isNull(agentDemandSignalSchema.deletedAt),
            eq(agentDemandSignalSchema.fulfilled, false),
          ),
        );
    }),
  fulfill: authenticatedProcedure
    .input(z.object({ signalId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const userKey = ctx.sessionData.userKey;
      await ctx.db
        .update(agentDemandSignalSchema)
        .set({ fulfilled: true })
        .where(
          and(
            eq(agentDemandSignalSchema.id, input.signalId),
            eq(agentDemandSignalSchema.agentKey, userKey),
            isNull(agentDemandSignalSchema.deletedAt),
            eq(agentDemandSignalSchema.fulfilled, false),
          ),
        );
    }),
} satisfies TRPCRouterRecord;
