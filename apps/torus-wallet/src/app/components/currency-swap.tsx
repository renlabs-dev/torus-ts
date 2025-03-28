"use client";

import React, { useState, useCallback } from "react";
import { Input } from "@torus-ts/ui/components/input";
import { Button } from "@torus-ts/ui/components/button";
import { ArrowLeftRight } from "lucide-react";
import { convertUSDToTorus, convertTORUSToUSD } from "~/utils/helpers";
import { toNano } from "@torus-ts/utils/subspace";
import { AmountButtons } from "./amount-buttons";

interface CurrencySwapProps {
  usdPrice: number;
  disabled?: boolean;
  availableFunds: string;
  onAmountChangeAction: (torusAmount: string) => void;
}

export function CurrencySwap({
  usdPrice,
  disabled = false,
  availableFunds,
  onAmountChangeAction,
}: CurrencySwapProps) {
  const [inputType, setInputType] = useState<"TORUS" | "USD">("TORUS");
  const [inputAmount, setInputAmount] = useState<string>("");
  const [displayAmount, setDisplayAmount] = useState<string>("");

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
    const newAmount = isTorus
      ? convertTORUSToUSD(inputAmount, usdPrice)
      : convertUSDToTorus(inputAmount, usdPrice);

    setInputType(isTorus ? "USD" : "TORUS");
    setInputAmount(newAmount);

    setDisplayAmount(
      isTorus ? inputAmount : convertTORUSToUSD(newAmount, usdPrice),
    );
    onAmountChangeAction(isTorus ? inputAmount : newAmount);
  }, [inputType, inputAmount, usdPrice, onAmountChangeAction]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row items-center gap-4">
        <div className="flex flex-col w-full md:w-1/2">
          <Input
            value={inputAmount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder={`Amount of ${inputType}`}
            disabled={disabled}
            type="number"
            label={inputType === "TORUS" ? "TOR" : "USD"}
          />
        </div>
        <div className="flex items-center justify-center">
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
        <div className="flex flex-col w-full md:w-1/2">
          <Input
            value={displayAmount}
            disabled={true}
            label={inputType === "TORUS" ? "USD" : "TOR"}
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
