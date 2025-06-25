import { and, eq, isNull, or } from "@torus-ts/db";
import {
  constraintSchema,
  permissionDetailsSchema,
  permissionSchema,
} from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../trpc";

export const permissionRouter = {
  // GET
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.permissionSchema.findMany({
      where: and(isNull(permissionSchema.deletedAt)),
    });
  }),
  allWithConstraints: publicProcedure.query(async ({ ctx }) => {
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
  withConstraintsByGrantor: publicProcedure
    .input(z.object({ grantor: z.string() }))
    .query(async ({ ctx, input }) => {
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
        .where(
          and(
            isNull(permissionSchema.deletedAt),
            eq(permissionDetailsSchema.grantor_key, input.grantor),
          ),
        );
    }),
  withConstraintsByGrantorAndGrantee: publicProcedure
    .input(z.object({ address: z.string() }))
    .query(async ({ ctx, input }) => {
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
        .where(
          and(
            isNull(permissionSchema.deletedAt),
            or(
              eq(permissionDetailsSchema.grantor_key, input.address),
              eq(permissionDetailsSchema.grantee_key, input.address),
            ),
          ),
        );
    }),
} satisfies TRPCRouterRecord;
