import { isSS58 } from "@torus-network/sdk/types";
import { formatToken, toNano } from "@torus-network/torus-utils/torus/token";
import { isAmountPositive, meetsMinimumStake } from "~/utils/validators";
import type { RefObject } from "react";
import { z } from "zod";

export const createTransferStakeFormSchema = (
  minAllowedStakeData: bigint,
  existencialDepositValue: bigint,
  accountFreeBalance: bigint,
  estimatedFee: bigint | undefined,
  maxAmountRef: RefObject<string>,
) =>
  z
    .object({
      fromValidator: z
        .string()
        .nonempty({ message: "From Allocator is required" })
        .refine(isSS58, { message: "Invalid address" }),
      toValidator: z
        .string()
        .nonempty({ message: "To Allocator is required" })
        .refine(isSS58, { message: "Invalid address" }),
      amount: z
        .string()
        .nonempty({ message: "Amount is required" })
        .refine(isAmountPositive, {
          message: "Amount must be greater than 0",
        })
        .refine(
          (val) =>
            maxAmountRef.current
              ? toNano(val) <= toNano(maxAmountRef.current)
              : false,
          { message: "Amount exceeds maximum transferable amount" },
        )
        .refine((value) => meetsMinimumStake(value, minAllowedStakeData), {
          message: `You must transfer at least ${formatToken(minAllowedStakeData)} TORUS`,
        })
        .refine(
          () =>
            (accountFreeBalance || 0n) - (estimatedFee ?? 0n) >=
            existencialDepositValue,
          {
            message: `This transaction fee would make your account go below the existential deposit (${formatToken(existencialDepositValue)} TORUS). Top up your balance before moving your stake.`,
          },
        ),
    })
    .refine((data) => data.fromValidator !== data.toValidator, {
      message: "Recipient cannot be the same as sender",
      path: ["toValidator"],
    });

export type TransferStakeFormValues = z.infer<
  ReturnType<typeof createTransferStakeFormSchema>
>;
