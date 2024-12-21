import type { TRPCRouterRecord } from "@trpc/server";

import "@torus-ts/db/schema";

import { publicProcedure } from "../../trpc";

export const cadreRouter = {
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.cadreSchema.findMany();
  }),
} satisfies TRPCRouterRecord;
