// Domain relevancy tiers for source quality scoring.
// Tier 3 = highest quality (major news, wire services, government)
// Tier 2 = established publications, company sources, wikipedia
// Tier 1 = specialty sources (crypto, finance, sports, gaming)
// Tier 0 = unknown domains
// Excluded domains (social media, prediction markets) return -1

const TIER_3_DOMAINS = new Set([
  "reuters.com",
  "cnbc.com",
  "nytimes.com",
  "forbes.com",
  "cnn.com",
  "theguardian.com",
  "bbc.com",
  "bbc.co.uk",
  "npr.org",
  "bloomberg.com",
  "nbcnews.com",
  "aljazeera.com",
  "cbsnews.com",
  "federalreserve.gov",
  "pbs.org",
  "politico.com",
  "washingtonpost.com",
  "apnews.com",
  "abcnews.go.com",
  "congress.gov",
  "newsweek.com",
  "whitehouse.gov",
  "imf.org",
  "time.com",
  "treasury.gov",
  "usatoday.com",
  "fortune.com",
  "foxnews.com",
  "wsj.com",
  "economist.com",
  "worldbank.org",
  "sec.gov",
  "bls.gov",
  "latimes.com",
  "axios.com",
  "thehill.com",
  "ft.com",
]);

const TIER_2_DOMAINS = new Set([
  // Trade publications
  "yahoo.com",
  "investopedia.com",
  "investing.com",
  "businessinsider.com",
  "techcrunch.com",
  "theverge.com",
  "nasdaq.com",
  "pewresearch.org",
  "brookings.edu",
  "tradingeconomics.com",
  "cfr.org",
  "morningstar.com",
  "seekingalpha.com",
  "arstechnica.com",
  "mckinsey.com",
  "theatlantic.com",
  "wired.com",
  "newyorker.com",
  "marketwatch.com",
  "barrons.com",
  "foreignpolicy.com",
  "foreignaffairs.com",
  // Company sources
  "tesla.com",
  "apple.com",
  "openai.com",
  "ethereum.org",
  "spacex.com",
  "starlink.com",
  "neuralink.com",
  "nintendo.com",
  "amazon.com",
  "microsoft.com",
  "meta.com",
  "google.com",
  "netflix.com",
  "samsung.com",
  "nvidia.com",
  "ibm.com",
  // Wikipedia
  "wikipedia.org",
]);

const TIER_1_DOMAINS = new Set([
  // Crypto
  "coinmarketcap.com",
  "coingecko.com",
  "coindesk.com",
  "coinbase.com",
  "coincodex.com",
  "binance.com",
  "cointelegraph.com",
  "theblock.co",
  "decrypt.co",
  "messari.io",
  "beincrypto.com",
  "cryptopolitan.com",
  "cryptonews.com",
  "defillama.com",
  "chainalysis.com",
  "blockworks.co",
  "thedefiant.io",
  "bitcoinmagazine.com",
  "ambcrypto.com",
  "cryptoslate.com",
  "cryptobriefing.com",
  "bitcoinist.com",
  "bitcoin.com",
  "kraken.com",
  "crypto.com",
  "okx.com",
  "kucoin.com",
  "bitget.com",
  "gemini.com",
  // Finance/Markets
  "tradingview.com",
  "ycharts.com",
  "stockanalysis.com",
  "cmegroup.com",
  "barchart.com",
  "tipranks.com",
  "finviz.com",
  "fidelity.com",
  "schwab.com",
  "jpmorgan.com",
  "goldmansachs.com",
  "morganstanley.com",
  "blackrock.com",
  // Space/Tech
  "space.com",
  "nasa.gov",
  "spaceflightnow.com",
  "nasaspaceflight.com",
  "spacenews.com",
  // Sports
  "espn.com",
  "statmuse.com",
  "cbssports.com",
  "foxsports.com",
  "mlb.com",
  "nba.com",
  "nfl.com",
  "ncaa.com",
  "uefa.com",
  "olympics.com",
  "basketball-reference.com",
  "baseball-reference.com",
  "pro-football-reference.com",
  "sports-reference.com",
  // Academic
  "ncbi.nlm.nih.gov",
  "sciencedirect.com",
  "researchgate.net",
  "arxiv.org",
  "frontiersin.org",
  "springer.com",
  "nature.com",
  "science.org",
  "scientificamerican.com",
  "oup.com",
  "sagepub.com",
  "wiley.com",
  "cambridge.org",
  "pnas.org",
  // Gaming
  "ign.com",
  "pcgamer.com",
  "gamespot.com",
  "polygon.com",
  "kotaku.com",
  "eurogamer.net",
  "gamesradar.com",
  "rockpapershotgun.com",
]);

const EXCLUDED_DOMAINS = new Set([
  // Social media
  "reddit.com",
  "x.com",
  "medium.com",
  "youtube.com",
  "quora.com",
  "twitter.com",
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "linkedin.com",
  "substack.com",
  "mirror.xyz",
  "threads.com",
  "discord.com",
  // Prediction markets
  "polymarket.com",
  "manifold.markets",
]);

/**
 * Extracts the registrable domain from a hostname. Handles common multi-part
 * TLDs like co.uk and com.au.
 */
function extractRegistrableDomain(hostname: string): string {
  const parts = hostname.toLowerCase().split(".");

  const multiPartTlds = [
    "co.uk",
    "com.au",
    "co.nz",
    "co.jp",
    "com.br",
    "go.com",
  ];
  for (const tld of multiPartTlds) {
    if (
      hostname.endsWith(`.${tld}`) ||
      hostname === tld.split(".").slice(-2).join(".")
    ) {
      const tldParts = tld.split(".").length;
      if (parts.length > tldParts) {
        return `${parts[parts.length - tldParts - 1]}.${tld}`;
      }
    }
  }

  if (parts.length >= 2) {
    return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
  }
  return hostname;
}

export type DomainTier = 3 | 2 | 1 | 0 | -1;

/**
 * Returns the relevancy tier for a URL's domain. Higher tiers indicate more
 * reputable sources for verification. Returns -1 for excluded domains (social
 * media, prediction markets), 0 for unknown domains.
 */
export function getDomainTier(url: string): DomainTier {
  let hostname: string;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return 0;
  }

  const domain = extractRegistrableDomain(hostname);

  if (EXCLUDED_DOMAINS.has(domain)) return -1;
  if (TIER_3_DOMAINS.has(domain)) return 3;
  if (TIER_2_DOMAINS.has(domain)) return 2;
  if (TIER_1_DOMAINS.has(domain)) return 1;

  // Check if hostname itself matches (for subdomains like ncbi.nlm.nih.gov)
  for (const tier1 of TIER_1_DOMAINS) {
    if (hostname.endsWith(tier1)) return 1;
  }

  return 0;
}

/**
 * Calculates a domain score (0-100) for a list of source URLs based on the
 * average tier of the top 3 sources. Excluded domains are filtered out.
 */
export function calculateDomainScore(urls: string[]): number {
  if (urls.length === 0) return 0;

  const tiers = urls
    .map((url) => getDomainTier(url))
    .filter((tier): tier is 1 | 2 | 3 => tier > 0);

  if (tiers.length === 0) return 0;

  // Score based on top 3 sources
  const topTiers = tiers.sort((a, b) => b - a).slice(0, 3);
  const avgTier = topTiers.reduce((sum, t) => sum + t, 0) / topTiers.length;

  // Convert tier average (1-3) to score (0-100)
  // Tier 3 = 100, Tier 2 = 67, Tier 1 = 33
  return Math.round((avgTier / 3) * 100);
}
