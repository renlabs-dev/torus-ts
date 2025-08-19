import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { queryEmissionPermissions } from "@torus-network/sdk/chain";
import { SS58_SCHEMA } from "@torus-network/sdk/types";
import type { RemAmount } from "@torus-network/torus-utils/torus/token";

import { and, eq, isNull, or, sql } from "@torus-ts/db";
import type { createDb } from "@torus-ts/db/client";
import {
  accumulatedStreamAmountsSchema,
  emissionDistributionTargetsSchema,
  emissionPermissionsSchema,
  emissionStreamAllocationsSchema,
  namespacePermissionPathsSchema,
  namespacePermissionsSchema,
  permissionsSchema,
} from "@torus-ts/db/schema";

import { publicProcedure } from "../../trpc";

type StreamsPerBlockResult = Record<
  string,
  {
    incoming: Record<string, Record<string, RemAmount | null>>;
    outgoing: Record<string, Record<string, RemAmount | null>>;
  }
>;

async function queryAccumulatedAmounts(
  ctx: { db: ReturnType<typeof createDb> },
  permissionStreamPairs: {
    permissionId: string;
    streamId: string;
  }[],
) {
  if (permissionStreamPairs.length === 0) {
    return [];
  }

  return await ctx.db
    .select({
      permissionId: accumulatedStreamAmountsSchema.permissionId,
      streamId: accumulatedStreamAmountsSchema.streamId,
      executionCount: accumulatedStreamAmountsSchema.executionCount,
      accumulatedAmount: accumulatedStreamAmountsSchema.accumulatedAmount,
      lastExecutedBlock: accumulatedStreamAmountsSchema.lastExecutedBlock,
    })
    .from(accumulatedStreamAmountsSchema)
    .where(
      or(
        ...permissionStreamPairs.map((pair) =>
          and(
            eq(accumulatedStreamAmountsSchema.permissionId, pair.permissionId),
            eq(accumulatedStreamAmountsSchema.streamId, pair.streamId),
          ),
        ),
      ),
    )
    .orderBy(accumulatedStreamAmountsSchema.executionCount);
}

function calculateMedian(values: number[]): number | null {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const isEven = sorted.length % 2 === 0;

  if (isEven && mid > 0) {
    const prev = sorted[mid - 1];
    const curr = sorted[mid];
    if (prev !== undefined && curr !== undefined) {
      return (prev + curr) / 2;
    }
  } else {
    const value = sorted[mid];
    if (value !== undefined) {
      return value;
    }
  }

  return null;
}

function calculateMedianByPermissionStream<
  T extends {
    permissionId: string;
    streamId: string;
    executionCount: number | null;
  },
>(
  permissionStreamPairs: {
    permissionId: string;
    streamId: string;
  }[],
  data: T[],
  extractValue: (items: T[]) => number | null,
  lastN: number = 7,
): Record<string, Record<string, number | null>> {
  const result: Record<string, Record<string, number | null>> = {};

  // Group data by permission/stream pair
  const groupedData = new Map<string, T[]>();
  for (const item of data) {
    const key = `${item.permissionId}:${item.streamId}`;
    if (!groupedData.has(key)) {
      groupedData.set(key, []);
    }
    const group = groupedData.get(key);
    if (group) {
      group.push(item);
    }
  }

  // Process each permission/stream pair
  for (const pair of permissionStreamPairs) {
    const key = `${pair.permissionId}:${pair.streamId}`;
    const items = groupedData.get(key) ?? [];

    // Sort by execution_count descending to get latest first
    const sortedItems = items.sort(
      (a, b) => (b.executionCount ?? 0) - (a.executionCount ?? 0),
    );

    // Remove the last row (highest execution_count - still accumulating)
    const withoutNewest = sortedItems.slice(1);

    // Take only the last N (most recent completed) execution counts
    const lastNCompleted = withoutNewest.slice(0, lastN);

    // Extract the value using the provided function
    const value = extractValue(lastNCompleted);

    // Initialize permission in result if not exists
    if (!result[pair.permissionId]) {
      result[pair.permissionId] = {};
    }

    // Store the value
    const permissionResult = result[pair.permissionId];
    if (permissionResult) {
      permissionResult[pair.streamId] = value;
    }
  }

  return result;
}

