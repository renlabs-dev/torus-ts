import { daoWhitelistSchema } from "@torus-ts/db/schema";
import { eq } from "@torus-ts/db";
import { DAO_WHITELIST_INSERT_SCHEMA } from "@torus-ts/db/validation";
import type { TRPCRouterRecord } from "@trpc/server";
import { authenticatedProcedure, publicProcedure } from "../../trpc";
import { z } from "zod";

export const daoWhitelistRouter = {
  // GET
  byAgentKey: publicProcedure
    .input(z.object({ agentKey: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.daoWhitelistSchema.findFirst({
        where: eq(daoWhitelistSchema.agentKey, input.agentKey),
      });
    }),
  // POST
  create: authenticatedProcedure
    .input(DAO_WHITELIST_INSERT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(daoWhitelistSchema)
        .values({
          agentKey: input.agentKey,
        })
        .execute();

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
