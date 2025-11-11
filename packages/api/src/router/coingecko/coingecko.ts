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
} satisfies TRPCRouterRecord;
