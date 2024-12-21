import type { TRPCRouterRecord } from "@trpc/server";

import { eq, max } from "@torus-ts/db";

import "@torus-ts/db/schema";

import { publicProcedure } from "../../trpc";
import {
  agentSchema,
  computedAgentAllocationSchema,
} from "@torus-ts/db/schema";

export const computedAgentWeightRouter = {
  // GET
  all: publicProcedure.query(async ({ ctx }) => {
    const lastBlock = ctx.db
      .select({ value: max(computedAgentAllocationSchema.atBlock) })
      .from(computedAgentAllocationSchema);
    return await ctx.db
      .select({
        agentKey: computedAgentAllocationSchema.agentKey,
        agentName: agentSchema.name,
        computedWeight: computedAgentAllocationSchema.computedWeight,
        percComputedWeight: computedAgentAllocationSchema.percComputedWeight,
      })
      .from(computedAgentAllocationSchema)
      .where(
        // sql`computed_module_weights.at_block = (SELECT MAX(computed_module_weights.at_block) FROM computed_module_weights)`,
        eq(computedAgentAllocationSchema.atBlock, lastBlock),
      )
      .innerJoin(
        agentSchema,
        eq(computedAgentAllocationSchema.agentKey, agentSchema.id),
      );
  }),
} satisfies TRPCRouterRecord;
