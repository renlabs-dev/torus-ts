import { useFormikContext } from "formik";
import { useMemo } from "react";

import { getNumRoutesWithSelectedChain } from "~/utils/chain";
import { useWarpCore } from "~/hooks/token";
import type { TransferFormValues } from "~/utils/types";
import { SwapChainsButton } from "../_components/swap-chain-button";
import { ChainSelectField } from "../../chains/chain-select-field";

export function SelectChainSection({ isReview }: { isReview: boolean }) {
  const warpCore = useWarpCore();

  const { values } = useFormikContext<TransferFormValues>();

  const originRouteCounts = useMemo(() => {
    return getNumRoutesWithSelectedChain(warpCore, values.origin, true);
  }, [values.origin, warpCore]);

  const destinationRouteCounts = useMemo(() => {
    return getNumRoutesWithSelectedChain(warpCore, values.destination, false);
  }, [values.destination, warpCore]);

  return (
    <div className="mt-2 flex items-center justify-between gap-4">
      <ChainSelectField
        name="origin"
        label="From"
        disabled={isReview}
        customListItemField={destinationRouteCounts}
      />
      <div className="flex flex-1 flex-col items-center">
        <SwapChainsButton disabled={isReview} />
      </div>
      <ChainSelectField
        name="destination"
        label="To"
        disabled={isReview}
        customListItemField={originRouteCounts}
      />
    </div>
  );
}
