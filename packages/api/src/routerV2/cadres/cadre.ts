import type { TRPCRouterRecord } from "@trpc/server";

import "@torus-ts/db/schema";

import { publicProcedure } from "../../trpc";

export const cadreVoteeRouter = {
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.cadreSchema.findMany();
  }),
} satisfies TRPCRouterRecord;
