import {
  CreditsError,
  CreditsErrorCode,
  getBalance,
  getPurchaseHistory,
  purchaseCredits,
} from "@torus-ts/api/services/credits";
import { z } from "zod";
import type { AppContext } from "../context";
import type { AuthApp } from "../middleware/auth";
import { HttpError } from "../utils/errors";

const getBalanceQuerySchema = z.object({
  userKey: z.string().optional(),
});

const purchaseCreditsBodySchema = z.object({
  txHash: z.string().length(66, "Transaction hash must be 66 characters"),
  blockHash: z.string().length(66, "Block hash must be 66 characters"),
});

export const creditsRouter = (app: AuthApp) =>
  app.group("/v1/credits", (app) =>
    app
      .get(
        "/balance",
        async ({ query, store }) => {
          const ctx = store as AppContext;
          const parsed = getBalanceQuerySchema.safeParse(query);

          if (!parsed.success) {
            throw new HttpError(400, parsed.error.message);
          }

          return getBalance(ctx.db, parsed.data.userKey);
        },
        {
          query: getBalanceQuerySchema,
          detail: {
            tags: ["credits"],
            summary: "Get credit balance",
            description:
              "Get credit balance for a wallet address. Returns zero balances if address not provided or not found.",
          },
        },
      )
      .get(
        "/history",
        async ({ store, userKey }) => {
          const ctx = store as AppContext;
          return getPurchaseHistory(ctx.db, userKey);
        },
        {
          detail: {
            tags: ["credits"],
            summary: "Get purchase history",
            description:
              "Get credit purchase history for the authenticated user.",
          },
        },
      )
      .post(
        "/purchase",
        async ({ body, store, userKey }) => {
          const ctx = store as AppContext;
          const parsed = purchaseCreditsBodySchema.safeParse(body);

          if (!parsed.success) {
            throw new HttpError(400, parsed.error.message);
          }

          try {
            const result = await purchaseCredits(
              {
                db: ctx.db,
                wsAPI: ctx.wsAPI,
                predictionAppAddress:
                  ctx.env.NEXT_PUBLIC_PREDICTION_APP_ADDRESS,
              },
              {
                txHash: parsed.data.txHash,
                blockHash: parsed.data.blockHash,
                userKey,
              },
            );

            return {
              creditsGranted: result.creditsGranted.toString(),
              torusAmount: result.torusAmount,
            };
          } catch (error) {
            if (error instanceof CreditsError) {
              if (error.code === CreditsErrorCode.DUPLICATE_TRANSACTION) {
                throw new HttpError(400, error.message);
              }
              throw new HttpError(500, error.message);
            }
            throw error;
          }
        },
        {
          body: purchaseCreditsBodySchema,
          detail: {
            tags: ["credits"],
            summary: "Purchase credits",
            description:
              "Purchase credits by verifying a TORUS token transfer. Verifies the transaction on-chain and grants credits at 1:1 rate.",
          },
        },
      ),
  );
