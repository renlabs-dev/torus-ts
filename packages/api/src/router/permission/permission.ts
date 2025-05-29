import { and, isNull } from "@torus-ts/db";
import { permissionDetailsSchema } from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { publicProcedure } from "../../trpc";

export const permissionRouter = {
  // GET
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.permissionDetailsSchema.findMany({
      where: and(isNull(permissionDetailsSchema.deletedAt)),
    });
  }),
} satisfies TRPCRouterRecord;
