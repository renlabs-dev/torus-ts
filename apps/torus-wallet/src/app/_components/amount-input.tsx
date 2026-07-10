"use client";

import { fromNano, toNano } from "@torus-network/torus-utils/torus/token";
import { Input } from "@torus-ts/ui/components/input";
import { AmountButtons } from "./amount-buttons";

interface AmountInputProps {
  amount: string;
  disabled?: boolean;
  availableFunds: string;
  onAmountChangeAction: (torusAmount: string) => void;
  minAllowedStakeData: bigint;
}

export function AmountInput({
  amount,
  disabled = false,
  availableFunds,
  onAmountChangeAction,
  minAllowedStakeData,
}: Readonly<AmountInputProps>) {
  return (
    <div className="flex flex-col gap-4">
      <Input
        value={amount}
        onChange={(e) => onAmountChangeAction(e.target.value)}
        placeholder="Amount of TORUS"
        disabled={disabled}
        type="number"
        label="TORUS"
        min={fromNano(minAllowedStakeData)}
      />
      <AmountButtons
        setAmount={onAmountChangeAction}
        availableFunds={availableFunds}
        disabled={disabled || !(toNano(availableFunds) > 0n)}
      />
    </div>
  );
}
