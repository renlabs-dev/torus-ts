import type { SS58Address } from "@torus-network/sdk";
import { queryKeyStakedBy, SS58_SCHEMA } from "@torus-network/sdk";
import { typed_non_null_entries } from "@torus-network/torus-utils";
import { and, eq, isNull, max } from "@torus-ts/db";
import type { DB } from "@torus-ts/db/client";
import {
  agentSchema,
  computedAgentWeightSchema,
  userAgentWeightSchema,
} from "@torus-ts/db/schema";
import { USER_AGENT_WEIGHT_INSERT_SCHEMA } from "@torus-ts/db/validation";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { authenticatedProcedure, publicProcedure } from "../../trpc";

async function getUserAgentWeights(
  db: DB,
  userKey?: SS58Address,
  agentKey?: SS58Address,
) {
  const query = db
    .select({
      userKey: userAgentWeightSchema.userKey,
      agentKey: userAgentWeightSchema.agentKey,
      weight: userAgentWeightSchema.weight,
    })
    .from(userAgentWeightSchema);

  if (userKey) {
    query.where(eq(userAgentWeightSchema.userKey, userKey));
  }

  if (agentKey) {
    query.where(eq(userAgentWeightSchema.agentKey, agentKey));
  }

  const result = await query.execute();
  return result as {
    userKey: SS58Address;
    agentKey: SS58Address;
    weight: number;
  }[];
}

async function getNormalizedUserAgentWeights(
  db: DB,
  userKey?: SS58Address,
  targetAgentKey?: SS58Address,
) {
  const weights = await getUserAgentWeights(db, userKey);

  const totalWeightByUser: Record<SS58Address, number> = weights.reduce(
    (acc, row) => {
      const { userKey, weight } = row;
      acc[userKey] = (acc[userKey] ?? 0) + weight;
      return acc;
    },
    {} as Record<SS58Address, number>,
  );

  const weightsByUserAndAgent: Record<
    SS58Address,
    Record<SS58Address, number>
  > = weights.reduce(
    (acc, row) => {
      const { userKey, agentKey, weight } = row;
      if (targetAgentKey && agentKey !== targetAgentKey) {
        return acc;
      }
      acc[userKey] ??= {};
      acc[userKey][agentKey] = weight;
      return acc;
    },
    {} as Record<SS58Address, Record<SS58Address, number>>,
  );

  const normalizedWeights: Record<
    SS58Address,
    Record<SS58Address, number>
  > = typed_non_null_entries(weightsByUserAndAgent).reduce(
    (acc, [userKey, agentWeights]) => {
      const totalWeight = totalWeightByUser[userKey] ?? 0;

      acc[userKey] = Object.entries(agentWeights).reduce(
        (agentAcc, [agentKey, weight]) => {
          const normalizedWeight = totalWeight !== 0 ? weight / totalWeight : 0;
          agentAcc[agentKey] = normalizedWeight;
          return agentAcc;
        },
        {} as Record<string, number>,
      );

      return acc;
    },
    {} as Record<string, Record<string, number>>,
  );

  return normalizedWeights;
}

export const userAgentWeightRouter = {
  // GET
  byUserKey: publicProcedure
    .input(z.object({ userKey: z.string() }))
    .query(async ({ ctx, input }) => {
      // Query agent table joining it with user user_agent_allocation table and computed_weights
      // filtering by userKey

      // First get the latest block
      const lastBlock = ctx.db
        .select({ value: max(computedAgentWeightSchema.atBlock) })
        .from(computedAgentWeightSchema);

      return await ctx.db
        .select({
          agent: agentSchema,
          user_agent_weight: userAgentWeightSchema,
          computed_agent_weight: computedAgentWeightSchema,
        })
        .from(agentSchema)
        .innerJoin(
          userAgentWeightSchema,
          eq(agentSchema.key, userAgentWeightSchema.agentKey),
        )
        .leftJoin(
          computedAgentWeightSchema,
          and(
            eq(agentSchema.key, computedAgentWeightSchema.agentKey),
            eq(computedAgentWeightSchema.atBlock, lastBlock),
            isNull(computedAgentWeightSchema.deletedAt),
          ),
        )
        .where(
          and(
            eq(userAgentWeightSchema.userKey, input.userKey),
            isNull(userAgentWeightSchema.deletedAt),
          ),
        )
        .execute();
    }),

  userAgentWeights: publicProcedure
    .input(
      z.object({
        userKey: SS58_SCHEMA.optional(),
        agentKey: SS58_SCHEMA.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { userKey, agentKey } = input;

      // Call the getUserAgentWeights function
      const weights = await getUserAgentWeights(ctx.db, userKey, agentKey);

      return weights;
    }),

  normalizedUserAgentWeights: publicProcedure
    .input(
      z.object({
        userKey: SS58_SCHEMA.optional(),
        agentKey: SS58_SCHEMA.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { userKey, agentKey } = input;

      // Call the getUserAgentWeights function

      const normalizedWeights = await getNormalizedUserAgentWeights(
        ctx.db,
        userKey,
        agentKey,
      );

      return normalizedWeights;
    }),

  stakeWeight: publicProcedure
    .input(
      z.object({
        userKey: SS58_SCHEMA.optional(),
        agentKey: SS58_SCHEMA.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { userKey, agentKey } = input;
      const normalizedWeights = await getNormalizedUserAgentWeights(
        ctx.db,
        userKey,
        agentKey,
      );
      const normalizedWeightsMap = new Map(
        typed_non_null_entries(normalizedWeights),
      );
      const stakeInAllocator = await queryKeyStakedBy(
        await ctx.wsAPI,
        ctx.allocatorAddress,
      );
      const stakeWeightMap = new Map<SS58Address, Map<SS58Address, bigint>>();
      normalizedWeightsMap.forEach((innerRecord, userKey) => {
        if (stakeInAllocator.has(userKey)) {
          const innerMap = new Map(typed_non_null_entries(innerRecord));
          const innerStakeWeightMap = new Map<SS58Address, bigint>();
          innerMap.forEach((weight, agentKey) => {
            // TODO: This is a temporary fix to convert to bigint
            innerStakeWeightMap.set(
              agentKey,
              (BigInt(Math.floor(weight * 100)) *
                (stakeInAllocator.get(userKey) ?? 0n)) /
                100n,
            );
          });
          stakeWeightMap.set(userKey, innerStakeWeightMap);
        }
      });
      return stakeWeightMap;
    }),

  // POST
  createMany: authenticatedProcedure
    .input(z.array(USER_AGENT_WEIGHT_INSERT_SCHEMA))
    .mutation(async ({ ctx, input }) => {
      const userKey = ctx.sessionData.userKey;

      const dataToInsert = input.map((item) => ({
        agentKey: item.agentKey,
        weight: item.weight,
        userKey,
      }));

      await ctx.db.insert(userAgentWeightSchema).values(dataToInsert);
    }),
  delete: authenticatedProcedure
    .input(z.object({ userKey: z.string() }))
    .mutation(async ({ ctx }) => {
      const userKey = ctx.sessionData.userKey;
      await ctx.db
        .delete(userAgentWeightSchema)
        .where(eq(userAgentWeightSchema.userKey, userKey));
    }),
} satisfies TRPCRouterRecord;
