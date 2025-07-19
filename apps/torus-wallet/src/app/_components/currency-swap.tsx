"use client";

import { useCallback, useEffect, useState } from "react";

import { ArrowLeftRight } from "lucide-react";

import { fromNano, toNano } from "@torus-network/torus-utils/torus/token";

import { Button } from "@torus-ts/ui/components/button";
import { Input } from "@torus-ts/ui/components/input";

import { convertTORUSToUSD, convertUSDToTorus } from "~/utils/helpers";

import { AmountButtons } from "./amount-buttons";

interface CurrencySwapProps {
  amount: string;
  usdPrice: number;
  disabled?: boolean;
  availableFunds: string;
  onAmountChangeAction: (torusAmount: string) => void;
  minAllowedStakeData: bigint;
}

export function CurrencySwap({
  amount,
  usdPrice,
  disabled = false,
  availableFunds,
  onAmountChangeAction,
  minAllowedStakeData,
}: CurrencySwapProps) {
  const [inputType, setInputType] = useState<"TORUS" | "USD">("TORUS");
  const [inputAmount, setInputAmount] = useState<string>("");
  const [displayAmount, setDisplayAmount] = useState<string>("");

  useEffect(() => {
    if (!amount) {
      setInputType("TORUS");
      setInputAmount("");
      setDisplayAmount("");
    }
  }, [amount]);

  const handleAmountChange = useCallback(
    (value: string) => {
      setInputAmount(value);

      if (inputType === "USD") {
        const torusAmount = convertUSDToTorus(value, usdPrice);
        setDisplayAmount(torusAmount);
        onAmountChangeAction(torusAmount);
      } else {
        const usdAmount = convertTORUSToUSD(value, usdPrice);
        setDisplayAmount(usdAmount);
        onAmountChangeAction(value);
      }
    },
    [inputType, usdPrice, onAmountChangeAction],
  );

  const handleCurrencySwitch = useCallback(() => {
    const isTorus = inputType === "TORUS";

    const currentTorusAmount = isTorus
      ? inputAmount
      : convertUSDToTorus(inputAmount, usdPrice);

    const newInputAmount = isTorus
      ? convertTORUSToUSD(inputAmount, usdPrice)
      : currentTorusAmount;

    const newDisplayAmount = isTorus
      ? currentTorusAmount
      : convertTORUSToUSD(currentTorusAmount, usdPrice);

    setInputType(isTorus ? "USD" : "TORUS");
    setInputAmount(newInputAmount);
    setDisplayAmount(newDisplayAmount);

    onAmountChangeAction(currentTorusAmount);
  }, [inputType, inputAmount, usdPrice, onAmountChangeAction]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex flex-col w-full sm:w-1/2">
          <Input
            value={inputAmount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder={`Amount of ${inputType}`}
            disabled={disabled}
            type="number"
            label={inputType === "TORUS" ? "TORUS" : "USD"}
            min={fromNano(minAllowedStakeData)}
          />
        </div>
        <div className="flex items-center justify-center py-2 sm:py-0">
          <Button
            className="text-3xl border-none bg-transparent font-normal text-[#A1A1AA]"
            type="button"
            variant="outline"
            onClick={handleCurrencySwitch}
            disabled={disabled}
          >
            <ArrowLeftRight size={16} />
          </Button>
        </div>
        <div className="flex flex-col w-full sm:w-1/2">
          <Input
            value={displayAmount}
            placeholder={`Amount of ${inputType === "TORUS" ? "USD" : "TORUS"}`}
            disabled={true}
            label={inputType === "TORUS" ? "USD" : "TORUS"}
          />
        </div>
      </div>
      <AmountButtons
        setAmount={handleAmountChange}
        availableFunds={availableFunds}
        disabled={disabled || !(toNano(availableFunds) > 0n)}
        inputType={inputType}
        usdPrice={usdPrice}
      />
    </div>
  );
}
