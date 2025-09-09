import { SS58_SCHEMA } from "@torus-network/sdk/types";
import { z } from "zod";

const OPERATION_TYPE_SCHEMA = z.enum(["Unstake", "Transfer"]);

const UNSTAKE_DATA_SCHEMA = z.object({
  staked: SS58_SCHEMA,
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine(
      (value) => {
        try {
          const amount = BigInt(value);
          return amount > 0n;
        } catch {
          return false;
        }
      },
      "Amount must be a valid positive number",
    ),
});

const TRANSFER_DATA_SCHEMA = z.object({
  from: SS58_SCHEMA,
  to: SS58_SCHEMA,
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine(
      (value) => {
        try {
          const amount = BigInt(value);
          return amount > 0n;
        } catch {
          return false;
        }
      },
      "Amount must be a valid positive number",
    ),
});

export const EXECUTE_WALLET_SCHEMA = z.object({
  operationType: OPERATION_TYPE_SCHEMA,
  unstakeData: UNSTAKE_DATA_SCHEMA,
  transferData: TRANSFER_DATA_SCHEMA,
});

export type ExecuteWalletFormData = z.infer<typeof EXECUTE_WALLET_SCHEMA>;