"use client";

import { Label } from "@torus-ts/ui/components/label";
import { TextField } from "~/app/_components/text-field";
import { useOriginBalance } from "~/hooks/balance/use-origin-balance";
import type { TransferFormValues } from "~/utils/types";
import { useFormikContext } from "formik";
import { MaxButton } from "../_components/max-button";
import { TokenBalance } from "../_components/token-balance";

export function AmountSection({ isReview }: Readonly<{ isReview: boolean }>) {
  const { values } = useFormikContext<TransferFormValues>();
  const { balance } = useOriginBalance(values);

  return (
    <div className="flex-1">
      <div className="flex justify-between pb-2 pr-1">
        <Label>Amount</Label>
        <TokenBalance label="My balance" balance={balance} />
      </div>
      <div className="flex w-full items-center gap-2">
        <TextField
          name="amount"
          placeholder="0.00"
          className="w-full"
          type="number"
          step="any"
          disabled={isReview}
        />
        <MaxButton disabled={isReview} balance={balance} />
      </div>
    </div>
  );
}
