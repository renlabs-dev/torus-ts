"use client";

import { Card, CardContent, CardHeader } from "@torus-ts/ui/components/card";
import { Skeleton } from "@torus-ts/ui/components/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { TOP_100_TICKERS } from "@torus-ts/ui/lib/tickers";
import { ExpandedFeedItem } from "~/app/_components/expanded-feed/expanded-feed-item/expanded-feed-item";
import { FeedLegend } from "~/app/_components/expanded-feed/expanded-feed-legend-tooltip";
import { ExpandedViewPageHeader } from "~/app/_components/expanded-view-page-header";
import { api } from "~/trpc/react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { use } from "react";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function TickerPage({ params }: PageProps) {
  const { slug } = use(params);
  const symbol = slug.toUpperCase();

  // Validate ticker exists in our list
  if (!TOP_100_TICKERS.includes(symbol as (typeof TOP_100_TICKERS)[number])) {
    notFound();
  }

  // Fetch predictions for this ticker symbol
  const { data: predictions, isLoading } =
    api.prediction.getByTickerSymbol.useQuery({
      symbol,
      limit: 50,
    });

  // Fetch CoinGecko market data
  const { data: marketData, isLoading: isLoadingMarketData } =
    api.coinGecko.getMarketData.useQuery({
      ticker: symbol,
    });

  // Filter grouped tweets by verdict status of the FIRST (highest quality) prediction
  const ongoingPredictions =
    predictions?.filter((tweet) => tweet.predictions[0]?.verdictId === null) ??
    [];

  const truePredictions =
    predictions?.filter((tweet) => tweet.predictions[0]?.verdict === true) ??
    [];

  const falsePredictions =
    predictions?.filter((tweet) => tweet.predictions[0]?.verdict === false) ??
    [];

  return (
    <div className="relative py-4">
      <div className="border-border pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-screen-lg -translate-x-1/2 border-x" />

      <ExpandedViewPageHeader
        title={`${marketData?.name ?? symbol} Predictions`}
        description={`View all predictions related to ${symbol}`}
        icon={
          marketData?.image ? (
            <Image
              src={marketData.image}
              alt={marketData.name}
              width={64}
              height={64}
              className="h-16 w-16 rounded-full"
            />
          ) : (
            <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
              <span className="text-2xl font-bold">{symbol.slice(0, 1)}</span>
            </div>
          )
        }
      />

      <div className="border-border relative my-4 border-t" />

      {/* Market Data */}
      <div className="relative mx-auto max-w-screen-lg px-4">
        <Card className="bg-background/80 plus-corners relative backdrop-blur-lg">
          <CardContent className="px-5 py-4">
            <div className="grid gap-6 md:grid-cols-4">
              <div>
                <div className="text-muted-foreground text-sm">Price</div>
                {isLoadingMarketData ? (
                  <>
                    <Skeleton className="mb-1 h-8 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </>
                ) : marketData ? (
                  <>
                    <div className="text-2xl font-bold">
                      ${marketData.current_price.toLocaleString()}
                    </div>
                    <div
                      className={`text-xs ${marketData.price_change_percentage_24h >= 0 ? "text-green-500" : "text-red-500"}`}
                    >
                      {marketData.price_change_percentage_24h.toFixed(2)}% (24h)
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground">-</div>
                )}
              </div>
              <div>
                <div className="text-muted-foreground text-sm">Market Cap</div>
                {isLoadingMarketData ? (
                  <>
                    <Skeleton className="mb-1 h-7 w-28" />
                    <Skeleton className="h-4 w-16" />
                  </>
                ) : marketData ? (
                  <>
                    <div className="text-xl font-semibold">
                      ${(marketData.market_cap / 1_000_000_000).toFixed(2)}B
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Rank #{marketData.market_cap_rank}
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground">-</div>
                )}
              </div>
              <div>
                <div className="text-muted-foreground text-sm">24h Volume</div>
                {isLoadingMarketData ? (
                  <Skeleton className="h-7 w-28" />
                ) : marketData ? (
                  <div className="text-xl font-semibold">
                    ${(marketData.total_volume / 1_000_000_000).toFixed(2)}B
                  </div>
                ) : (
                  <div className="text-muted-foreground">-</div>
                )}
              </div>
              <div>
                <div className="text-muted-foreground text-sm">24h Range</div>
                {isLoadingMarketData ? (
                  <Skeleton className="h-6 w-40" />
                ) : marketData ? (
                  <div className="font-semibold">
                    ${marketData.low_24h.toLocaleString()} - $
                    {marketData.high_24h.toLocaleString()}
                  </div>
                ) : (
                  <div className="text-muted-foreground">-</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="border-border relative my-4 border-t" />

      <div className="relative mx-auto max-w-screen-lg px-4">
        <FeedLegend />
      </div>

      <div className="border-border relative my-4 border-t" />

      <div className="relative mx-auto max-w-screen-lg px-4">
        <Card className="bg-background/80 backdrop-blur-lg">
          <Tabs defaultValue="ongoing">
            <CardHeader className="pb-0">
              <TabsList className="bg-accent/60 grid w-full grid-cols-3">
                <TabsTrigger value="ongoing">
                  Ongoing predictions ({ongoingPredictions.length})
                </TabsTrigger>
                <TabsTrigger value="true">
                  True predictions ({truePredictions.length})
                </TabsTrigger>
                <TabsTrigger value="false">
                  False predictions ({falsePredictions.length})
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="ongoing">
              <CardContent>
                {isLoading ? (
                  <div className="text-muted-foreground py-12 text-center">
                    Loading predictions...
                  </div>
                ) : (
                  <ExpandedFeedItem
                    predictions={ongoingPredictions}
                    variant="feed"
                    isLoading={isLoading}
                  />
                )}
              </CardContent>
            </TabsContent>

            <TabsContent value="true">
              <CardContent>
                {isLoading ? (
                  <div className="text-muted-foreground py-12 text-center">
                    Loading predictions...
                  </div>
                ) : (
                  <ExpandedFeedItem
                    predictions={truePredictions}
                    variant="feed"
                    isLoading={isLoading}
                  />
                )}
              </CardContent>
            </TabsContent>

            <TabsContent value="false">
              <CardContent>
                {isLoading ? (
                  <div className="text-muted-foreground py-12 text-center">
                    Loading predictions...
                  </div>
                ) : (
                  <ExpandedFeedItem
                    predictions={falsePredictions}
                    variant="feed"
                    isLoading={isLoading}
                  />
                )}
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <div className="border-border relative mt-4 border-t" />
    </div>
  );
}
