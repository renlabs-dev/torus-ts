import type { TRPCRouterRecord } from "@trpc/server";
import "@torus-ts/db/schema";
import { publicProcedure } from "../../trpc";
import { isNull } from "@torus-ts/db";
import { cadreSchema } from "@torus-ts/db/schema";

export const cadreRouter = {
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.cadreSchema.findMany({
      where: isNull(cadreSchema.deletedAt),
    });
  }),
} satisfies TRPCRouterRecord;
