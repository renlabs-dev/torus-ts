import { and, desc, eq, isNull, sql } from "@torus-ts/db";
import { transactionHistorySchema } from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../trpc";

const transactionTypeEnum = z.enum([
  "SEND",
  "STAKE",
  "UNSTAKE",
  "TRANSFER_STAKE",
] as const);

const transactionStatusEnum = z.enum(["PENDING", "SUCCESS", "ERROR"] as const);

export const transactionHistoryRouter = {
  // GET by user
  byUser: publicProcedure
    .input(
      z.object({
        userKey: z.string(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().default(50),
        type: transactionTypeEnum.optional(),
        status: transactionStatusEnum.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { userKey, page, limit, type, status } = input;
      const offset = (page - 1) * limit;

      let whereClause = and(
        eq(transactionHistorySchema.userKey, userKey),
        isNull(transactionHistorySchema.deletedAt),
      );

      if (type) {
        whereClause = and(whereClause, eq(transactionHistorySchema.type, type));
      }

      if (status) {
        whereClause = and(
          whereClause,
          eq(transactionHistorySchema.status, status),
        );
      }

      const transactions = await ctx.db
        .select()
        .from(transactionHistorySchema)
        .where(whereClause)
        .orderBy(desc(transactionHistorySchema.createdAt))
        .limit(limit)
        .offset(offset);

      const countResult = await ctx.db
        .select({ count: sql`count(*)` })
        .from(transactionHistorySchema)
        .where(whereClause);

      const totalCount = Number(countResult[0]?.count ?? 0);
      const totalPages = Math.ceil(totalCount / limit);

      return {
        transactions,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          pageSize: limit,
          hasMore: page < totalPages,
        },
      };
    }),

  // GET by ID
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.transactionHistorySchema.findFirst({
        where: and(
          eq(transactionHistorySchema.id, input.id),
          isNull(transactionHistorySchema.deletedAt),
        ),
      });
    }),

  // CREATE
  create: publicProcedure
    .input(
      z.object({
        userKey: z.string(),
        type: transactionTypeEnum,
        amount: z.string(), // Will be converted to bigint
        fee: z.string().optional(),
        fromAddress: z.string(),
        toAddress: z.string(),
        hash: z.string().optional(),
        blockHeight: z.number().optional(),
        metadata: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { fee, ...rest } = input;

      const [transaction] = await ctx.db
        .insert(transactionHistorySchema)
        .values({
          ...rest,
          amount: BigInt(input.amount),
          fee: fee ? BigInt(fee) : undefined,
          status: "PENDING" as keyof typeof transactionStatusValues,
        })
        .returning();

      return transaction;
    }),
} satisfies TRPCRouterRecord;
