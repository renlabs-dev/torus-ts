import { useFormikContext } from "formik";
import { TextField } from "~/app/components/input/TextField";
import { useOriginBalance } from "~/features/tokens/balances";
import { SelectOrInputTokenIds } from "~/features/tokens/SelectOrInputTokenIds";
import type { TransferFormValues } from "~/utils/types";
import { MaxButton } from "../_components/max-button";
import { TokenBalance } from "../_components/token-balance";

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
        <label htmlFor="amount" className="block pl-0.5 text-sm text-gray-600">
          Amount
        </label>
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
