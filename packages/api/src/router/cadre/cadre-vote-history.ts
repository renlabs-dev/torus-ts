import type { TRPCRouterRecord } from "@trpc/server";

import "@torus-ts/db/schema";

import { publicProcedure } from "../../trpc";
import { cadreVoteHistory } from "@torus-ts/db/schema";
import {  isNull } from "@torus-ts/db";

export const cadreVoteHistoryRouter = {
  // GET
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.cadreVoteHistory.findMany({
      where: isNull(cadreVoteHistory.deletedAt),
    });
  }),
} satisfies TRPCRouterRecord;
