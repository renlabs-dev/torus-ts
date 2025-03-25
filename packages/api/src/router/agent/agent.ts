import { publicProcedure } from "../../trpc";
import { eq, and, max, isNull, inArray, sql } from "@torus-ts/db";
import {
  agentSchema,
  penalizeAgentVotesSchema,
  computedAgentWeightSchema,
} from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

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
  paginated: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().default(9),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search } = input;
      const offset = (page - 1) * limit;

      const lastBlockQuery = ctx.db
        .select({ value: max(computedAgentWeightSchema.atBlock) })
        .from(computedAgentWeightSchema);

      const lastBlockResult = await lastBlockQuery;
      const lastBlock = lastBlockResult[0]?.value;

      let whereClause = and(
        eq(agentSchema.isWhitelisted, true),
        isNull(agentSchema.deletedAt),
      );

      if (search) {
        whereClause = and(
          whereClause,
          sql`(${agentSchema.name} ILIKE ${`%${search}%`} OR ${agentSchema.key} ILIKE ${`%${search}%`})`,
        );
      }

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
            lastBlock
              ? eq(computedAgentWeightSchema.atBlock, lastBlock)
              : sql`1=1`,
            isNull(computedAgentWeightSchema.deletedAt),
          ),
        )
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(
          sql`${computedAgentWeightSchema.percComputedWeight} desc nulls last`,
        );

      const countResult = await ctx.db
        .select({ count: sql`count(*)` })
        .from(agentSchema)
        .where(whereClause);

      const totalCount = Number(countResult[0]?.count ?? 0);
      const totalPages = Math.ceil(totalCount / limit);

      return {
        agents,
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
      const lastBlock = ctx.db
        .select({ value: max(agentSchema.atBlock) })
        .from(agentSchema);
      const result = await ctx.db
        .select()
        .from(agentSchema)
        .where(
          and(
            isNull(agentSchema.deletedAt),
            eq(agentSchema.atBlock, lastBlock),
            eq(agentSchema.key, input.key),
          ),
        )
        .limit(1);
      return result[0];
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
