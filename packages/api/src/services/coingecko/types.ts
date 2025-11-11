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
 * Sourced from CoinGecko API coin list
 */
export const TICKER_TO_COINGECKO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  TAO: "bittensor",
  XRP: "ripple",
  CRV: "curve-dao-token",
  CVX: "convex-finance",
  DOGE: "dogecoin",
  HYPE: "hyperliquid",
  BNB: "binancecoin",
  AAVE: "aave",
  TIA: "celestia",
  USDC: "usdc",
  USDT: "tether",
  TRUMP: "maga",
  KAS: "kaspa",
  ARB: "arbitrum",
  GMX: "gmx",
  ZEC: "zcash",
  MSTR: "microstrategy",
  UNI: "uniswap",
  EIGEN: "eigenlayer",
  PEPE: "pepe",
  ENA: "ethena",
  BERA: "berachain",
  LUNA: "terra-luna-2",
  SUI: "sui",
  WIF: "dogwifcoin",
  PUMP: "pump",
  AVAX: "avalanche-2",
  COIN: "coinbase-wrapped-staked-eth",
  RUNE: "thorchain",
  OP: "optimism",
  XPL: "silo-finance",
  LINK: "chainlink",
  MATIC: "polygon",
  SEI: "sei-network",
  MON: "monster",
  BONK: "bonk",
  LTC: "litecoin",
  KAITO: "kaito",
  DAI: "dai",
  ADA: "cardano",
  XMR: "monero",
  LDO: "lido-dao",
  FTM: "fantom",
  ASTER: "astar",
  WLFI: "world-liberty-financial",
  UST: "terrausd",
  STRK: "starknet",
  ONDO: "ondo-finance",
  PENDLE: "pendle",
  DYM: "dymension",
  APT: "aptos",
  USD: "usd-coin",
  JUP: "jupiter",
  MKR: "maker",
  DYDX: "dydx",
  TOTAL3: "total3",
  ZIG: "zignaly",
  SPELL: "spell-token",
  QNT: "quant-network",
  SUSHI: "sushi",
  RBNT: "ribbon-finance",
  WLD: "worldcoin-wld",
  MANTA: "manta-network",
  FLUID: "fluid",
  DXY: "dxy-finance",
  BMNR: "bitmonster",
  UMAMI: "umami-finance",
  SPX: "spx6900",
  QUBIC: "qubic",
  TRX: "tron",
  TIG: "tiger",
  FXS: "frax-share",
  RLB: "rollbit-coin",
  K: "kcash",
  STETH: "lido-staked-ether",
  BCH: "bitcoin-cash",
  KINTO: "kinto",
  DOLO: "dolo-protocol",
  FACY: "facy",
  ATOM: "cosmos",
  ZK: "zksync",
  STX: "stacks",
  MEGA: "megaton-finance",
  GLP: "glp",
  MIM: "magic-internet-money",
  SHIB: "shiba-inu",
  MNT: "mantle",
  OM: "mantra-dao",
  SNX: "synthetix-network-token",
  NEAR: "near",
  ZRO: "layerzero",
  POPCAT: "popcat",
  RWN: "rowan-coin",
  GNS: "gains-network",
  ICP: "internet-computer",
  FET: "fetch-ai",
  BLAST: "blast",
};
