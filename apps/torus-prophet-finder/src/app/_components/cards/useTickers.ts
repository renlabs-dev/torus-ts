"use client";

import { SAMPLE_TICKERS } from "~/app/_components/cards/SampleTickers";
import { normalizeSymbol } from "~/lib/tickers/normalize-symbol";
import type { Ticker } from "~/types/ticker";
import * as React from "react";

export function useTickers() {
  const [tickers, setTickers] = React.useState<Ticker[]>(SAMPLE_TICKERS);

  const addTicker = React.useCallback(
    (raw: string): { error?: string } => {
      const symbol = normalizeSymbol(raw);
      if (!symbol) return { error: "Please enter a valid ticker (e.g., $BTC)" };
      if (tickers.some((t) => t.symbol.toUpperCase() === symbol)) {
        return { error: "This ticker already exists" };
      }
      const t: Ticker = { symbol };
      setTickers((prev) => [t, ...prev]);
      return {};
    },
    [tickers],
  );

  return { tickers, addTicker };
}
