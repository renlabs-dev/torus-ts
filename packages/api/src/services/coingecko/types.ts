/**
 * CoinGecko API response types
 */

export interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
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
 * Generated from CoinGecko /coins/markets API (top 250 by market cap)
 * Last updated: 2025-11-11
 */
export const TICKER_TO_COINGECKO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  TAO: "bittensor",
  XRP: "ripple",
  CRV: "curve-dao-token",
  DOGE: "dogecoin",
  HYPE: "hyperliquid",
  BNB: "binancecoin",
  AAVE: "aave",
  TIA: "celestia",
  USDC: "usd-coin",
  USDT: "tether",
  TRUMP: "official-trump",
  KAS: "kaspa",
  ARB: "arbitrum",
  ZEC: "zcash",
  UNI: "uniswap",
  EIGEN: "eigenlayer",
  PEPE: "pepe",
  ENA: "ethena",
  SUI: "sui",
  WIF: "dogwifcoin",
  PUMP: "pump-fun",
  AVAX: "avalanche-2",
  OP: "optimism",
  XPL: "plasma",
  LINK: "chainlink",
  SEI: "sei-network",
  BONK: "bonk",
  LTC: "litecoin",
  DAI: "dai",
  ADA: "cardano",
  XMR: "monero",
  LDO: "lido-dao",
  ASTER: "aster-2",
  WLFI: "world-liberty-financial",
  STRK: "starknet",
  ONDO: "ondo-finance",
  PENDLE: "pendle",
  APT: "aptos",
  JUP: "jupiter-exchange-solana",
  QNT: "quant-network",
  WLD: "worldcoin-wld",
  FLUID: "instadapp",
  SPX: "spx6900",
  TRX: "tron",
  BCH: "bitcoin-cash",
  ATOM: "cosmos",
  ZK: "zksync",
  STX: "blockstack",
  SHIB: "shiba-inu",
  MNT: "mantle",
  NEAR: "near",
  ICP: "internet-computer",
  FET: "fetch-ai",

  // Manually added (not in top 250 but valid coins)
  CVX: "convex-finance",
  GMX: "gmx",
  RUNE: "thorchain",
  MATIC: "matic-network",
  FTM: "fantom",
  LUNA: "terra-luna-2",
  MKR: "maker",
  DYDX: "dydx-chain",
  SPELL: "spell-token",
  SUSHI: "sushi",
  SNX: "synthetix-network-token",
  OM: "mantra-dao",
  GNS: "gains-network",
  FXS: "frax-share",
  RLB: "rollbit-coin",
  STETH: "lido-staked-ether",
  ZRO: "layerzero",
  POPCAT: "popcat",
  MANTA: "manta-network",

  // No valid CoinGecko mapping (will show fallback icon and dashes)
  // MSTR - MicroStrategy stock ticker, not a coin
  // BERA - Berachain (not launched/not in CoinGecko)
  // COIN - Generic term, multiple meanings
  // MON - Ambiguous
  // KAITO - Not found
  // UST - TerraUSD (deprecated/delisted)
  // USD - Not a cryptocurrency
  // TOTAL3 - Market cap index, not a coin
  // ZIG - Not in rankings
  // RBNT - Ribbon Finance (deprecated)
  // DXY - US Dollar Index (not crypto)
  // BMNR, UMAMI, QUBIC, TIG, K, KINTO, DOLO, FACY, MEGA, GLP, MIM, RWN, BLAST - Not found or ambiguous
};
