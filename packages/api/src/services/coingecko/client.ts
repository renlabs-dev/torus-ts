import { coinGeckoCache } from "./cache";
import type { CoinGeckoMarketData } from "./types";
import { TICKER_TO_COINGECKO_ID } from "./types";

const COINGECKO_API_BASE = "https://api.coingecko.com/api/v3";

/**
 * Fetch coin market data from CoinGecko API
 * Uses server-side cache to reduce API calls
 */
export async function getCoinMarketData(
  ticker: string,
): Promise<CoinGeckoMarketData | null> {
  const tickerUpper = ticker.toUpperCase();

  const cacheKey = `market:${tickerUpper}`;
  const cached = coinGeckoCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const coinId = TICKER_TO_COINGECKO_ID[tickerUpper];
  if (!coinId) {
    console.warn(`No CoinGecko ID mapping for ticker: ${tickerUpper}`);
    return null;
  }

  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${coinId}&order=market_cap_desc&per_page=1&page=1&sparkline=false`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      console.error(
        `CoinGecko API error: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const data = (await response.json()) as CoinGeckoMarketData[];
    const coinData = data[0];

    if (!coinData) {
      console.warn(`No data returned for coin: ${coinId}`);
      return null;
    }

    coinGeckoCache.set(cacheKey, coinData);

    return coinData;
  } catch (error) {
    console.error(`Error fetching CoinGecko data for ${ticker}:`, error);
    return null;
  }
}
