import type { TRPCRouterRecord } from "@trpc/server";

import "@torus-ts/db/schema";

import { authenticatedProcedure, publicProcedure } from "../../trpc";

import { and, eq, isNull } from "@torus-ts/db";
import { penalizeAgentVotesSchema } from "@torus-ts/db/schema";
import { PENALTY_INSERT_SCHEMA } from "@torus-ts/db/validation";

export const penaltyRouter = {
  // GET
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.penalizeAgentVotesSchema.findMany({
      where: and(isNull(penalizeAgentVotesSchema.deletedAt)),
    });
  }),
  byAgentKey: publicProcedure
    .input(PENALTY_INSERT_SCHEMA.pick({ agentKey: true }))
    .query(({ ctx, input }) => {
      return ctx.db
        .select()
        .from(penalizeAgentVotesSchema)
        .where(and(eq(penalizeAgentVotesSchema.agentKey, input.agentKey)))
        .execute();
    }),
  // POST
  create: authenticatedProcedure
    .input(PENALTY_INSERT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const userKey = ctx.sessionData!.userKey;

      await ctx.db.insert(penalizeAgentVotesSchema).values({
        ...input,
        cadreKey: userKey,
      });
    }),
  // DELETE
  delete: authenticatedProcedure
    .input(PENALTY_INSERT_SCHEMA.pick({ agentKey: true }))
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const userKey = ctx.sessionData!.userKey;

      await ctx.db
        .delete(penalizeAgentVotesSchema)
        .where(
          and(
            eq(penalizeAgentVotesSchema.cadreKey, userKey),
            eq(penalizeAgentVotesSchema.agentKey, input.agentKey),
          ),
        );
      return { success: true };
    }),
} satisfies TRPCRouterRecord;