// Wrapper function for calculating median amounts
function calculateMedianAmounts(
  permissionStreamPairs: { permissionId: string; streamId: string }[],
  accumulatedAmounts: {
    permissionId: string;
    streamId: string;
    executionCount: number | null;
    accumulatedAmount: string | null;
  }[],
  lastN: number = 7,
): Record<string, Record<string, number | null>> {
  return calculateMedianByPermissionStream(
    permissionStreamPairs,
    accumulatedAmounts,
    (items) => {
      if (items.length === 0) return null;

      const validAmounts = items
        .map((item) => Number(item.accumulatedAmount ?? 0))
        .filter((amount) => !isNaN(amount));

      return calculateMedian(validAmounts);
    },
    lastN,
  );
}

// Wrapper function for calculating median block deltas
function calculateMedianBlockDeltas(
  permissionStreamPairs: { permissionId: string; streamId: string }[],
  accumulatedAmounts: {
    permissionId: string;
    streamId: string;
    executionCount: number | null;
    lastExecutedBlock: number | null;
  }[],
  lastN: number = 7,
): Record<string, Record<string, number | null>> {
  return calculateMedianByPermissionStream(
    permissionStreamPairs,
    accumulatedAmounts,
    (items) => {
      if (items.length <= 1) return null;

      // Calculate deltas between consecutive lastExecutedBlock values
      const blockDeltas: number[] = [];

      for (let i = 0; i < items.length - 1; i++) {
        const current = items[i];
        const next = items[i + 1];

        if (
          current &&
          next &&
          current.lastExecutedBlock !== null &&
          next.lastExecutedBlock !== null
        ) {
          // Since we're sorted descending, current has higher block than next
          const delta = current.lastExecutedBlock - next.lastExecutedBlock;
          if (delta > 0) {
            blockDeltas.push(delta);
          }
        }
      }

      return calculateMedian(blockDeltas);
    },
    lastN,
  );
}

function applyWeightsToMedianAmounts(
  medianAmounts: Record<string, Record<string, number | null>>,
  weights: Record<string, { streamIds: string[]; normalizedWeight: number }>,
): Record<string, Record<string, number | null>> {
  const result: Record<string, Record<string, number | null>> = {};

  for (const [permissionId, streams] of Object.entries(medianAmounts)) {
    result[permissionId] = {};
    const weightData = weights[permissionId];

    if (weightData) {
      for (const [streamId, medianAmount] of Object.entries(streams)) {
        if (medianAmount !== null) {
          result[permissionId][streamId] =
            weightData.normalizedWeight * medianAmount;
        } else {
          result[permissionId][streamId] = null;
        }
      }
    }
  }

  return result;
}

function extractPermissionStreamPairs(
  streamsByTarget: Record<
    string,
    { streamIds: string[]; normalizedWeight: number }
  >,
) {
  const permissionStreamPairs: {
    permissionId: string;
    streamId: string;
    normalizedWeight: number;
  }[] = [];

  for (const [permissionId, data] of Object.entries(streamsByTarget)) {
    for (const streamId of data.streamIds) {
      permissionStreamPairs.push({
        permissionId,
        streamId,
        normalizedWeight: data.normalizedWeight,
      });
    }
  }

  return permissionStreamPairs;
}

function extractSimplePermissionStreamPairs(
  streamsByPermission: Record<string, { streamIds: string[] }>,
) {
  const permissionStreamPairs: {
    permissionId: string;
    streamId: string;
  }[] = [];

  for (const [permissionId, data] of Object.entries(streamsByPermission)) {
    for (const streamId of data.streamIds) {
      permissionStreamPairs.push({
        permissionId,
        streamId,
      });
    }
  }

  return permissionStreamPairs;
}

