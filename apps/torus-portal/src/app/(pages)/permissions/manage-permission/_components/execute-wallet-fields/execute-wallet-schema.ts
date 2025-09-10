import { SS58_SCHEMA } from "@torus-network/sdk/types";
import { z } from "zod";

const OPERATION_TYPE_SCHEMA = z.enum(["Unstake", "Transfer"]);

const UNSTAKE_DATA_SCHEMA = z.object({
  staked: SS58_SCHEMA,
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((value) => {
      try {
        const amount = BigInt(value);
        return amount > 0n;
      } catch {
        return false;
      }
    }, "Amount must be a valid positive number"),
});

const TRANSFER_DATA_SCHEMA = z.object({
  from: SS58_SCHEMA,
  to: SS58_SCHEMA,
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((value) => {
      try {
        const amount = BigInt(value);
        return amount > 0n;
      } catch {
        return false;
      }
    }, "Amount must be a valid positive number"),
});

export const EXECUTE_WALLET_SCHEMA = z.discriminatedUnion("operationType", [
  z.object({
    operationType: z.literal("Unstake"),
    unstakeData: UNSTAKE_DATA_SCHEMA,
    transferData: z
      .object({
        from: z.string(),
        to: z.string(),
        amount: z.string(),
      })
      .optional(),
  }),
  z.object({
    operationType: z.literal("Transfer"),
    transferData: TRANSFER_DATA_SCHEMA,
    unstakeData: z
      .object({
        staked: z.string(),
        amount: z.string(),
      })
      .optional(),
  }),
]);

export type ExecuteWalletFormData = z.infer<typeof EXECUTE_WALLET_SCHEMA>;
