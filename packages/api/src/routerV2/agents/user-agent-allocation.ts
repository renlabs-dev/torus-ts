import type { TRPCRouterRecord } from "@trpc/server";

import "@torus-ts/db/schema";
import { publicProcedure } from "../../trpc";
import { z } from "zod";
import { agentSchema, userAgentAllocationSchema } from "@torus-ts/db/schema";

import { eq } from "@torus-ts/db";

export const computedAgentWeightRouter = {
  // GET
  byUserKey: publicProcedure
    .input(z.object({ userKey: z.string() }))
    .query(async ({ ctx, input }) => {
      // Query agent table joining it with user user_agent_allocation table and
      // filtering by userKey
      return await ctx.db
        .select()
        .from(agentSchema)
        .innerJoin(
          userAgentAllocationSchema,
          eq(userAgentAllocationSchema.id, userAgentAllocationSchema.userKey),
        )
        .where(eq(userAgentAllocationSchema.userKey, input.userKey))
        .execute();
    }),
} satisfies TRPCRouterRecord;
