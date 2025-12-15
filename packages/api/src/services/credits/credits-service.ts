import type { ApiPromise } from "@polkadot/api";
import type { SS58Address } from "@torus-network/sdk/types";
import { torusToCredits } from "@torus-network/torus-utils";
import type { TorAmount } from "@torus-network/torus-utils/torus/token";
import { makeTorAmount } from "@torus-network/torus-utils/torus/token";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { eq, sql } from "@torus-ts/db";
import type { DB } from "@torus-ts/db/client";
import { creditPurchasesSchema, userCreditsSchema } from "@torus-ts/db/schema";
import { verifyTorusTransfer } from "../../utils/verify-transaction";

/**
 * Error codes for credits operations
 */
export const CreditsErrorCode = {
  DUPLICATE_TRANSACTION: "DUPLICATE_TRANSACTION",
  VERIFICATION_FAILED: "VERIFICATION_FAILED",
  INSUFFICIENT_CREDITS: "INSUFFICIENT_CREDITS",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type CreditsErrorCode =
  (typeof CreditsErrorCode)[keyof typeof CreditsErrorCode];

/**
 * Standard error type for credits operations
 */
export class CreditsError extends Error {
  constructor(
    public readonly code: CreditsErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "CreditsError";
  }
}

/**
 * Input for purchasing credits
 */
export interface PurchaseCreditsInput {
  txHash: string;
  blockHash: string;
  userKey: SS58Address;
}

/**
 * Result of a successful credits purchase
 */
export interface PurchaseCreditsResult {
  creditsGranted: TorAmount;
  torusAmount: string;
}

/**
 * Credit balance information
 */
export interface CreditBalance {
  balance: string;
  totalPurchased: string;
  totalSpent: string;
}

/**
 * Credit purchase history item
 */
export interface CreditPurchaseHistoryItem {
  id: string;
  userKey: string;
  txHash: string;
  torusAmount: string | null;
  creditsGranted: string | null;
  blockNumber: bigint | null;
  createdAt: Date;
}

/**
 * Dependencies required for the credits service
 */
export interface CreditsServiceDeps {
  db: DB;
  wsAPI: Promise<ApiPromise>;
  predictionAppAddress: SS58Address;
}

/**
 * Get credit balance for a wallet address.
 *
 * Returns zero balances if address not provided or not found.
 *
 * @param db - Database instance
 * @param userKey - Wallet address (optional)
 */
export async function getBalance(
  db: DB,
  userKey?: string,
): Promise<CreditBalance> {
  if (!userKey) {
    return {
      balance: "0",
      totalPurchased: "0",
      totalSpent: "0",
    };
  }

  const record = await db.query.userCreditsSchema.findFirst({
    where: eq(userCreditsSchema.userKey, userKey),
  });

  return {
    balance: record?.balance ?? "0",
    totalPurchased: record?.totalPurchased ?? "0",
    totalSpent: record?.totalSpent ?? "0",
  };
}

/**
 * Purchase credits by verifying a TORUS token transfer.
 *
 * Verifies the transaction on-chain and grants credits at 1:1 rate.
 * Transaction hash can only be used once (prevents double-spend).
 *
 * @param deps - Service dependencies (db, wsAPI, predictionAppAddress)
 * @param input - Purchase input (txHash, blockHash, userKey)
 * @throws CreditsError with appropriate code on failure
 */
export async function purchaseCredits(
  deps: CreditsServiceDeps,
  input: PurchaseCreditsInput,
): Promise<PurchaseCreditsResult> {
  const { db, wsAPI, predictionAppAddress } = deps;
  const { txHash, blockHash, userKey } = input;

  return await db.transaction(async (tx) => {
    // 1. Insert payment record with nulls (unique constraint prevents double-spend)
    const [insertErr] = await tryAsync(
      tx.insert(creditPurchasesSchema).values({
        userKey,
        txHash,
        torusAmount: null,
        creditsGranted: null,
        blockNumber: null,
      }),
    );

    if (insertErr !== undefined) {
      // Check if it's a duplicate key error (code 23505)
      if ("code" in insertErr && insertErr.code === "23505") {
        throw new CreditsError(
          CreditsErrorCode.DUPLICATE_TRANSACTION,
          "Transaction already used. Each transaction can only be used once to purchase credits.",
        );
      }
      throw new CreditsError(
        CreditsErrorCode.INTERNAL_ERROR,
        `Failed to insert payment record: ${insertErr.message}`,
      );
    }

    // 2. Verify transaction on-chain
    const verified = await verifyTorusTransfer(
      wsAPI,
      txHash,
      blockHash,
      userKey,
      predictionAppAddress,
    );

    const credits = torusToCredits(makeTorAmount(verified.amount));
    console.log("credits bought: ", credits);

    // 3. Update payment record with verified data
    await tx
      .update(creditPurchasesSchema)
      .set({
        torusAmount: verified.amount.toString(),
        creditsGranted: credits.toString(),
        blockNumber: BigInt(verified.blockNumber),
      })
      .where(eq(creditPurchasesSchema.txHash, txHash));

    // 4. Lock user's credit row to prevent race conditions
    await tx.execute(sql`
      SELECT balance FROM user_credits
      WHERE user_key = ${userKey}
      FOR UPDATE
    `);

    // 5. Grant credits with Drizzle upsert
    await tx
      .insert(userCreditsSchema)
      .values({
        userKey,
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
}

/**
 * Get credit purchase history for a user.
 *
 * @param db - Database instance
 * @param userKey - Wallet address
 * @param limit - Maximum number of records to return (default: 50)
 */
export async function getPurchaseHistory(
  db: DB,
  userKey: string,
  limit = 50,
): Promise<CreditPurchaseHistoryItem[]> {
  const purchases = await db
    .select()
    .from(creditPurchasesSchema)
    .where(eq(creditPurchasesSchema.userKey, userKey))
    .orderBy(sql`${creditPurchasesSchema.createdAt} DESC`)
    .limit(limit);

  return purchases;
}
