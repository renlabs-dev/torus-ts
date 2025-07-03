import type { TokenAmount } from "@hyperlane-xyz/sdk";
import { isNullish } from "@hyperlane-xyz/utils";
import { SpinnerIcon, useAccounts } from "@hyperlane-xyz/widgets";
import { Button } from "@torus-ts/ui/components/button";
import { useFetchMaxAmount } from "~/hooks/use-fetch-max-amount";
import { useMultiProvider } from "~/hooks/use-multi-provider";
import { useTransferFormContext } from "./transfer-form-context";
import BigNumber from "bignumber.js";

export function MaxButton({
  balance,
  disabled,
}: Readonly<{
  balance?: TokenAmount;
  disabled?: boolean;
}>) {
  const { watch, setValue } = useTransferFormContext();
  const values = watch();
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
    setValue("amount", roundedAmount);
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
