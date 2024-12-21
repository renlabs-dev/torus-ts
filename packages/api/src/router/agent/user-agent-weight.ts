import type { TRPCRouterRecord } from "@trpc/server";

import "@torus-ts/db/schema";
import { publicProcedure } from "../../trpc";
import { z } from "zod";
import { agentSchema, userAgentWeightSchema } from "@torus-ts/db/schema";

import { eq } from "@torus-ts/db";

export const userAgentWeightRouter = {
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
          userAgentWeightSchema,
          eq(userAgentWeightSchema.id, userAgentWeightSchema.userKey),
        )
        .where(eq(userAgentWeightSchema.userKey, input.userKey))
        .execute();
    }),
} satisfies TRPCRouterRecord;
