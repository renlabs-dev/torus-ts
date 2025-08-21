import { z } from "zod";

import { isSS58 } from "@torus-network/sdk/types";
import { formatToken } from "@torus-network/torus-utils/torus/token";

import {
  doesNotExceedMaxStake,
  isAboveExistentialDeposit,
  isAmountPositive,
  meetsMinimumStake,
} from "~/utils/validators";

export const createStakeActionFormSchema = (
  minAllowedStakeData: bigint,
  existencialDepositValue: bigint,
  accountFreeBalance: bigint,
  estimatedFee: bigint | undefined,
) =>
  z.object({
    recipient: z
      .string()
      .nonempty({ message: "Allocator address is required" })
      .refine(isSS58, { message: "Invalid allocator address" }),
    amount: z
      .string()
      .nonempty({ message: "Stake amount is required" })
      .refine(isAmountPositive, { message: "Amount must be greater than 0" })
      .refine((value) => meetsMinimumStake(value, minAllowedStakeData), {
        message: `You must stake at least ${formatToken(minAllowedStakeData)} TORUS`,
      })
      .refine(
        (value) =>
          isAboveExistentialDeposit(
            value,
            estimatedFee ?? 0n,
            accountFreeBalance,
            existencialDepositValue,
          ),
        {
          message: `This amount would go below the existential deposit (${formatToken(existencialDepositValue)} TORUS). Reduce the stake or top up your balance.`,
        },
      )
      .refine(
        (value) =>
          doesNotExceedMaxStake(
            value,
            estimatedFee ?? 0n,
            accountFreeBalance,
            existencialDepositValue,
          ),
        { message: "Amount exceeds maximum stakable balance" },
      ),
  });

export type StakeFormValues = z.infer<
  ReturnType<typeof createStakeActionFormSchema>
>;
