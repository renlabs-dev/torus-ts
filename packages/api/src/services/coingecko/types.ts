/**
 * CoinGecko API response types
 */

export interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

export interface CachedCoinGeckoData {
  data: CoinGeckoMarketData;
  cachedAt: number;
  expiresAt: number;
}

/**
 * Ticker symbol to CoinGecko ID mapping
 * Sourced from CoinGecko API coin list
 */
export const TICKER_TO_COINGECKO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BNB: "binancecoin",
  XRP: "ripple",
  USDC: "usd-coin",
  USDT: "tether",
  ADA: "cardano",
  DOGE: "dogecoin",
  TRX: "tron",
  AVAX: "avalanche-2",
  SHIB: "shiba-inu",
  LINK: "chainlink",
  DOT: "polkadot",
  BCH: "bitcoin-cash",
  NEAR: "near",
  UNI: "uniswap",
  LTC: "litecoin",
  DAI: "dai",
  MATIC: "polygon",
  ICP: "internet-computer",
  APT: "aptos",
  OP: "optimism",
  ARB: "arbitrum",
  SUI: "sui",
  STX: "stacks",
  TIA: "celestia",
  ATOM: "cosmos",
  PEPE: "pepe",
  WIF: "dogwifcoin",
  BONK: "bonk",
  MKR: "maker",
  AAVE: "aave",
  SNX: "synthetix-network-token",
  LDO: "lido-dao",
  CRV: "curve-dao-token",
  RUNE: "thorchain",
  FTM: "fantom",
  DYDX: "dydx",
  GMX: "gmx",
  PENDLE: "pendle",
  JUP: "jupiter",
  WLD: "worldcoin-wld",
  FET: "fetch-ai",
  ONDO: "ondo-finance",
  SEI: "sei-network",
  // Add more mappings as needed
};
