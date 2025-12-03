"use client";

import { useMemo } from "react";

interface TorusToUSDProps {
  torusAmount: bigint | number | string;
  usdPrice?: number;
  showSymbol?: boolean;
  decimals?: number;
  className?: string;
}

export function TorusToUSD({
  torusAmount,
  usdPrice,
  showSymbol = true,
  decimals = 2,
  className = "",
}: TorusToUSDProps) {
  const torusNum = useMemo(() => {
    if (typeof torusAmount === "bigint") {
      return Number(torusAmount) / 1e18;
    }

    if (typeof torusAmount === "string") {
      return parseFloat(torusAmount);
    }

    return torusAmount;
  }, [torusAmount]);

  const usdValue = useMemo(
    () => torusNum * (usdPrice ?? 0),
    [torusNum, usdPrice],
  );

  return (
    <span className={className}>
      {showSymbol && "$"}
      {usdValue.toFixed(decimals)}
      {" USD"}
    </span>
  );
}
