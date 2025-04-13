import { and, eq, isNull } from "@torus-ts/db";
import { cadreVoteSchema } from "@torus-ts/db/schema";
import { CADRE_VOTE_INSERT_SCHEMA } from "@torus-ts/db/validation";
import type { TRPCRouterRecord } from "@trpc/server";
import { authenticatedProcedure, publicProcedure } from "../../trpc";

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
      const userKey = ctx.sessionData.userKey;
      await ctx.db
        .insert(cadreVoteSchema)
        .values({ ...input, userKey: userKey })
        .execute();
    }),
  // DELETE
  delete: authenticatedProcedure
    .input(CADRE_VOTE_INSERT_SCHEMA.pick({ applicantKey: true }))
    .mutation(async ({ ctx, input }) => {
      const userKey = ctx.sessionData.userKey;

      await ctx.db
        .delete(cadreVoteSchema)
        .where(
          and(
            eq(cadreVoteSchema.userKey, userKey),
            eq(cadreVoteSchema.applicantKey, input.applicantKey),
          ),
        )
        .execute();
    }),
} satisfies TRPCRouterRecord;
