import type { TransactionStatus } from "@torus-ts/torus-provider/types";
import { api } from "~/utils/api";

interface SaveTransactionParams {
  type: "SEND" | "STAKE" | "UNSTAKE" | "TRANSFER_STAKE";
  userKey: `SS58:${string}`;
  fromAddress: `SS58:${string}`;
  toAddress: `SS58:${string}`;
  amount: string;
  fee?: string;
}

/**
 * Saves a transaction to the transaction history database via API
 * Returns a function that can be called to update the transaction status
 */
export async function saveTransaction({
  type,
  userKey,
  fromAddress,
  toAddress,
  amount,
  fee,
}: SaveTransactionParams) {
  try {
    // Get the TRPC client
    const trpc = api.useContext();
    
    // Create the initial transaction record with PENDING status
    const transaction = await trpc.transactionHistory.create.mutate({
      userKey,
      type,
      amount,
      fee,
      fromAddress,
      toAddress,
    });
    
    // Return a function to update the transaction status later
    return async (status: TransactionStatus, hash?: string, blockHeight?: number) => {
      await trpc.transactionHistory.update.mutate({
        id: transaction.id,
        status: status.status || "PENDING",
        hash,
        blockHeight,
      });
    };
  } catch (error) {
    console.error("Failed to save transaction:", error);
    // Return a no-op function in case of error
    return async () => {
      console.error("Transaction update skipped due to initial save failure");
    };
  }
}