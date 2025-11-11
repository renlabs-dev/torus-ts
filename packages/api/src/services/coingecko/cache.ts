import type { CachedCoinGeckoData, CoinGeckoMarketData } from "./types";

/**
 * Server-side in-memory cache for CoinGecko data
 * Shared across all users within this server instance
 */
class CoinGeckoCache {
  private cache = new Map<string, CachedCoinGeckoData>();
  private readonly DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

  get(key: string): CoinGeckoMarketData | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key: string, data: CoinGeckoMarketData, ttlMs?: number): void {
    const now = Date.now();
    const ttl = ttlMs ?? this.DEFAULT_TTL_MS;

    this.cache.set(key, {
      data,
      cachedAt: now,
      expiresAt: now + ttl,
    });
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  stats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const coinGeckoCache = new CoinGeckoCache();

if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      coinGeckoCache.cleanup();
    },
    10 * 60 * 1000,
  );
}
