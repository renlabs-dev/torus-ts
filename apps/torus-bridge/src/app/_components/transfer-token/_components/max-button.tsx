import type { TokenAmount } from "@hyperlane-xyz/sdk";
import { isNullish } from "@hyperlane-xyz/utils";
import { SpinnerIcon, useAccounts } from "@hyperlane-xyz/widgets";
import BigNumber from "bignumber.js";
import { useFormikContext } from "formik";
import { SolidButton } from "~/app/_components/buttons/solid-button";

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
    <SolidButton
      type="button"
      onClick={onClick}
      color="primary"
      disabled={disabled}
      classes="text-xs absolute right-1 top-2.5 bottom-1 px-2 opacity-90 all:rounded"
    >
      {isLoading ? (
        <div className="flex items-center">
          <SpinnerIcon className="h-5 w-5" color="white" />
        </div>
      ) : (
        "Max"
      )}
    </SolidButton>
  );
}
