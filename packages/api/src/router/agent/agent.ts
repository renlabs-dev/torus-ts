import { and, eq, gte, inArray, isNull, max, sql } from "@torus-ts/db";
import {
  agentSchema,
  computedAgentWeightSchema,
  emissionDistributionTargetsSchema,
  namespacePermissionsSchema,
  penalizeAgentVotesSchema,
  permissionsSchema,
} from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../trpc";

export const agentRouter = {
  // GET
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.agentSchema.findMany({
      where: and(
        eq(agentSchema.isWhitelisted, true),
        isNull(agentSchema.deletedAt),
      ),
    });
  }),
  allIncludingNonWhitelisted: publicProcedure.query(({ ctx }) => {
    return ctx.db
      .select()
      .from(agentSchema)
      .where(isNull(agentSchema.deletedAt))
      .orderBy(agentSchema.isWhitelisted, agentSchema.name);
  }),
  paginated: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().default(9),
        search: z.string().optional(),
        orderBy: z
          .enum([
            "createdAt.asc",
            "createdAt.desc",
            "emission.desc",
            "emission.asc",
          ])
          .optional(),
        isWhitelisted: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, orderBy, isWhitelisted } = input;
      const offset = (page - 1) * limit;

      const agentsLastBlock = await ctx.db
        .select({ value: max(agentSchema.atBlock) })
        .from(agentSchema)
        .limit(1);
      const weightsLastBlock = await ctx.db
        .select({ value: max(computedAgentWeightSchema.atBlock) })
        .from(computedAgentWeightSchema)
        .limit(1);
      if (!agentsLastBlock[0]?.value || !weightsLastBlock[0]?.value) {
        return {
          agents: [],
          pagination: {
            totalCount: 0,
            totalPages: 0,
            currentPage: page,
            pageSize: limit,
            hasMore: false,
          },
        };
      }

      // Base query configuration for filtering
      let baseWhereClause = and(
        isNull(agentSchema.deletedAt),
        gte(agentSchema.atBlock, agentsLastBlock[0].value),
      );

      // Add isWhitelisted filter only if specified
      if (isWhitelisted !== undefined) {
        baseWhereClause = and(
          baseWhereClause,
          eq(agentSchema.isWhitelisted, isWhitelisted),
        );
      }

      if (search) {
        baseWhereClause = and(
          baseWhereClause,
          sql`(${agentSchema.name} ILIKE ${`%${search}%`} OR ${agentSchema.key} ILIKE ${`%${search}%`})`,
        );
      }

      // Count query for total count
      const countQuery = ctx.db
        .select({ id: agentSchema.id })
        .from(agentSchema)
        .leftJoin(
          computedAgentWeightSchema,
          and(
            eq(agentSchema.key, computedAgentWeightSchema.agentKey),
            gte(computedAgentWeightSchema.atBlock, weightsLastBlock[0].value),
            isNull(computedAgentWeightSchema.deletedAt),
          ),
        )
        .where(baseWhereClause);

      // When showing all agents (isWhitelisted is undefined), order by whitelist status first
      let orderByClause;
      if (isWhitelisted === undefined) {
        // Show whitelisted agents first, then non-whitelisted, then order by computed weight
        orderByClause = sql`${agentSchema.isWhitelisted} desc, ${computedAgentWeightSchema.percComputedWeight} desc nulls last`;
      } else {
        // When filtering by whitelist status, use the original ordering
        orderByClause = sql`${computedAgentWeightSchema.percComputedWeight} desc nulls last`;
      }

      if (orderBy) {
        const [field, direction = "asc"] = orderBy.split(".");
        if (field === "emission") {
          // Order by computed weight percentage as proxy for emission
          if (isWhitelisted === undefined) {
            orderByClause = sql`${agentSchema.isWhitelisted} desc, ${computedAgentWeightSchema.percComputedWeight} ${sql.raw(direction.toUpperCase())} nulls last`;
          } else {
            orderByClause = sql`${computedAgentWeightSchema.percComputedWeight} ${sql.raw(direction.toUpperCase())} nulls last`;
          }
        } else {
          const column = agentSchema[field as keyof typeof agentSchema];
          if (isWhitelisted === undefined) {
            orderByClause = sql`${agentSchema.isWhitelisted} desc, ${column} ${sql.raw(direction.toUpperCase())}`;
          } else {
            orderByClause = sql`${column} ${sql.raw(direction.toUpperCase())}`;
          }
        }
      }

      // Run paginated query and total count query in parallel
      const [agents, totalCountResult] = await Promise.all([
        ctx.db
          .select({
            id: agentSchema.id,
            name: agentSchema.name,
            key: agentSchema.key,
            metadataUri: agentSchema.metadataUri,
            apiUrl: agentSchema.apiUrl,
            registrationBlock: agentSchema.registrationBlock,
            isWhitelisted: agentSchema.isWhitelisted,
            atBlock: agentSchema.atBlock,
            weightFactor: agentSchema.weightFactor,
            percComputedWeight: computedAgentWeightSchema.percComputedWeight,
            computedWeight: computedAgentWeightSchema.computedWeight,
          })
          .from(agentSchema)
          .leftJoin(
            computedAgentWeightSchema,
            and(
              eq(agentSchema.key, computedAgentWeightSchema.agentKey),
              gte(computedAgentWeightSchema.atBlock, weightsLastBlock[0].value),
              isNull(computedAgentWeightSchema.deletedAt),
            ),
          )
          .where(baseWhereClause)
          .limit(limit)
          .offset(offset)
          .orderBy(orderByClause),
        ctx.db
          .select({ totalCount: sql<number>`count(*)` })
          .from(sql`${countQuery}`),
      ]);

      const totalCount = totalCountResult[0]?.totalCount ?? 0;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        agents,
        resultCount: agents.length,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          pageSize: limit,
          hasMore: page < totalPages,
        },
      };
    }),
  infinite: publicProcedure
    .input(
      z.object({
        limit: z.number().int().positive().default(9),
        search: z.string().optional(),
        orderBy: z
          .enum([
            "createdAt.asc",
            "createdAt.desc",
            "emission.desc",
            "emission.asc",
          ])
          .optional(),
        isWhitelisted: z.boolean().optional(),
        cursor: z.number().int().positive().optional(), // page number as cursor
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, search, orderBy, isWhitelisted, cursor } = input;
      const page = cursor ?? 1;
      const offset = (page - 1) * limit;

      const agentsLastBlock = await ctx.db
        .select({ value: max(agentSchema.atBlock) })
        .from(agentSchema)
        .limit(1);
      const weightsLastBlock = await ctx.db
        .select({ value: max(computedAgentWeightSchema.atBlock) })
        .from(computedAgentWeightSchema)
        .limit(1);
      if (!agentsLastBlock[0]?.value || !weightsLastBlock[0]?.value) {
        return {
          agents: [],
          nextCursor: undefined,
        };
      }

      // Base query configuration for filtering
      let baseWhereClause = and(
        isNull(agentSchema.deletedAt),
        gte(agentSchema.atBlock, agentsLastBlock[0].value),
      );

      // Add isWhitelisted filter only if specified
      if (isWhitelisted !== undefined) {
        baseWhereClause = and(
          baseWhereClause,
          eq(agentSchema.isWhitelisted, isWhitelisted),
        );
      }

      if (search) {
        baseWhereClause = and(
          baseWhereClause,
          sql`(${agentSchema.name} ILIKE ${`%${search}%`} OR ${agentSchema.key} ILIKE ${`%${search}%`})`,
        );
      }

      // When showing all agents (isWhitelisted is undefined), order by whitelist status first
      // EXCEPT when ordering by createdAt which should be pure chronological order
      let orderByClause;
      const shouldPrioritizeWhitelist =
        isWhitelisted === undefined &&
        orderBy !== "createdAt.desc" &&
        orderBy !== "createdAt.asc";

      if (shouldPrioritizeWhitelist) {
        // Show whitelisted agents first, then non-whitelisted, then order by computed weight
        orderByClause = sql`${agentSchema.isWhitelisted} desc, ${computedAgentWeightSchema.percComputedWeight} desc nulls last`;
      } else {
        // When filtering by whitelist status or ordering by createdAt, use the original ordering
        orderByClause = sql`${computedAgentWeightSchema.percComputedWeight} desc nulls last`;
      }

      if (orderBy) {
        const [field, direction = "asc"] = orderBy.split(".");
        if (field === "emission") {
          // Order by computed weight percentage as proxy for emission
          if (shouldPrioritizeWhitelist) {
            orderByClause = sql`${agentSchema.isWhitelisted} desc, ${computedAgentWeightSchema.percComputedWeight} ${sql.raw(direction.toUpperCase())} nulls last`;
          } else {
            orderByClause = sql`${computedAgentWeightSchema.percComputedWeight} ${sql.raw(direction.toUpperCase())} nulls last`;
          }
        } else {
          const column = agentSchema[field as keyof typeof agentSchema];
          if (shouldPrioritizeWhitelist) {
            orderByClause = sql`${agentSchema.isWhitelisted} desc, ${column} ${sql.raw(direction.toUpperCase())}`;
          } else {
            orderByClause = sql`${column} ${sql.raw(direction.toUpperCase())}`;
          }
        }
      }

      // Get one extra item to determine if there are more pages
      const agents = await ctx.db
        .select({
          id: agentSchema.id,
          name: agentSchema.name,
          key: agentSchema.key,
          metadataUri: agentSchema.metadataUri,
          apiUrl: agentSchema.apiUrl,
          registrationBlock: agentSchema.registrationBlock,
          isWhitelisted: agentSchema.isWhitelisted,
          atBlock: agentSchema.atBlock,
          weightFactor: agentSchema.weightFactor,
          percComputedWeight: computedAgentWeightSchema.percComputedWeight,
          computedWeight: computedAgentWeightSchema.computedWeight,
        })
        .from(agentSchema)
        .leftJoin(
          computedAgentWeightSchema,
          and(
            eq(agentSchema.key, computedAgentWeightSchema.agentKey),
            gte(computedAgentWeightSchema.atBlock, weightsLastBlock[0].value),
            isNull(computedAgentWeightSchema.deletedAt),
          ),
        )
        .where(baseWhereClause)
        .limit(limit + 1) // Get one extra to check for more pages
        .offset(offset)
        .orderBy(orderByClause);

      const hasMore = agents.length > limit;
      const items = hasMore ? agents.slice(0, limit) : agents;
      const nextCursor = hasMore ? page + 1 : undefined;

      return {
        agents: items,
        nextCursor,
      };
    }),
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.agentSchema.findFirst({
        where: and(eq(agentSchema.id, input.id), isNull(agentSchema.deletedAt)),
      });
    }),
  byKeyLastBlock: publicProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ ctx, input }) => {
      const lastBlock = await ctx.db
        .select({ value: max(agentSchema.atBlock) })
        .from(agentSchema)
        .limit(1);

      if (!lastBlock[0]?.value) {
        return null;
      }

      const result = await ctx.db
        .select()
        .from(agentSchema)
        .where(
          and(
            isNull(agentSchema.deletedAt),
            eq(agentSchema.atBlock, lastBlock[0].value),
            eq(agentSchema.key, input.key),
          ),
        )
        .limit(1);
      const indexededResult = result[0];
      return indexededResult ?? null;
    }),
  namesByKeysLastBlock: publicProcedure
    .input(z.object({ keys: z.array(z.string()) }))
    .query(async ({ ctx, input }) => {
      if (input.keys.length === 0) {
        return {} as Record<string, string>;
      }

      const lastBlock = await ctx.db
        .select({ value: max(agentSchema.atBlock) })
        .from(agentSchema)
        .limit(1);

      if (!lastBlock[0]?.value) {
        return {} as Record<string, string>;
      }

      const results = await ctx.db
        .select({ key: agentSchema.key, name: agentSchema.name })
        .from(agentSchema)
        .where(
          and(
            isNull(agentSchema.deletedAt),
            eq(agentSchema.atBlock, lastBlock[0].value),
            inArray(agentSchema.key, input.keys),
          ),
        );

      const nameMap: Record<string, string> = {};
      results.forEach((agent) => {
        if (agent.name) {
          nameMap[agent.key] = agent.name;
        }
      });

      return nameMap;
    }),
  allWithAggregatedPenalties: publicProcedure.query(async ({ ctx }) => {
    const agents = await ctx.db.query.agentSchema.findMany({
      where: and(
        eq(agentSchema.isWhitelisted, true),
        isNull(agentSchema.deletedAt),
      ),
    });

    const agentKeys = agents.map((agent) => agent.key);

    const penalties = await ctx.db.query.penalizeAgentVotesSchema.findMany({
      where: inArray(penalizeAgentVotesSchema.agentKey, agentKeys),
    });

    const penaltiesByAgent = penalties.reduce(
      (acc, penalty) => {
        acc[penalty.agentKey] ??= [];
        acc[penalty.agentKey]?.push(penalty);
        return acc;
      },
      {} as Record<string, typeof penalties>,
    );

    return agents.map((agent) => ({
      ...agent,
      penalties: penaltiesByAgent[agent.key] ?? [],
    }));
  }),

  /**
   * Returns connection counts for agents:
   * - subagentCounts: For root agents, the count of all connected agents in their swarm
   * - parentCounts: For all agents, the count of root agents that grant permissions to them
   */
  agentConnectionCounts: publicProcedure.query(async ({ ctx }) => {
    // 1. Fetch all relationships from multiple sources
    // Source 1: Base permissions (grantorAccountId -> granteeAccountId)
    const basePermissions = await ctx.db
      .select({
        grantor: permissionsSchema.grantorAccountId,
        grantee: permissionsSchema.granteeAccountId,
      })
      .from(permissionsSchema)
      .where(isNull(permissionsSchema.deletedAt));

    // Source 2: Namespace permissions (grantor -> recipient)
    const namespaceRelations = await ctx.db
      .select({
        grantor: permissionsSchema.grantorAccountId,
        grantee: namespacePermissionsSchema.recipient,
      })
      .from(namespacePermissionsSchema)
      .innerJoin(
        permissionsSchema,
        eq(
          namespacePermissionsSchema.permissionId,
          permissionsSchema.permissionId,
        ),
      )
      .where(isNull(permissionsSchema.deletedAt));

    // Source 3: Emission distribution targets (grantor -> targetAccountId)
    const emissionTargets = await ctx.db
      .select({
        grantor: permissionsSchema.grantorAccountId,
        grantee: emissionDistributionTargetsSchema.targetAccountId,
      })
      .from(emissionDistributionTargetsSchema)
      .innerJoin(
        permissionsSchema,
        eq(
          emissionDistributionTargetsSchema.permissionId,
          permissionsSchema.permissionId,
        ),
      )
      .where(isNull(permissionsSchema.deletedAt));

    // 2. Fetch whitelisted (root) agents
    const whitelistedAgents = await ctx.db
      .select({ key: agentSchema.key })
      .from(agentSchema)
      .where(
        and(eq(agentSchema.isWhitelisted, true), isNull(agentSchema.deletedAt)),
      );

    const whitelistedSet = new Set(whitelistedAgents.map((a) => a.key));

    // 3. Build adjacency lists from all relationship sources
    const adjacencyList = new Map<string, Set<string>>();
    const reverseAdjacencyList = new Map<string, Set<string>>();

    const addRelation = (grantor: string, grantee: string | null) => {
      if (!grantee) return;

      // Forward: grantor -> grantee (for subagent traversal)
      const grantorNeighbors = adjacencyList.get(grantor);
      if (grantorNeighbors) {
        grantorNeighbors.add(grantee);
      } else {
        adjacencyList.set(grantor, new Set([grantee]));
      }

      // Reverse: grantee -> grantor (for parent lookup)
      const granteeNeighbors = reverseAdjacencyList.get(grantee);
      if (granteeNeighbors) {
        granteeNeighbors.add(grantor);
      } else {
        reverseAdjacencyList.set(grantee, new Set([grantor]));
      }
    };

    // Add relationships from all sources
    for (const p of basePermissions) {
      addRelation(p.grantor, p.grantee);
    }
    for (const p of namespaceRelations) {
      addRelation(p.grantor, p.grantee);
    }
    for (const p of emissionTargets) {
      addRelation(p.grantor, p.grantee);
    }

    // 4. Calculate subagent counts for root agents (BFS traversal)
    const subagentCounts: Record<string, number> = {};
    for (const rootKey of whitelistedSet) {
      const visited = new Set<string>();
      const queue = [rootKey];

      while (queue.length > 0) {
        const current = queue.shift();
        if (!current || visited.has(current)) continue;
        visited.add(current);

        const neighbors = adjacencyList.get(current);
        if (neighbors) {
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
              queue.push(neighbor);
            }
          }
        }
      }

      visited.delete(rootKey); // Don't count self
      subagentCounts[rootKey] = visited.size;
    }

    // 5. Calculate parent counts for all agents (only counting root agent parents)
    const parentCounts: Record<string, number> = {};
    for (const [grantee, grantors] of reverseAdjacencyList) {
      const rootParents = [...grantors].filter((g) => whitelistedSet.has(g));
      if (rootParents.length > 0) {
        parentCounts[grantee] = rootParents.length;
      }
    }

    return { subagentCounts, parentCounts };
  }),
} satisfies TRPCRouterRecord;
