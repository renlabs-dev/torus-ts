import { isSS58 } from "@torus-network/sdk";
import { z } from "zod";
import type { FeeLabelHandle } from "~/app/_components/fee-label";
import { isWithinTransferLimit } from "~/utils/validators";
import { toNano } from "@torus-ts/utils/subspace";
import type { RefObject } from "react";

export type SendFormValues = z.infer<ReturnType<typeof createSendFormSchema>>;

export const createSendFormSchema = (
  accountFreeBalance: bigint | null,
  feeRef: RefObject<FeeLabelHandle | null>,
) =>
  z.object({
    recipient: z
      .string()
      .nonempty({ message: "Recipient address is required" })
      .refine(isSS58, { message: "Invalid recipient address" }),
    amount: z
      .string()
      .nonempty({ message: "Amount is required" })
      .refine((amount) => /^\d+(\.\d+)?$/.test(amount), {
        message: "Amount must be a valid number",
      })
      .refine((amount) => toNano(amount.toString()) > 0n, {
        message: "Amount must be greater than 0",
      })
      .refine(
        (amount) =>
          isWithinTransferLimit(
            amount,
            feeRef.current?.getEstimatedFee() ?? "0",
            accountFreeBalance ?? 0n,
          ),
        { message: "Amount exceeds maximum transferable amount" },
      ),
  });
