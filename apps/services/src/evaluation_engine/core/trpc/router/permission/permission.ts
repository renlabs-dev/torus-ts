import { and, eq, isNull, sql } from "@torus-ts/db";
import { agentApplicationVoteSchema } from "@torus-ts/db/schema";
import { AGENT_APPLICATION_VOTE_INSERT_SCHEMA } from "@torus-ts/db/validation";
import { TRPCError } from "@trpc/server";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { permissionSchema } from "../../../db/schema";
import {
  authenticatedProcedure,
  publicProcedure,
} from "@torus-ts/api/src/trpc";

export const permissionRouter = {
  /**
   * Get all permissions
   */
  all: publicProcedure.query(async ({ ctx }) => {
    const permissions = await ctx.db.query.findMany(permissionSchema);
    return permissions;
  }),

  /**
   * Get a permission by ID
   */
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const permission = await ctx.db
        .select()
        .from(permissionSchema)
        .where(eq(permissionSchema.permission_id, input.id));

      if (!permission.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Permission with ID ${input.id} not found`,
        });
      }

      return permission[0];
    }),

  /**
   * Create a new permission
   */
  create: publicProcedure
    .input(z.object({ permission_id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(permissionSchema)
        .values({
          permission_id: input.permission_id,
        })
        .returning();

      return result[0];
    }),
};