async function getOutgoingStreamsByGrantor(
  ctx: { db: ReturnType<typeof createDb> },
  input: { grantorAccountId: string },
) {
  // Get permissions where our key is the grantor
  const permissions = await ctx.db
    .select({
      permissionId: permissionsSchema.permissionId,
    })
    .from(permissionsSchema)
    .where(
      and(
        eq(permissionsSchema.grantorAccountId, input.grantorAccountId),
        isNull(permissionsSchema.deletedAt),
      ),
    );

  if (permissions.length === 0) {
    return {};
  }

  // Get stream allocations for these permissions
  const streamAllocations = await ctx.db
    .select({
      permissionId: emissionStreamAllocationsSchema.permissionId,
      streamId: emissionStreamAllocationsSchema.streamId,
    })
    .from(emissionStreamAllocationsSchema)
    .where(
      or(
        ...permissions.map((p) =>
          eq(emissionStreamAllocationsSchema.permissionId, p.permissionId),
        ),
      ),
    );

  // Build the result map: {permissionId: {streamIds: string[]}}
  const result: Record<string, { streamIds: string[] }> = {};

  // Group stream IDs by permission
  for (const allocation of streamAllocations) {
    if (!result[allocation.permissionId]) {
      result[allocation.permissionId] = {
        streamIds: [],
      };
    }

    const permissionResult = result[allocation.permissionId];
    if (
      allocation.streamId &&
      permissionResult &&
      !permissionResult.streamIds.includes(allocation.streamId)
    ) {
      permissionResult.streamIds.push(allocation.streamId);
    }
  }

  return result;
}

async function getStreamsByTarget(
  ctx: { db: ReturnType<typeof createDb> },
  input: { targetAccountId: string },
) {
  // Get targets with normalized weights using window function
  const targets = await ctx.db
    .select({
      permissionId: emissionDistributionTargetsSchema.permissionId,
      streamId: emissionDistributionTargetsSchema.streamId,
      targetAccountId: emissionDistributionTargetsSchema.targetAccountId,
      weight: emissionDistributionTargetsSchema.weight,
      normalizedWeight:
        sql<number>`CAST(${emissionDistributionTargetsSchema.weight} AS decimal(18,10)) / NULLIF(SUM(${emissionDistributionTargetsSchema.weight}) OVER (PARTITION BY ${emissionDistributionTargetsSchema.permissionId}, ${emissionDistributionTargetsSchema.streamId}), 0)`.as(
          "normalized_weight",
        ),
    })
    .from(emissionDistributionTargetsSchema);

  // Filter locally to only include targets for the requested account
  const filteredTargets = targets.filter(
    (target) => target.targetAccountId === input.targetAccountId,
  );

  // Build the result map: {permissionId: {streamIds: string[], normalizedWeight: number}}
  const result = new Map<
    string,
    { streamIds: string[]; normalizedWeight: number }
  >();

  for (const target of filteredTargets) {
    const permissionId = target.permissionId;

    if (!result.has(permissionId)) {
      result.set(permissionId, {
        streamIds: [],
        normalizedWeight: target.normalizedWeight,
      });
    }

    const permission = result.get(permissionId);
    if (!permission) continue;

    // Add stream ID if not already present
    if (target.streamId && !permission.streamIds.includes(target.streamId)) {
      permission.streamIds.push(target.streamId);
    }
  }

  // Convert Map to object for JSON serialization
  return Object.fromEntries(
    Array.from(result.entries()).map(([permissionId, data]) => [
      permissionId,
      {
        streamIds: data.streamIds,
        normalizedWeight: data.normalizedWeight,
      },
    ]),
  );
}

async function getAllStreams(ctx: {
  db: ReturnType<typeof createDb>;
}): Promise<
  Record<
    string,
    Record<string, { streamIds: string[]; normalizedWeight: number }>
  >
