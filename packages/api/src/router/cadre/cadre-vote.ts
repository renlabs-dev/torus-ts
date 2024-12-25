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
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.cadreVoteSchema.findFirst({
        where: and(
          eq(cadreVoteSchema.id, input.id),
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
} satisfies TRPCRouterRecord;
