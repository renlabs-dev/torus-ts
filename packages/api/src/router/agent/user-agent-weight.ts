import type { TRPCRouterRecord } from "@trpc/server";

import "@torus-ts/db/schema";
import { authenticatedProcedure, publicProcedure } from "../../trpc";
import { z } from "zod";
import { agentSchema, userAgentWeightSchema } from "@torus-ts/db/schema";

import { eq } from "@torus-ts/db";
import { USER_AGENT_WEIGHT_INSERT_SCHEMA } from "@torus-ts/db/validation";

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
  // POST
  createMany: authenticatedProcedure
    .input(z.array(USER_AGENT_WEIGHT_INSERT_SCHEMA))
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const userKey = ctx.sessionData!.userKey;

      const dataToInsert = input.map((item) => ({
        agentKey: item.agentKey,
        weight: item.weight,
        userKey,
      }));

      await ctx.db.insert(userAgentWeightSchema).values(dataToInsert);
    }),
  delete: authenticatedProcedure
    .input(z.object({ userKey: z.string() }))
    .mutation(async ({ ctx }) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const userKey = ctx.sessionData!.userKey;
      await ctx.db
        .delete(userAgentWeightSchema)
        .where(eq(userAgentWeightSchema.userKey, userKey));
    }),
} satisfies TRPCRouterRecord;
