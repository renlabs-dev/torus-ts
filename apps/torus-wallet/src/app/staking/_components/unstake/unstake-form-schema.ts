import { isSS58 } from "@torus-network/sdk/types";
import { formatToken, toNano } from "@torus-network/torus-utils/torus/token";
import { isAmountPositive, meetsMinimumStake } from "~/utils/validators";
import { z } from "zod";

export const createUnstakeFormSchema = (
  minAllowedStakeData: bigint,
  existencialDepositValue: bigint,
  accountFreeBalance: bigint,
  estimatedFee: bigint | undefined,
  stakedAmount: bigint | null,
) =>
  z
    .object({
      validator: z
        .string()
        .nonempty({ message: "Validator address is required" })
        .refine(isSS58, { message: "Invalid validator address" }),
      amount: z
        .string()
        .nonempty({ message: "Unstake amount is required" })
        .refine(isAmountPositive, {
          message: "Amount must be greater than 0",
        })
        .refine((value) => meetsMinimumStake(value, minAllowedStakeData), {
          message: `You must unstake at least ${formatToken(minAllowedStakeData)} TORUS`,
        })
        .refine(
          () =>
            (accountFreeBalance || 0n) - (estimatedFee ?? 0n) >=
            existencialDepositValue,
          {
            message: `This transaction fee would make your account go below the existential deposit (${formatToken(existencialDepositValue)} TORUS). Top up your balance before unstaking.`,
          },
        ),
    })
    .superRefine((data, ctx) => {
      if (stakedAmount !== null) {
        if (toNano(data.amount) > stakedAmount) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Amount exceeds staked amount",
            path: ["amount"],
          });
        }
      }
    });

export type UnstakeFormValues = z.infer<
  ReturnType<typeof createUnstakeFormSchema>
>;
