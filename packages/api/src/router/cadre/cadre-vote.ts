import type { TRPCRouterRecord } from "@trpc/server";

import "@torus-ts/db/schema";

import { authenticatedProcedure, publicProcedure } from "../../trpc";
import { CADRE_VOTE_INSERT_SCHEMA } from "@torus-ts/db/validation";
import { cadreVoteSchema } from "@torus-ts/db/schema";
import { z } from "zod";
import { and, eq, isNull } from "@torus-ts/db";

export const cadreVoteRouter = {
  // GET
  byId: publicProcedure
    .input(CADRE_VOTE_INSERT_SCHEMA.pick({ applicantKey: true }))
    .query(({ ctx, input }) => {
      return ctx.db.query.cadreVoteSchema.findMany({
        where: and(
          eq(cadreVoteSchema.applicantKey, input.applicantKey),
          isNull(cadreVoteSchema.deletedAt),
        ),
      });
    }),
  // POST
  create: authenticatedProcedure
    .input(CADRE_VOTE_INSERT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const userKey = ctx.sessionData!.userKey;
      await ctx.db
        .insert(cadreVoteSchema)
        .values({ ...input, userKey: userKey })
        .execute();
    }),
    // DELETE
  delete: authenticatedProcedure
    .input(CADRE_VOTE_INSERT_SCHEMA.pick({ applicantKey: true }))
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const userKey = ctx.sessionData!.userKey;

      await ctx.db
        .delete(cadreVoteSchema)
        .where(
          and(eq(cadreVoteSchema.userKey, userKey), eq(cadreVoteSchema.applicantKey, input.applicantKey))
          
        )
        .execute();
    }),
} satisfies TRPCRouterRecord;