> {
  // Get ALL targets with normalized weights using window function in a single query
  const targets = await ctx.db
    .select({
      permissionId: emissionDistributionTargetsSchema.permissionId,
      streamId: emissionDistributionTargetsSchema.streamId,
      targetAccountId: emissionDistributionTargetsSchema.targetAccountId,
      weight: emissionDistributionTargetsSchema.weight,
      normalizedWeight:
        sql<number>`CAST(${emissionDistributionTargetsSchema.weight} AS decimal(18,10)) / NULLIF(SUM(${emissionDistributionTargetsSchema.weight}) OVER (PARTITION BY ${emissionDistributionTargetsSchema.permissionId}, ${emissionDistributionTargetsSchema.streamId}), 0)`.as(
          "normalized_weight",
        ),
    })
    .from(emissionDistributionTargetsSchema);

  // Build the result map: {targetAccountId: {permissionId: {streamIds: string[], normalizedWeight: number}}}
  const result: Record<
    string,
    Record<string, { streamIds: string[]; normalizedWeight: number }>
  > = {};

  for (const target of targets) {
    const { targetAccountId, permissionId, streamId, normalizedWeight } =
      target;

    // Initialize target account if not exists
    if (!result[targetAccountId]) {
      result[targetAccountId] = {};
    }

    // Initialize permission if not exists
    if (!result[targetAccountId][permissionId]) {
      result[targetAccountId][permissionId] = {
        streamIds: [],
        normalizedWeight,
      };
    }

    // Add stream ID if not already present
    if (
      streamId &&
      !result[targetAccountId][permissionId].streamIds.includes(streamId)
    ) {
      result[targetAccountId][permissionId].streamIds.push(streamId);
    }
  }

  return result;
}

