"use client";

import { SwapChainsButton } from "../_components/swap-chain-button";
import { ChainSelectField } from "../../chains/chain-select-field";
import { useSearchParams } from "next/navigation";

export function SelectChainSection({ isReview }: { isReview: boolean }) {
  const searchParams = useSearchParams();
  const fromValue = searchParams.get("from");
  const toValue = searchParams.get("to");

  return (
    <div className="flex items-end gap-2">
      <div className="w-full">
        <ChainSelectField name="origin" label="From" value={fromValue} />
      </div>
      <div className="flex flex-1 flex-col items-center">
        <SwapChainsButton disabled={isReview} />
      </div>
      <div className="w-full">
        <ChainSelectField name="destination" label="To" value={toValue} />
      </div>
    </div>
  );
}
