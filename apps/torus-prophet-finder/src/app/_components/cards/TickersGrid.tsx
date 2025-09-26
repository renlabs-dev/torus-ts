import type { Ticker } from "~/types/ticker";
import { TickerCard } from "~/app/_components/TickerCard";

type Props = {
  tickers: Ticker[];
};

export default function TickersGrid({ tickers }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 md:gap-8">
      {tickers.map((t) => (
        <TickerCard key={t.symbol} {...t} />
      ))}
    </div>
  );
}
