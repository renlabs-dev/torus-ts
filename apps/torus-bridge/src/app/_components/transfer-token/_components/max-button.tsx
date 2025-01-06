import type { TokenAmount } from "@hyperlane-xyz/sdk";
import { isNullish } from "@hyperlane-xyz/utils";
import { SpinnerIcon, useAccounts } from "@hyperlane-xyz/widgets";
import { Button } from "@torus-ts/ui";
import BigNumber from "bignumber.js";
import { useFormikContext } from "formik";

import { useFetchMaxAmount } from "~/hooks/use-fetch-max-amount";
import { useMultiProvider } from "~/hooks/use-multi-provider";
import type { TransferFormValues } from "~/utils/types";

export function MaxButton({
  balance,
  disabled,
}: {
  balance?: TokenAmount;
  disabled?: boolean;
}) {
  const { values, setFieldValue } = useFormikContext<TransferFormValues>();
  const { origin, destination, tokenIndex } = values;
  const multiProvider = useMultiProvider();
  const { accounts } = useAccounts(multiProvider);
  const { fetchMaxAmount, isLoading } = useFetchMaxAmount();

  const onClick = async () => {
    if (!balance || isNullish(tokenIndex) || disabled) return;
    const maxAmount = await fetchMaxAmount({
      balance,
      origin,
      destination,
      accounts,
    });
    if (isNullish(maxAmount)) return;
    const decimalsAmount = maxAmount.getDecimalFormattedAmount();
    const roundedAmount = new BigNumber(decimalsAmount).toFixed(
      4,
      BigNumber.ROUND_FLOOR,
    );
    void setFieldValue("amount", roundedAmount);
  };

  return (
    <Button
      type="button"
      onClick={onClick}
      variant="outline"
      disabled={disabled}
    >
      {isLoading ? (
        <div className="flex items-center">
          <SpinnerIcon className="h-5 w-5" color="white" />
        </div>
      ) : (
        "Max"
      )}
    </Button>
  );
}
