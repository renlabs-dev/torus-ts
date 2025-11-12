/**
 * Script to fetch CoinGecko coin list and generate ticker mappings
 *
 * Usage: pnpm tsx scripts/generate-coingecko-mappings.ts
 */

// Hardcoded for script - update if needed
const TOP_100_TICKERS = [
  "BTC", "ETH", "SOL", "TAO", "XRP", "CRV", "CVX", "DOGE", "HYPE", "BNB",
  "AAVE", "TIA", "USDC", "USDT", "TRUMP", "KAS", "ARB", "GMX", "ZEC", "MSTR",
  "UNI", "EIGEN", "PEPE", "ENA", "BERA", "LUNA", "SUI", "WIF", "PUMP", "AVAX",
  "COIN", "RUNE", "OP", "XPL", "LINK", "MATIC", "SEI", "MON", "BONK", "LTC",
  "KAITO", "DAI", "ADA", "XMR", "LDO", "FTM", "ASTER", "WLFI", "UST", "STRK",
  "ONDO", "PENDLE", "DYM", "APT", "USD", "JUP", "MKR", "DYDX", "TOTAL3", "ZIG",
  "SPELL", "QNT", "SUSHI", "RBNT", "WLD", "MANTA", "FLUID", "DXY", "BMNR", "UMAMI",
  "SPX", "QUBIC", "TRX", "TIG", "FXS", "RLB", "K", "stETH", "BCH", "KINTO",
  "DOLO", "FACY", "ATOM", "ZK", "STX", "MEGA", "GLP", "MIM", "SHIB", "MNT",
  "OM", "SNX", "NEAR", "ZRO", "POPCAT", "RWN", "GNS", "ICP", "FET", "BLAST",
] as const;

interface CoinGeckoListItem {
  id: string;
  symbol: string;
  name: string;
}

async function fetchCoinGeckoMarkets(): Promise<CoinGeckoListItem[]> {
  console.log("Fetching CoinGecko markets (top coins by market cap)...");

  // Fetch top 250 coins by market cap (should cover all our tickers)
  const response = await fetch(
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1"
  );

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const markets = await response.json() as Array<{
    id: string;
    symbol: string;
    name: string;
    market_cap_rank: number;
  }>;

  return markets.map(m => ({ id: m.id, symbol: m.symbol, name: m.name }));
}

async function generateMappings() {
  const coinList = await fetchCoinGeckoMarkets();
  console.log(`Fetched ${coinList.length} top coins from CoinGecko (by market cap)`);

  // Create a map from symbol to coins
  const symbolMap = new Map<string, CoinGeckoListItem[]>();

  coinList.forEach(coin => {
    const symbol = coin.symbol.toUpperCase();
    if (!symbolMap.has(symbol)) {
      symbolMap.set(symbol, []);
    }
    symbolMap.get(symbol)!.push(coin);
  });

  // Generate mappings for TOP_100_TICKERS
  const mappings: Record<string, string> = {};
  const notFound: string[] = [];
  const multiple: Array<{ ticker: string; options: CoinGeckoListItem[] }> = [];

  TOP_100_TICKERS.forEach(ticker => {
    const coins = symbolMap.get(ticker);

    if (!coins || coins.length === 0) {
      notFound.push(ticker);
      return;
    }

    if (coins.length === 1) {
      mappings[ticker] = coins[0].id;
    } else {
      // Multiple matches - need manual selection
      multiple.push({ ticker, options: coins });

      // Use first match as default (might need manual override)
      mappings[ticker] = coins[0].id;
    }
  });

  // Output results
  console.log("\n=== GENERATED MAPPINGS ===\n");
  console.log("export const TICKER_TO_COINGECKO_ID: Record<string, string> = {");

  TOP_100_TICKERS.forEach(ticker => {
    if (mappings[ticker]) {
      const coin = coinList.find(c => c.id === mappings[ticker]);
      console.log(`  ${ticker}: "${mappings[ticker]}", // ${coin?.name ?? "Unknown"}`);
    } else {
      console.log(`  // ${ticker}: "???", // NOT FOUND`);
    }
  });

  console.log("};\n");

  // Report issues
  if (notFound.length > 0) {
    console.log("\n=== NOT FOUND (No CoinGecko match) ===");
    console.log(notFound.join(", "));
  }

  if (multiple.length > 0) {
    console.log("\n=== MULTIPLE MATCHES (Manual review needed) ===");
    multiple.forEach(({ ticker, options }) => {
      console.log(`\n${ticker}:`);
      options.slice(0, 5).forEach(coin => {
        console.log(`  - ${coin.id} (${coin.name})`);
      });
      if (options.length > 5) {
        console.log(`  ... and ${options.length - 5} more`);
      }
    });
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total tickers: ${TOP_100_TICKERS.length}`);
  console.log(`Mapped: ${Object.keys(mappings).length}`);
  console.log(`Not found: ${notFound.length}`);
  console.log(`Multiple matches: ${multiple.length}`);
}

generateMappings().catch(console.error);
