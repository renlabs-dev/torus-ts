import type { RefObject } from "react";

import { z } from "zod";

import { isSS58 } from "@torus-network/sdk/types";
import { toNano } from "@torus-network/torus-utils/torus/token";

import type { FeeLabelHandle } from "~/app/_components/fee-label";
import { isWithinTransferLimit } from "~/utils/validators";

export type SendFormValues = z.infer<ReturnType<typeof createSendFormSchema>>;

export const createSendFormSchema = (
  accountFreeBalance: bigint | null,
  feeRef: RefObject<FeeLabelHandle | null>,
) =>
  z.object({
    recipient: z
      .string()
      .trim()
      .nonempty({ message: "Recipient address is required" })
      .refine(isSS58, { message: "Invalid recipient address" }),
    amount: z
      .string()
      .trim()
      .nonempty({ message: "Amount is required" })
      .refine((amount) => /^\d+(\.\d+)?$/.test(amount), {
        message: "Amount must be a valid number",
      })
      .refine((amount) => toNano(amount.toString()) > 0n, {
        message: "Amount must be greater than 0",
      })
      .refine(
        (amount) => {
          const estimatedFee = feeRef.current?.getEstimatedFee();

          if (estimatedFee === undefined || estimatedFee === null) {
            return false;
          }

          const balance = accountFreeBalance ?? 0n;
          return isWithinTransferLimit(amount, estimatedFee, balance);
        },
        {
          message:
            "Fee estimation is in progress or amount exceeds maximum transferable amount",
        },
      ),
  });
