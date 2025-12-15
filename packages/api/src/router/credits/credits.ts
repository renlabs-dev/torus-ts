import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  CreditsError,
  CreditsErrorCode,
  getBalance,
  getPurchaseHistory,
  purchaseCredits,
} from "../../services/credits";
import { authenticatedProcedure, publicProcedure } from "../../trpc";

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
      return getBalance(ctx.db, input?.userKey);
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
      try {
        return await purchaseCredits(
          {
            db: ctx.db,
            wsAPI: ctx.wsAPI,
            predictionAppAddress: ctx.predictionAppAddress,
          },
          {
            txHash: input.txHash,
            blockHash: input.blockHash,
            userKey: ctx.sessionData.userKey,
          },
        );
      } catch (error) {
        if (error instanceof CreditsError) {
          if (error.code === CreditsErrorCode.DUPLICATE_TRANSACTION) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: error.message,
            });
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }
        throw error;
      }
    }),

  /**
   * Get credit purchase history for the authenticated user.
   */
  getPurchaseHistory: authenticatedProcedure.query(async ({ ctx }) => {
    return getPurchaseHistory(ctx.db, ctx.sessionData.userKey);
  }),
} satisfies TRPCRouterRecord;
