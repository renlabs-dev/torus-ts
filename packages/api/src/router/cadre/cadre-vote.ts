import type { TRPCRouterRecord } from "@trpc/server";

import "@torus-ts/db/schema";

import { authenticatedProcedure } from "../../trpc";
import { CADRE_VOTE_INSERT_SCHEMA } from "@torus-ts/db/validation";
import { cadreVoteSchema } from "@torus-ts/db/schema";

export const cadreVoteRouter = {
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
