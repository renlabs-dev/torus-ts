"use client";

import { Label } from "@torus-ts/ui/components/label";
import { TextField } from "~/app/_components/text-field";
import { useOriginBalance } from "~/hooks/balance/use-origin-balance";
import { useTransferFormContext } from "../_components/transfer-form-context";
import { MaxButton } from "../_components/max-button";
import { TokenBalance } from "../_components/token-balance";

export function AmountSection({ isReview }: Readonly<{ isReview: boolean }>) {
  const {
    watch,
    formState: { errors },
  } = useTransferFormContext();
  const values = watch();
  const { balance } = useOriginBalance(values);
  const amountError = errors.amount?.message;

  return (
    <div className="flex-1">
      <div className="flex justify-between pb-2 pr-1">
        <Label>Amount</Label>
        <TokenBalance label="My balance" balance={balance} />
      </div>
      <div className="flex w-full items-center gap-2">
        <div className="flex-1">
          <TextField
            name="amount"
            placeholder="0.00"
            className={`w-full ${amountError ? "border-red-500" : ""}`}
            type="number"
            step="any"
            disabled={isReview}
          />
          {amountError && (
            <p className="mt-1 text-sm text-red-500">{amountError}</p>
          )}
        </div>
        <MaxButton disabled={isReview} balance={balance} />
      </div>
    </div>
  );
}
