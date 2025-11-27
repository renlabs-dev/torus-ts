import { torusToCredits } from "@torus-network/torus-utils";
import { makeTorAmount } from "@torus-network/torus-utils/torus/token";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { eq, sql } from "@torus-ts/db";
import { creditPurchasesSchema, userCreditsSchema } from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { authenticatedProcedure, publicProcedure } from "../../trpc";
import { verifyTorusTransfer } from "../../utils/verify-transaction";

/**
 * Credits router - manage user credit balances and purchases.
 *
 * Credits are purchased with TORUS tokens and spent on services like Twitter scraping.
 */
export const creditsRouter = {
  /**
   * Get credit balance for a wallet address.
   *
   * Public endpoint - no authentication required.
   * Returns zero balances if address not provided or not found.
   */
  getBalance: publicProcedure
    .input(
      z
        .object({
          userKey: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const userKey = input?.userKey;

      if (!userKey) {
        return {
          balance: "0",
          totalPurchased: "0",
          totalSpent: "0",
        };
      }

      const record = await ctx.db.query.userCreditsSchema.findFirst({
        where: eq(userCreditsSchema.userKey, userKey),
      });

      return {
        balance: record?.balance ?? "0",
        totalPurchased: record?.totalPurchased ?? "0",
        totalSpent: record?.totalSpent ?? "0",
      };
    }),

  /**
   * Purchase credits by verifying a TORUS token transfer.
   *
   * Verifies the transaction on-chain and grants credits at 1:1 rate.
   * Transaction hash can only be used once (prevents double-spend).
   */
  purchaseCredits: authenticatedProcedure
    .input(
      z.object({
        txHash: z.string().length(66),
        blockHash: z.string().length(66),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.transaction(async (tx) => {
        // 1. Insert payment record with nulls (unique constraint prevents double-spend)
        // Catch duplicate key error and return friendly message
        const [insertErr] = await tryAsync(
          tx.insert(creditPurchasesSchema).values({
            userKey: ctx.sessionData.userKey,
            txHash: input.txHash,
            torusAmount: null,
            creditsGranted: null,
            blockNumber: null,
          }),
        );

        if (insertErr !== undefined) {
          // Check if it's a duplicate key error (code 23505)
          if ("code" in insertErr && insertErr.code === "23505") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Transaction already used. Each transaction can only be used once to purchase credits.",
            });
          }
          // Re-throw other errors
          throw insertErr;
        }

        // 2. Verify transaction on-chain
        const verified = await verifyTorusTransfer(
          ctx.wsAPI,
          input.txHash,
          input.blockHash,
          ctx.sessionData.userKey,
          ctx.predictionAppAddress,
        );

        const credits = torusToCredits(makeTorAmount(verified.amount));
        console.log("credits bought: ", credits);

        // 4. Update payment record with verified data
        await tx
          .update(creditPurchasesSchema)
          .set({
            torusAmount: verified.amount.toString(),
            creditsGranted: credits.toString(),
            blockNumber: BigInt(verified.blockNumber),
          })
          .where(eq(creditPurchasesSchema.txHash, input.txHash));

        // 5. Lock user's credit row to prevent race conditions
        await tx.execute(sql`
          SELECT balance FROM user_credits
          WHERE user_key = ${ctx.sessionData.userKey}
          FOR UPDATE
        `);

        // 6. Grant credits with Drizzle upsert
        await tx
          .insert(userCreditsSchema)
          .values({
            userKey: ctx.sessionData.userKey,
            balance: credits.toString(),
            totalPurchased: credits.toString(),
            totalSpent: "0",
          })
          .onConflictDoUpdate({
            target: userCreditsSchema.userKey,
            set: {
              balance: sql`${userCreditsSchema.balance} + ${credits}`,
              totalPurchased: sql`${userCreditsSchema.totalPurchased} + ${credits}`,
              updatedAt: new Date(),
            },
          });

        return {
          creditsGranted: credits,
          torusAmount: verified.amount.toString(),
        };
      });
    }),

  /**
   * Get credit purchase history for the authenticated user.
   */
  getPurchaseHistory: authenticatedProcedure.query(async ({ ctx }) => {
    const purchases = await ctx.db
      .select()
      .from(creditPurchasesSchema)
      .where(eq(creditPurchasesSchema.userKey, ctx.sessionData.userKey))
      .orderBy(sql`${creditPurchasesSchema.createdAt} DESC`)
      .limit(50);

    return purchases;
  }),
} satisfies TRPCRouterRecord;
