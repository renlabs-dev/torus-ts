import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { and, eq, gte, inArray, isNull, max } from "@torus-ts/db";
import { agentSchema, computedAgentWeightSchema } from "@torus-ts/db/schema";

import { publicProcedure } from "../../trpc";

export const computedAgentWeightRouter = {
  // GET
  all: publicProcedure.query(async ({ ctx }) => {
    const lastBlock = await ctx.db
      .select({ value: max(computedAgentWeightSchema.atBlock) })
      .from(computedAgentWeightSchema)
      .limit(1);

    if (!lastBlock[0]?.value) {
      return [];
    }

    return await ctx.db
      .select({
        agentKey: computedAgentWeightSchema.agentKey,
        agentName: agentSchema.name,
        computedWeight: computedAgentWeightSchema.computedWeight,
        percComputedWeight: computedAgentWeightSchema.percComputedWeight,
        weightFactor: agentSchema.weightFactor,
      })
      .from(computedAgentWeightSchema)
      .where(
        and(
          gte(computedAgentWeightSchema.atBlock, lastBlock[0].value),
          isNull(computedAgentWeightSchema.deletedAt),
        ),
      )
      .innerJoin(
        agentSchema,
        and(
          eq(computedAgentWeightSchema.agentKey, agentSchema.key),
          isNull(agentSchema.deletedAt),
        ),
      );
  }),
  byAgentKey: publicProcedure
    .input(z.object({ agentKey: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.computedAgentWeightSchema.findFirst({
        where: and(
          eq(computedAgentWeightSchema.agentKey, input.agentKey),
          isNull(computedAgentWeightSchema.deletedAt),
        ),
      });

      if (!result) {
        return null;
      }

      return result;
    }),
  byAgentKeys: publicProcedure
    .input(z.object({ agentKeys: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      if (input.agentKeys.length === 0) {
        return {};
      }

      const results = await ctx.db.query.computedAgentWeightSchema.findMany({
        where: and(
          inArray(computedAgentWeightSchema.agentKey, input.agentKeys),
          isNull(computedAgentWeightSchema.deletedAt),
        ),
      });

      // Convert to map for easy lookup
      const resultMap: Record<string, typeof results[0] | null> = {};
      input.agentKeys.forEach(key => {
        resultMap[key] = results.find(r => r.agentKey === key) || null;
      });

      return resultMap;
    }),
} satisfies TRPCRouterRecord;
