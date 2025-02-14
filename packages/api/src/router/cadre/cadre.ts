import "@torus-ts/db/schema";

import { isNull } from "@torus-ts/db";
import { cadreSchema } from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";

import { publicProcedure } from "../../trpc";

export const cadreRouter = {
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.cadreSchema.findMany({
      where: isNull(cadreSchema.deletedAt),
    });
  }),
} satisfies TRPCRouterRecord;
