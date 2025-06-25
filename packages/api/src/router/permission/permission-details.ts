import { and, isNull } from "@torus-ts/db";
import { emissionPermissionsSchema } from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { publicProcedure } from "../../trpc";

export const permissionDetailsRouter = {
  // GET
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.emissionPermissionsSchema.findMany({
      where: and(isNull(emissionPermissionsSchema.deletedAt)),
    });
  }),
} satisfies TRPCRouterRecord;
