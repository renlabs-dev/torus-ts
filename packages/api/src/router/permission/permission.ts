import { and, eq, isNull } from "@torus-ts/db";
import {
  constraintSchema,
  permissionDetailsSchema,
  permissionSchema,
} from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { publicProcedure } from "../../trpc";

export const permissionRouter = {
  // GET
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.permissionSchema.findMany({
      where: and(isNull(permissionSchema.deletedAt)),
    });
  }),
  withConstraints: publicProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        permission: permissionSchema,
        permissionDetails: permissionDetailsSchema,
        constraint: constraintSchema,
      })
      .from(permissionSchema)
      .leftJoin(
        permissionDetailsSchema,
        and(
          eq(
            permissionSchema.permission_id,
            permissionDetailsSchema.permission_id,
          ),
          isNull(permissionDetailsSchema.deletedAt),
        ),
      )
      .leftJoin(
        constraintSchema,
        and(
          eq(permissionDetailsSchema.constraint_id, constraintSchema.id),
          isNull(constraintSchema.deletedAt),
        ),
      )
      .where(isNull(permissionSchema.deletedAt));
  }),
} satisfies TRPCRouterRecord;
