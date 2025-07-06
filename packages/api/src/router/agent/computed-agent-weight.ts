import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { and, eq, gte, isNull, max } from "@torus-ts/db";
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

      console.log(result);

      if (!result) {
        return null;
      }

      return result;
    }),
} satisfies TRPCRouterRecord;
