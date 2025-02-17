import { publicProcedure } from "../../trpc";
import { isNull } from "@torus-ts/db";
import { cadreVoteHistory } from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";

export const cadreVoteHistoryRouter = {
  // GET
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.cadreVoteHistory.findMany({
      where: isNull(cadreVoteHistory.deletedAt),
    });
  }),
} satisfies TRPCRouterRecord;
