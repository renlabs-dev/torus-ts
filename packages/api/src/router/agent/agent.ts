import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { eq, and, max } from "@torus-ts/db";

import "@torus-ts/db/schema";
import { agentSchema } from "@torus-ts/db/schema";
import { publicProcedure } from "../../trpc";

export const agentRouter = {
  // GET
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.agentSchema.findMany({
      where: eq(agentSchema.isWhitelisted, true),
    });
  }),
  allPaginated: publicProcedure
    .input(z.object({ limit: z.number(), offset: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.agentSchema.findMany({
        limit: input.offset,
        offset: input.limit,
        where: eq(agentSchema.isWhitelisted, true),
      });
    }),
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.agentSchema.findFirst({
        where: eq(agentSchema.id, input.id),
      });
    }),
  byKeyLastBlock: publicProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ ctx, input }) => {
      const lastBlock = ctx.db
        .select({ value: max(agentSchema.atBlock) })
        .from(agentSchema);
      const result = await ctx.db
        .select()
        .from(agentSchema)
        .where(
          and(
            // sql`${agentSchema.atBlock} = (SELECT MAX(${agentSchema.atBlock}) FROM ${agentSchema})`
            eq(agentSchema.atBlock, lastBlock),
            eq(agentSchema.key, input.key),
          ),
        )
        .limit(1);
      return result[0];
    }),
} satisfies TRPCRouterRecord;
