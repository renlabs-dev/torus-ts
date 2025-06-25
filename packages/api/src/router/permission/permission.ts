import { and, eq, isNull, or } from "@torus-ts/db";
import {
  // constraintSchema,
  permissionsSchema,
} from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { publicProcedure } from "../../trpc";

export const permissionRouter = {
  // GET
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.permissionsSchema.findMany({
      where: and(isNull(permissionsSchema.deletedAt)),
    });
  }),
  // allWithConstraints: publicProcedure.query(async ({ ctx }) => {
  //   return ctx.db
  //     .select({
  //       permission: permissionsSchema,
  //       emissionPermission: emissionPermissionsSchema,
  //       constraint: constraintSchema,
  //     })
  //     .from(permissionsSchema)
  //     .leftJoin(
  //       emissionPermissionsSchema,
  //       and(
  //         eq(
  //           permissionsSchema.permissionId,
  //           emissionPermissionsSchema.permissionId,
  //         ),
  //         isNull(emissionPermissionsSchema.deletedAt),
  //       ),
  //     )
  //     .leftJoin(
  //       constraintSchema,
  //       and(
  //         isNull(constraintSchema.deletedAt),
  //       ),
  //     )
  //     .where(isNull(permissionsSchema.deletedAt));
  // }),
  // withConstraintsByGrantor: publicProcedure
  //   .input(z.object({ grantor: z.string() }))
  //   .query(async ({ ctx, input }) => {
  //     return ctx.db
  //       .select({
  //         permission: permissionsSchema,
  //         emissionPermission: emissionPermissionsSchema,
  //         constraint: constraintSchema,
  //       })
  //       .from(permissionsSchema)
  //       .leftJoin(
  //         emissionPermissionsSchema,
  //         and(
  //           eq(
  //             permissionsSchema.permissionId,
  //             emissionPermissionsSchema.permissionId,
  //           ),
  //           isNull(emissionPermissionsSchema.deletedAt),
  //         ),
  //       )
  //       .leftJoin(
  //         constraintSchema,
  //         and(
  //           isNull(constraintSchema.deletedAt),
  //         ),
  //       )
  //       .where(
  //         and(
  //           isNull(permissionsSchema.deletedAt),
  //           eq(permissionsSchema.grantorAccountId, input.grantor),
  //         ),
  //       );
  //   }),
} satisfies TRPCRouterRecord;
