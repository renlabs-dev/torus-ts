import { coinGeckoCache } from "./cache";
import type { CoinGeckoMarketData } from "./types";
import { TICKER_TO_COINGECKO_ID } from "./types";

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const COINGECKO_API_BASE = COINGECKO_API_KEY
  ? "https://pro-api.coingecko.com/api/v3"
  : "https://api.coingecko.com/api/v3";

/**
 * Fetch market data for multiple coins in a single API call
 * More efficient than individual calls
 */
export async function getMultipleCoinMarketData(
  tickers: string[],
): Promise<Map<string, CoinGeckoMarketData>> {
  const resultMap = new Map<string, CoinGeckoMarketData>();

  // Check cache first
  const uncachedTickers: string[] = [];
  tickers.forEach((ticker) => {
    const tickerUpper = ticker.toUpperCase();
    const cacheKey = `market:${tickerUpper}`;
    const cached = coinGeckoCache.get(cacheKey);

    if (cached) {
      resultMap.set(tickerUpper, cached);
    } else {
      uncachedTickers.push(ticker);
    }
  });

  if (uncachedTickers.length === 0) {
    return resultMap;
  }

  // Map uncached tickers to CoinGecko IDs
  const coinIds = uncachedTickers
    .map((ticker) => TICKER_TO_COINGECKO_ID[ticker.toUpperCase()])
    .filter(Boolean);

  if (coinIds.length === 0) {
    return resultMap;
  }

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (COINGECKO_API_KEY) {
      headers["x-cg-pro-api-key"] = COINGECKO_API_KEY;
    }

    const url = `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${coinIds.join(",")}&order=market_cap_desc&per_page=${coinIds.length}&page=1&sparkline=false`;

    const response = await fetch(url, { headers });

    if (!response.ok) {
      console.error(
        `CoinGecko API error: ${response.status} ${response.statusText}`,
      );
      return resultMap;
    }

    const data = (await response.json()) as CoinGeckoMarketData[];

    // Cache and map results
    data.forEach((coinData) => {
      // Find which ticker this coin belongs to
      const ticker = uncachedTickers.find(
        (t) => TICKER_TO_COINGECKO_ID[t.toUpperCase()] === coinData.id,
      );

      if (ticker) {
        const tickerUpper = ticker.toUpperCase();
        const cacheKey = `market:${tickerUpper}`;
        coinGeckoCache.set(cacheKey, coinData);
        resultMap.set(tickerUpper, coinData);
      }
    });

    return resultMap;
  } catch (error) {
    console.error(`Error fetching CoinGecko data:`, error);
    return resultMap;
  }
}

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
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (COINGECKO_API_KEY) {
      headers["x-cg-pro-api-key"] = COINGECKO_API_KEY;
    }

    const url = `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${coinId}&order=market_cap_desc&per_page=1&page=1&sparkline=false`;

    const response = await fetch(url, { headers });

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
