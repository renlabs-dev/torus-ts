import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { getCoinMarketData } from "../../services/coingecko/client";
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

      const results = await Promise.all(
        tickers.map(async (ticker) => {
          const data = await getCoinMarketData(ticker);
          return { ticker, data };
        }),
      );

      const marketDataMap: Record<
        string,
        NonNullable<(typeof results)[0]["data"]>
      > = {};
      results.forEach(({ ticker, data }) => {
        if (data) {
          marketDataMap[ticker.toUpperCase()] = data;
        }
      });

      return marketDataMap;
    }),
} satisfies TRPCRouterRecord;
