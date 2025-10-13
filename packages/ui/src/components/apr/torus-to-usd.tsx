"use client";

import { useMemo } from "react";

interface TorusToUSDProps {
  torusAmount: bigint | number | string;
  usdPrice?: number;
  showSymbol?: boolean;
  decimals?: number;
  className?: string;
}

/**
 * Render a formatted USD value for a Torus token amount.
 *
 * @param torusAmount - Amount of Torus tokens. May be a `bigint` (interpreted as the token's smallest unit and converted by dividing by 1e18), a numeric value, or a numeric string.
 * @param usdPrice - USD price per one Torus token; if omitted, the displayed value is `0.00` (or formatted according to `decimals`).
 * @param showSymbol - Whether to include a leading `$` symbol in the output.
 * @param decimals - Number of decimal places to display for the USD value.
 * @param className - CSS class applied to the wrapping `<span>`.
 * @returns The `<span>` element containing the optionally-prefixed `$`, the USD value formatted to `decimals` places, and the suffix ` USD`.
 */
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