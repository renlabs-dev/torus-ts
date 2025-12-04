"use client";

import { Card } from "@torus-ts/ui/components/card";
import { Skeleton } from "@torus-ts/ui/components/skeleton";
import { TOP_100_TICKERS } from "@torus-ts/ui/lib/tickers";
import { ExpandedViewPageHeader } from "~/app/_components/expanded-view-page-header";
import { api } from "~/trpc/react";
import Image from "next/image";
import Link from "next/link";

export default function TickersPage() {
  // Show top 50 tickers
  const tickers = TOP_100_TICKERS.slice(0, 50);

  // Fetch market data for all tickers (loads in background)
  const {
    data: marketDataMap,
    isLoading: isLoadingMarketData,
    isError: isMarketDataError,
  } = api.coinGecko.getMultipleMarketData.useQuery({
    tickers,
  });

  // Fetch prediction counts for all tickers
  const { data: predictionCounts } = api.prediction.getTickerCounts.useQuery({
    tickers,
  });

  return (
    <div className="relative pt-4">
      {/* Vertical borders spanning full height */}
      <div className="border-border pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-screen-lg -translate-x-1/2 border-x" />

      {/* Header section */}
      <ExpandedViewPageHeader
        title="Tickers"
        description="Browse predictions by cryptocurrency ticker"
      />

      {/* Full-width horizontal border */}
      <div className="border-border relative my-4 border-t" />

      {/* Content section - Table view */}
      <div className="relative mx-auto max-w-screen-lg px-4">
        <Card className="bg-background/80 plus-corners backdrop-blur-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left text-sm">
                  <th className="p-4 font-medium">#</th>
                  <th className="p-4 font-medium">Coin</th>
                  <th className="p-4 text-right font-medium">Price</th>
                  <th className="p-4 text-right font-medium">24h</th>
                  <th className="p-4 text-right font-medium">24h Volume</th>
                  <th className="p-4 text-right font-medium">Market Cap</th>
                  <th className="p-4 text-right font-medium">Predictions</th>
                </tr>
              </thead>
              <tbody>
                {tickers.map((ticker, idx) => {
                  const data = marketDataMap?.[ticker];
                  const shouldShowPlaceholder =
                    !isLoadingMarketData && (isMarketDataError || !data);

                  return (
                    <tr
                      key={ticker}
                      className="hover:bg-accent/50 border-b transition-colors"
                    >
                      <td className="text-muted-foreground p-4">{idx + 1}</td>
                      <td className="p-4">
                        <Link
                          href={`/ticker/${ticker.toLowerCase()}`}
                          className="flex items-center gap-3 hover:underline"
                        >
                          {data?.image ? (
                            <Image
                              src={data.image}
                              alt={data.name}
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                              <span className="text-sm font-bold">
                                {ticker.slice(0, 1)}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="font-semibold">
                              {data?.name ?? ticker}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {ticker}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="p-4 text-right font-semibold">
                        {data?.current_price != null ? (
                          `$${data.current_price.toLocaleString()}`
                        ) : shouldShowPlaceholder ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <Skeleton className="ml-auto h-6 w-24" />
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {data?.price_change_percentage_24h != null ? (
                          <span
                            className={
                              data.price_change_percentage_24h >= 0
                                ? "text-green-500"
                                : "text-red-500"
                            }
                          >
                            {data.price_change_percentage_24h >= 0 ? "▲" : "▼"}{" "}
                            {Math.abs(data.price_change_percentage_24h).toFixed(
                              1,
                            )}
                            %
                          </span>
                        ) : shouldShowPlaceholder ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <Skeleton className="ml-auto h-4 w-16" />
                        )}
                      </td>
                      <td className="p-4 text-right font-semibold">
                        {data?.total_volume != null ? (
                          `$${(data.total_volume / 1_000_000_000).toFixed(2)}B`
                        ) : shouldShowPlaceholder ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <Skeleton className="ml-auto h-6 w-28" />
                        )}
                      </td>
                      <td className="p-4 text-right font-semibold">
                        {data?.market_cap != null ? (
                          `$${(data.market_cap / 1_000_000_000).toFixed(2)}B`
                        ) : shouldShowPlaceholder ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <Skeleton className="ml-auto h-6 w-32" />
                        )}
                      </td>
                      <td className="p-4 text-right font-semibold">
                        {predictionCounts?.[ticker] ?? 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Bottom border */}
      <div className="border-border relative mt-4 border-t" />
    </div>
  );
}
