import { isSS58 } from "@torus-network/sdk";
import { formatToken, toNano } from "@torus-network/torus-utils/subspace";
import { z } from "zod";
import { isAmountPositive, meetsMinimumStake } from "~/utils/validators";
import type { FeeLabelHandle } from "../../../_components/fee-label";
import type { RefObject } from "react";

export const createTransferStakeFormSchema = (
  minAllowedStakeData: bigint,
  existencialDepositValue: bigint,
  accountFreeBalance: bigint,
  feeRef: RefObject<FeeLabelHandle | null>,
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
              : true,
          { message: "Amount exceeds maximum transferable amount" },
        )
        .refine((value) => meetsMinimumStake(value, minAllowedStakeData), {
          message: `You must unstake at least ${formatToken(minAllowedStakeData)} TORUS`,
        })
        .refine(
          () =>
            (accountFreeBalance || 0n) -
              toNano(feeRef.current?.getEstimatedFee() ?? "0") >=
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
