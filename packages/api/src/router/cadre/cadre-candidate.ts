import { authenticatedProcedure, publicProcedure } from "../../trpc";
import { isNull } from "@torus-ts/db";
import { cadreCandidateSchema } from "@torus-ts/db/schema";
import { CADRE_CANDIDATE_INSERT_SCHEMA } from "@torus-ts/db/validation";
import type { TRPCRouterRecord } from "@trpc/server";

export const cadreCandidateRouter = {
  // GET
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.cadreCandidateSchema.findMany({
      where: isNull(cadreCandidateSchema.deletedAt),
    });
  }),
  // POST
  create: authenticatedProcedure
    .input(CADRE_CANDIDATE_INSERT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      const userKey = ctx.sessionData!.userKey;
      const [insertedCandidate] = await ctx.db
        .insert(cadreCandidateSchema)
        .values({ ...input, userKey })
        .execute();
      if (insertedCandidate) {
        throw new Error("Failed to create candidate");
      }

      return insertedCandidate;
    }),
} satisfies TRPCRouterRecord;
