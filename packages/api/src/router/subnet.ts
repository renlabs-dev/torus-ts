import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { and, eq, sql } from "@commune-ts/db";
import {
  computedSubnetWeights,
  subnetDataSchema,
  userSubnetDataSchema,
} from "@commune-ts/db/schema";
import { USER_SUBNET_DATA_INSERT_SCHEMA } from "@commune-ts/db/validation";

import { authenticatedProcedure, publicProcedure } from "../trpc";

export const subnetRouter = {
  // GET
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.subnetDataSchema.findMany();
  }),
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.subnetDataSchema.findFirst({
        where: eq(subnetDataSchema.id, input.id),
      });
    }),
  byNetuidLastBlock: publicProcedure
    .input(z.object({ netuid: z.number() }))
    .query(async ({ ctx, input }) => {
      const queryResult = await ctx.db
        .select()
        .from(subnetDataSchema)
        .where(
          and(
            sql`${subnetDataSchema.atBlock} = (SELECT MAX(${subnetDataSchema.atBlock}) FROM ${subnetDataSchema})`,
            eq(subnetDataSchema.netuid, input.netuid),
          ),
        )
        .limit(1)
        .then((result) => result[0]);
      return queryResult;
    }),
  paginatedAll: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(50),
        sortBy: z
          .enum([
            "id",
            "founderShare",
            "incentiveRatio",
            "proposalRewardTreasuryAllocation",
            "minValidatorStake",
            "createdAt",
          ])
          .default("id"),
        order: z.enum(["asc", "desc"]).default("asc"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, sortBy, order } = input;
      const offset = (page - 1) * limit;

      const subnets = await ctx.db.query.subnetDataSchema.findMany({
        limit: limit,
        offset: offset,
        orderBy: (subnetData, { asc, desc }) => [
          order === "asc" ? asc(subnetData[sortBy]) : desc(subnetData[sortBy]),
        ],
      });

      const totalCount = await ctx.db
        .select({ count: sql`count(*)` })
        .from(subnetDataSchema)
        .then((result) => Number(result[0]?.count));

      return {
        subnets,
        metadata: {
          currentPage: page,
          pageSize: limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    }),
  byUserSubnetData: publicProcedure
    .input(z.object({ userKey: z.string() }))
    .query(async ({ ctx, input }) => {
      // Query subnets table joining it with user subnet data table and
      // filtering by userKey
      return await ctx.db
        .select()
        .from(subnetDataSchema)
        .innerJoin(
          userSubnetDataSchema,
          eq(subnetDataSchema.netuid, userSubnetDataSchema.netuid),
        )
        .where(eq(userSubnetDataSchema.userKey, input.userKey))
        .execute();
    }),
  allComputedSubnetWeightsLastBlock: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select({
        subnetName: subnetDataSchema.name,
        subnetId: computedSubnetWeights.netuid,
        stakeWeight: computedSubnetWeights.stakeWeight,
        percWeight: computedSubnetWeights.percWeight,
      })
      .from(computedSubnetWeights)
      .where(
        eq(
          computedSubnetWeights.atBlock,
          sql`(SELECT MAX(at_block) FROM computed_subnet_weights)`,
        ),
      )
      .innerJoin(
        subnetDataSchema,
        eq(computedSubnetWeights.netuid, subnetDataSchema.netuid),
      );
  }),
  // POST
  deleteUserSubnetData: authenticatedProcedure
    .input(z.object({ userKey: z.string() }))
    .mutation(async ({ ctx }) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const userKey = ctx.sessionData!.userKey;
      await ctx.db
        .delete(userSubnetDataSchema)
        .where(eq(userSubnetDataSchema.userKey, userKey));
    }),
  createUserSubnetData: authenticatedProcedure
    .input(USER_SUBNET_DATA_INSERT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const userKey = ctx.sessionData!.userKey;
      await ctx.db
        .insert(userSubnetDataSchema)
        .values({
          netuid: input.netuid,
          userKey,
          weight: input.weight,
        })
        .onConflictDoUpdate({
          target: [userSubnetDataSchema.userKey, userSubnetDataSchema.netuid],
          set: { weight: input.weight },
        });
    }),
  createManyUserSubnetData: authenticatedProcedure
    .input(z.array(USER_SUBNET_DATA_INSERT_SCHEMA))
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const userKey = ctx.sessionData!.userKey;

      const dataToInsert = input.map((item) => ({
        netuid: item.netuid,
        weight: item.weight,
        userKey,
      }));

      await ctx.db.insert(userSubnetDataSchema).values(dataToInsert);
    }),
} satisfies TRPCRouterRecord;
