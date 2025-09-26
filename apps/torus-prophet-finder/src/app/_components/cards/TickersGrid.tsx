import { TickerCard } from "~/app/_components/TickerCard";
import type { Ticker } from "~/types/ticker";

interface Props {
  tickers: Ticker[];
}

export default function TickersGrid({ tickers }: Props) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-7 md:gap-8 lg:grid-cols-3">
      {tickers.map((t) => (
        <TickerCard key={t.symbol} {...t} />
      ))}
    </div>
  );
}
