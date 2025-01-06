import { useFormikContext } from "formik";
import { TextField } from "~/app/_components/text-field";
import { SelectOrInputTokenIds } from "~/app/_components/tokens/select-or-Input-token-ids";
import type { TransferFormValues } from "~/utils/types";
import { MaxButton } from "../_components/max-button";
import { TokenBalance } from "../_components/token-balance";
import { useOriginBalance } from "~/hooks/balance/use-origin-balance";
import { Label } from "@torus-ts/ui";

export function AmountSection({
  isNft,
  isReview,
}: {
  isNft: boolean;
  isReview: boolean;
}) {
  const { values } = useFormikContext<TransferFormValues>();
  const { balance } = useOriginBalance(values);

  return (
    <div className="flex-1">
      <div className="flex justify-between pr-1">
        <Label>Amount</Label>
        <TokenBalance label="My balance" balance={balance} />
      </div>
      {isNft ? (
        <SelectOrInputTokenIds disabled={isReview} />
      ) : (
        <div className="relative w-full">
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
      )}
    </div>
  );
}
