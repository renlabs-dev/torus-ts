import { and, eq, isNull, or } from "@torus-ts/db";
import {
  permissionsSchema,
  emissionPermissionsSchema,
  namespacePermissionsSchema,
  emissionStreamAllocationsSchema,
  emissionDistributionTargetsSchema,
  accumulatedStreamAmountsSchema,
} from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { publicProcedure } from "../../trpc";
import { z } from "zod";
import { SS58_SCHEMA } from "@torus-network/sdk";

export const permissionRouter = {
  // GET
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.permissionsSchema.findMany({
      where: and(isNull(permissionsSchema.deletedAt)),
    });
  }),

  allWithEmissions: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select()
      .from(permissionsSchema)
      .leftJoin(
        emissionPermissionsSchema,
        eq(
          permissionsSchema.permissionId,
          emissionPermissionsSchema.permissionId,
        ),
      )
      .where(isNull(permissionsSchema.deletedAt))
      .orderBy(permissionsSchema.createdAt);
  }),

  allWithNamespaces: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select()
      .from(permissionsSchema)
      .leftJoin(
        namespacePermissionsSchema,
        eq(
          permissionsSchema.permissionId,
          namespacePermissionsSchema.permissionId,
        ),
      )
      .where(isNull(permissionsSchema.deletedAt))
      .orderBy(permissionsSchema.createdAt);
  }),

  allWithEmissionsAndNamespaces: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select()
      .from(permissionsSchema)
      .leftJoin(
        emissionPermissionsSchema,
        eq(
          permissionsSchema.permissionId,
          emissionPermissionsSchema.permissionId,
        ),
      )
      .leftJoin(
        namespacePermissionsSchema,
        eq(
          permissionsSchema.permissionId,
          namespacePermissionsSchema.permissionId,
        ),
      )
      .where(isNull(permissionsSchema.deletedAt))
      .orderBy(permissionsSchema.createdAt);
  }),

  byGrantor: publicProcedure
    .input(z.object({ grantorAccountId: SS58_SCHEMA }))
    .query(({ ctx, input }) => {
      return ctx.db.query.permissionsSchema.findMany({
        where: and(
          eq(permissionsSchema.grantorAccountId, input.grantorAccountId),
          isNull(permissionsSchema.deletedAt),
        ),
      });
    }),

  byGrantee: publicProcedure
    .input(z.object({ granteeAccountId: SS58_SCHEMA }))
    .query(({ ctx, input }) => {
      return ctx.db.query.permissionsSchema.findMany({
        where: and(
          eq(permissionsSchema.granteeAccountId, input.granteeAccountId),
          isNull(permissionsSchema.deletedAt),
        ),
      });
    }),

  byAccountId: publicProcedure
    .input(z.object({ accountId: SS58_SCHEMA }))
    .query(({ ctx, input }) => {
      return ctx.db.query.permissionsSchema.findMany({
        where: and(
          or(
            eq(permissionsSchema.grantorAccountId, input.accountId),
            eq(permissionsSchema.granteeAccountId, input.accountId),
          ),
          isNull(permissionsSchema.deletedAt),
        ),
        orderBy: (permissions, { desc }) => [desc(permissions.createdAt)],
      });
    }),

  allWithEmissionsByAccountId: publicProcedure
    .input(z.object({ accountId: SS58_SCHEMA }))
    .query(async ({ ctx, input }) => {
      return await ctx.db
        .select()
        .from(permissionsSchema)
        .leftJoin(
          emissionPermissionsSchema,
          eq(
            permissionsSchema.permissionId,
            emissionPermissionsSchema.permissionId,
          ),
        )
        .where(
          and(
            or(
              eq(permissionsSchema.grantorAccountId, input.accountId),
              eq(permissionsSchema.granteeAccountId, input.accountId),
            ),
            isNull(permissionsSchema.deletedAt),
          ),
        )
        .orderBy(permissionsSchema.createdAt);
    }),

  allWithNamespacesByAccountId: publicProcedure
    .input(z.object({ accountId: SS58_SCHEMA }))
    .query(async ({ ctx, input }) => {
      return await ctx.db
        .select()
        .from(permissionsSchema)
        .leftJoin(
          namespacePermissionsSchema,
          eq(
            permissionsSchema.permissionId,
            namespacePermissionsSchema.permissionId,
          ),
        )
        .where(
          and(
            or(
              eq(permissionsSchema.grantorAccountId, input.accountId),
              eq(permissionsSchema.granteeAccountId, input.accountId),
            ),
            isNull(permissionsSchema.deletedAt),
          ),
        )
        .orderBy(permissionsSchema.createdAt);
    }),

  // Stream endpoints
  streamAllocations: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.emissionStreamAllocationsSchema.findMany({
      orderBy: (streams, { asc }) => [asc(streams.permissionId)],
    });
  }),

  streamAllocationsByPermissionId: publicProcedure
    .input(z.object({ permissionId: z.string().length(66) }))
    .query(({ ctx, input }) => {
      return ctx.db.query.emissionStreamAllocationsSchema.findMany({
        where: eq(
          emissionStreamAllocationsSchema.permissionId,
          input.permissionId,
        ),
      });
    }),

  streamAllocationsByStreamId: publicProcedure
    .input(z.object({ streamId: z.string().length(66) }))
    .query(({ ctx, input }) => {
      return ctx.db.query.emissionStreamAllocationsSchema.findMany({
        where: eq(emissionStreamAllocationsSchema.streamId, input.streamId),
      });
    }),

  distributionTargets: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.emissionDistributionTargetsSchema.findMany({
      orderBy: (targets, { asc }) => [asc(targets.permissionId)],
    });
  }),

  distributionTargetsByPermissionId: publicProcedure
    .input(z.object({ permissionId: z.string().length(66) }))
    .query(({ ctx, input }) => {
      return ctx.db.query.emissionDistributionTargetsSchema.findMany({
        where: eq(
          emissionDistributionTargetsSchema.permissionId,
          input.permissionId,
        ),
      });
    }),

  distributionTargetsByAccountId: publicProcedure
    .input(z.object({ accountId: SS58_SCHEMA }))
    .query(({ ctx, input }) => {
      return ctx.db.query.emissionDistributionTargetsSchema.findMany({
        where: eq(
          emissionDistributionTargetsSchema.targetAccountId,
          input.accountId,
        ),
      });
    }),

  accumulatedStreamAmounts: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.accumulatedStreamAmountsSchema.findMany({
      orderBy: (amounts, { desc }) => [desc(amounts.lastUpdated)],
    });
  }),

  accumulatedStreamAmountsByGrantor: publicProcedure
    .input(z.object({ grantorAccountId: SS58_SCHEMA }))
    .query(({ ctx, input }) => {
      return ctx.db.query.accumulatedStreamAmountsSchema.findMany({
        where: eq(
          accumulatedStreamAmountsSchema.grantorAccountId,
          input.grantorAccountId,
        ),
        orderBy: (amounts, { desc }) => [desc(amounts.lastUpdated)],
      });
    }),

  accumulatedStreamAmountsByStreamId: publicProcedure
    .input(z.object({ streamId: z.string().length(66) }))
    .query(({ ctx, input }) => {
      return ctx.db.query.accumulatedStreamAmountsSchema.findMany({
        where: eq(accumulatedStreamAmountsSchema.streamId, input.streamId),
        orderBy: (amounts, { desc }) => [desc(amounts.lastUpdated)],
      });
    }),

  accumulatedStreamAmountsByPermissionId: publicProcedure
    .input(z.object({ permissionId: z.string().length(66) }))
    .query(({ ctx, input }) => {
      return ctx.db.query.accumulatedStreamAmountsSchema.findMany({
        where: eq(
          accumulatedStreamAmountsSchema.permissionId,
          input.permissionId,
        ),
        orderBy: (amounts, { desc }) => [desc(amounts.lastUpdated)],
      });
    }),

  allWithCompletePermissions: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select()
      .from(permissionsSchema)
      .leftJoin(
        emissionPermissionsSchema,
        eq(
          permissionsSchema.permissionId,
          emissionPermissionsSchema.permissionId,
        ),
      )
      .leftJoin(
        namespacePermissionsSchema,
        eq(
          permissionsSchema.permissionId,
          namespacePermissionsSchema.permissionId,
        ),
      )
      .leftJoin(
        emissionStreamAllocationsSchema,
        eq(
          permissionsSchema.permissionId,
          emissionStreamAllocationsSchema.permissionId,
        ),
      )
      .leftJoin(
        emissionDistributionTargetsSchema,
        eq(
          permissionsSchema.permissionId,
          emissionDistributionTargetsSchema.permissionId,
        ),
      )
      .leftJoin(
        accumulatedStreamAmountsSchema,
        eq(
          permissionsSchema.permissionId,
          accumulatedStreamAmountsSchema.permissionId,
        ),
      )
      .where(isNull(permissionsSchema.deletedAt))
      .orderBy(
        permissionsSchema.createdAt,
        emissionStreamAllocationsSchema.streamId,
        emissionDistributionTargetsSchema.targetAccountId,
      );
  }),
} satisfies TRPCRouterRecord;