async function getAllOutgoingStreamsByGrantor(ctx: {
  db: ReturnType<typeof createDb>;
}): Promise<Record<string, Record<string, { streamIds: string[] }>>> {
  // Get ALL permissions where keys are grantors in a single query
  const permissions = await ctx.db
    .select({
      permissionId: permissionsSchema.permissionId,
      grantorAccountId: permissionsSchema.grantorAccountId,
    })
    .from(permissionsSchema)
    .where(isNull(permissionsSchema.deletedAt));

  if (permissions.length === 0) {
    return {};
  }

  // Get ALL stream allocations for these permissions in a single query
  const streamAllocations = await ctx.db
    .select({
      permissionId: emissionStreamAllocationsSchema.permissionId,
      streamId: emissionStreamAllocationsSchema.streamId,
    })
    .from(emissionStreamAllocationsSchema)
    .where(
      or(
        ...permissions.map((p) =>
          eq(emissionStreamAllocationsSchema.permissionId, p.permissionId),
        ),
      ),
    );

  // Build the result map: {grantorAccountId: {permissionId: {streamIds: string[]}}}
  const result: Record<string, Record<string, { streamIds: string[] }>> = {};

  // Create a lookup map for permission to grantor
  const permissionToGrantor = new Map<string, string>();
  for (const permission of permissions) {
    permissionToGrantor.set(
      permission.permissionId,
      permission.grantorAccountId,
    );
  }

  // Group stream IDs by grantor and permission
  for (const allocation of streamAllocations) {
    const grantorAccountId = permissionToGrantor.get(allocation.permissionId);
    if (!grantorAccountId) continue;

    // Initialize grantor account if not exists
    if (!result[grantorAccountId]) {
      result[grantorAccountId] = {};
    }

    // Initialize permission if not exists
    if (!result[grantorAccountId][allocation.permissionId]) {
      result[grantorAccountId][allocation.permissionId] = {
        streamIds: [],
      };
    }

    // Add stream ID if not already present
    if (
      allocation.streamId &&
      !result[grantorAccountId][allocation.permissionId]?.streamIds.includes(
        allocation.streamId,
      )
    ) {
      result[grantorAccountId][allocation.permissionId]?.streamIds.push(
        allocation.streamId,
      );
    }
  }

  return result;
}

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
  streamsReceived: publicProcedure
    .input(z.object({ accountId: SS58_SCHEMA }))
    .query(async ({ ctx, input }) => {
      const api = await ctx.wsAPI;

      const [permissionsError, emissionPermissions] =
        await queryEmissionPermissions(api, (permission) => {
          return permission.scope.targets.has(input.accountId);
        });

      if (permissionsError) {
        throw new Error(
          `Failed to query permissions: ${permissionsError.message}`,
        );
      }

      // Build the result object {grantor: {permissionId: {streamId: delegatedPercent}}}
      const result: Record<string, Record<string, Record<string, number>>> = {};

      // Process each permission where the account is a target
      for (const [permissionId, permission] of emissionPermissions) {
        // Get the account's weight from targets
        const accountWeight = permission.scope.targets.get(input.accountId);
        if (!accountWeight) continue;

        // Calculate total weight for normalization
        let totalWeight = 0n;
        for (const weight of permission.scope.targets.values()) {
          totalWeight += weight;
        }

        if (totalWeight === 0n) continue;

        // Calculate normalized weight (as percentage 0-1)
        const normalizedWeight = Number(accountWeight) / Number(totalWeight);

        // Check if allocation is Streams type
        const allocation = permission.scope.allocation;
        if ("Streams" in allocation) {
          // Get the grantor address
          const grantor = permission.delegator;

          // Initialize nested structure if needed
          if (!result[grantor]) {
            result[grantor] = {};
          }
          if (!result[grantor][permissionId]) {
            result[grantor][permissionId] = {};
          }

          // Iterate through the streams Map
          for (const [streamId, percentage] of allocation.Streams) {
            // Convert Percent type to decimal (e.g., 50% = 0.5)
            const streamPercentage = percentage / 100;
            // Calculate the account's share of this stream
            const delegatedPercent = normalizedWeight * streamPercentage;
            result[grantor][permissionId][streamId] = delegatedPercent;
          }
        }
      }

      return result;
    }),

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
        namespacePermissionPathsSchema,
        eq(
          permissionsSchema.permissionId,
          namespacePermissionPathsSchema.permissionId,
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
      .where(isNull(permissionsSchema.deletedAt))
      .orderBy(
        permissionsSchema.createdAt,
        emissionStreamAllocationsSchema.streamId,
        emissionDistributionTargetsSchema.targetAccountId,
      );
  }),

  streamsByTarget: publicProcedure
    .input(z.object({ targetAccountId: SS58_SCHEMA }))
    .query(async ({ ctx, input }) => {
      return await getStreamsByTarget(ctx, input);
    }),

  streamsByAccountWithAccumulations: publicProcedure
    .input(z.object({ accountId: SS58_SCHEMA }))
    .query(async ({ ctx, input }) => {
      // Get incoming streams (where account is target)
      const incomingStreamsByTarget = await getStreamsByTarget(ctx, {
        targetAccountId: input.accountId,
      });
      const incomingPermissionStreamPairs = extractPermissionStreamPairs(
        incomingStreamsByTarget,
      );

      // Get outgoing streams (where account is grantor)
      const outgoingStreamsByGrantor = await getOutgoingStreamsByGrantor(ctx, {
        grantorAccountId: input.accountId,
      });
      const outgoingPermissionStreamPairs = extractSimplePermissionStreamPairs(
        outgoingStreamsByGrantor,
      );

      // Process incoming streams (with weights)
      let incoming = {};
      if (incomingPermissionStreamPairs.length > 0) {
        const simplePairs = incomingPermissionStreamPairs.map(
          ({ permissionId, streamId }) => ({ permissionId, streamId }),
        );
        const incomingAccumulatedAmounts = await queryAccumulatedAmounts(
          ctx,
          incomingPermissionStreamPairs,
        );
        const medianAmounts = calculateMedianAmounts(
          simplePairs,
          incomingAccumulatedAmounts,
        );
        incoming = applyWeightsToMedianAmounts(
          medianAmounts,
          incomingStreamsByTarget,
        );
      }

      // Process outgoing streams (without weights)
      let outgoing = {};
      if (outgoingPermissionStreamPairs.length > 0) {
        const outgoingAccumulatedAmounts = await queryAccumulatedAmounts(
          ctx,
          outgoingPermissionStreamPairs,
        );
        outgoing = calculateMedianAmounts(
          outgoingPermissionStreamPairs,
          outgoingAccumulatedAmounts,
        );
      }

      return {
        incoming,
        outgoing,
      };
    }),

  streamsByMultipleAccountsPerBlock: publicProcedure
    .input(
      z.object({
        accountIds: z.array(SS58_SCHEMA),
        lastN: z.number().int().positive().default(7),
      }),
    )
    .query(async ({ ctx, input }) => {
      const result: StreamsPerBlockResult = {};

      // Get ALL streams data in TWO single queries - MAXIMUM PERFORMANCE IMPROVEMENT
      const [allIncomingStreamsData, allOutgoingStreamsData] =
        await Promise.all([
          getAllStreams(ctx),
          getAllOutgoingStreamsByGrantor(ctx),
        ]);

      // Process each account
      for (const accountId of input.accountIds) {
        // Get incoming streams (where account is target) from pre-fetched data
        const incomingStreamsByTarget = allIncomingStreamsData[accountId] ?? {};
        const incomingPermissionStreamPairs = extractPermissionStreamPairs(
          incomingStreamsByTarget,
        );

        // Get outgoing streams (where account is grantor) from pre-fetched data
        const outgoingStreamsByGrantor =
          allOutgoingStreamsData[accountId] ?? {};
        const outgoingPermissionStreamPairs =
          extractSimplePermissionStreamPairs(outgoingStreamsByGrantor);

        // Process incoming streams (with weights)
        const incoming: Record<string, Record<string, RemAmount | null>> = {};
        if (incomingPermissionStreamPairs.length > 0) {
          const simplePairs = incomingPermissionStreamPairs.map(
            ({ permissionId, streamId }) => ({ permissionId, streamId }),
          );
          const incomingAccumulatedAmounts = await queryAccumulatedAmounts(
            ctx,
            simplePairs,
          );

          // Calculate median amounts
          const medianAmounts = calculateMedianAmounts(
            simplePairs,
            incomingAccumulatedAmounts,
            input.lastN,
          );
          const weightedMedianAmounts = applyWeightsToMedianAmounts(
            medianAmounts,
            incomingStreamsByTarget,
          );

          // Calculate median block deltas
          const medianBlockDeltas = calculateMedianBlockDeltas(
            simplePairs,
            incomingAccumulatedAmounts,
            input.lastN,
          );

          // Calculate tokens per block
          for (const [permissionId, streams] of Object.entries(
            weightedMedianAmounts,
          )) {
            incoming[permissionId] = {};
            const blockDeltas = medianBlockDeltas[permissionId];

            if (blockDeltas) {
              for (const [streamId, amount] of Object.entries(streams)) {
                const blockDelta = blockDeltas[streamId];
                if (
                  amount !== null &&
                  blockDelta !== null &&
                  blockDelta !== undefined &&
                  blockDelta > 0
                ) {
                  incoming[permissionId][streamId] = BigInt(
                    Math.floor(amount / blockDelta),
                  ) as RemAmount;
                } else {
                  incoming[permissionId][streamId] = null;
                }
              }
            }
          }
        }

        // Process outgoing streams (without weights)
        const outgoing: Record<string, Record<string, RemAmount | null>> = {};
        if (outgoingPermissionStreamPairs.length > 0) {
          const outgoingAccumulatedAmounts = await queryAccumulatedAmounts(
            ctx,
            outgoingPermissionStreamPairs,
          );

          // Calculate median amounts
          const medianAmounts = calculateMedianAmounts(
            outgoingPermissionStreamPairs,
            outgoingAccumulatedAmounts,
            input.lastN,
          );

          // Calculate median block deltas
          const medianBlockDeltas = calculateMedianBlockDeltas(
            outgoingPermissionStreamPairs,
            outgoingAccumulatedAmounts,
            input.lastN,
          );

          // Calculate tokens per block
          for (const [permissionId, streams] of Object.entries(medianAmounts)) {
            outgoing[permissionId] = {};
            const blockDeltas = medianBlockDeltas[permissionId];

            if (blockDeltas) {
              for (const [streamId, amount] of Object.entries(streams)) {
                const blockDelta = blockDeltas[streamId];
                if (
                  amount !== null &&
                  blockDelta !== null &&
                  blockDelta !== undefined &&
                  blockDelta > 0
                ) {
                  outgoing[permissionId][streamId] = BigInt(
                    Math.floor(amount / blockDelta),
                  ) as RemAmount;
                } else {
                  outgoing[permissionId][streamId] = null;
                }
              }
            }
          }
        }

        result[accountId] = { incoming, outgoing };
      }

      return result;
    }),
} satisfies TRPCRouterRecord;
