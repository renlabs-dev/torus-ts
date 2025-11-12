import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { getCoinMarketData, getMultipleCoinMarketData } from "../../services/coingecko/client";
import type { CoinGeckoMarketData } from "../../services/coingecko/types";
import { publicProcedure } from "../../trpc";

export const coinGeckoRouter = {
  getMarketData: publicProcedure
    .input(
      z.object({
        ticker: z.string().min(1).max(20),
      }),
    )
    .query(async ({ input }) => {
      const { ticker } = input;
      return await getCoinMarketData(ticker);
    }),

  getMultipleMarketData: publicProcedure
    .input(
      z.object({
        tickers: z.array(z.string()).min(1).max(100),
      }),
    )
    .query(async ({ input }) => {
      const { tickers } = input;

      // Use batched function to fetch all tickers in single API call
      const resultMap = await getMultipleCoinMarketData(tickers);

      // Convert Map to Record for tRPC
      const marketDataMap: Record<string, CoinGeckoMarketData> = {};
      resultMap.forEach((data, ticker) => {
        marketDataMap[ticker] = data;
      });

      return marketDataMap;
    }),
} satisfies TRPCRouterRecord;
