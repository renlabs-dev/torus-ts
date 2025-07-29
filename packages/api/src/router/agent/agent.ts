import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { and, eq, gte, inArray, isNull, max, sql } from "@torus-ts/db";
import {
  agentSchema,
  computedAgentWeightSchema,
  penalizeAgentVotesSchema,
} from "@torus-ts/db/schema";

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
        orderBy: z.enum(["createdAt.asc", "createdAt.desc"]).optional(),
        isWhitelisted: z.boolean().optional().default(true),
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
        eq(agentSchema.isWhitelisted, isWhitelisted),
        isNull(agentSchema.deletedAt),
        gte(agentSchema.atBlock, agentsLastBlock[0].value),
      );

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

      let orderByClause = sql`${computedAgentWeightSchema.percComputedWeight} desc nulls last`;

      if (orderBy) {
        const [field, direction = "asc"] = orderBy.split(".");
        const column = agentSchema[field as keyof typeof agentSchema];
        orderByClause = sql`${column} ${sql.raw(direction.toUpperCase())}`;
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
} satisfies TRPCRouterRecord;
