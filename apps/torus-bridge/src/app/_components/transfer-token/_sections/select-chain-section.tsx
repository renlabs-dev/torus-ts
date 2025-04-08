"use client";

import { SwapChainsButton } from "../_components/swap-chain-button";
import { ChainSelectField } from "../../chains/chain-select-field";

export function SelectChainSection({
  isReview,
}: Readonly<{ isReview: boolean }>) {
  return (
    <div className="flex items-end gap-2">
      <div className="w-full">
        <ChainSelectField name="origin" label="From" />
      </div>
      <div className="flex flex-1 flex-col items-center">
        <SwapChainsButton disabled={isReview} />
      </div>
      <div className="w-full">
        <ChainSelectField name="destination" label="To" />
      </div>
    </div>
  );
}
