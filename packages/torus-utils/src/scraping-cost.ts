/**
 * Cost calculation utilities for Twitter scraping services.
 *
 * Shared between backend (API) and frontend (apps) for consistent pricing.
 * Uses gas-based model where cost scales linearly with tweet count.
 *
 * Credits are stored as bigint (rems) with 18 decimals, 1:1 with TORUS tokens.
 */

import { makeTorAmount, toRems } from "./torus/token.js";
import type { TorAmount } from "./torus/token.js";

/**
 * Fixed cost to fetch Twitter user metadata (one API call).
 * Required for users not yet in the database.
 */
export const BASELINE_METADATA_COST = makeTorAmount(
  toRems(makeTorAmount(0.069)),
);

/**
 * Base cost for any scraping job (overhead, queue management, etc.).
 */
export const BASELINE_SCRAPING_COST = makeTorAmount(
  toRems(makeTorAmount(0.069)),
);

/**
 * Cost per tweet scraped (gas price per unit of work).
 */
export const COST_PER_TWEET = makeTorAmount(toRems(makeTorAmount(0.000015)));

/**
 * Calculates the cost to scrape a Twitter user's tweets.
 *
 * Uses gas-based model: BASE_COST + (tweet_count × COST_PER_TWEET)
 *
 * @param tweetCount - Number of tweets the user has posted
 * @returns Cost as TorAmount (bigint rems)
 *
 * @example
 * ```ts
 * calculateScrapingCost(10000) // 150 TORUS (as bigint rems)
 * calculateScrapingCost(1000)  // 60 TORUS (as bigint rems)
 * calculateScrapingCost(0)     // 50 TORUS (as bigint rems)
 * ```
 */
export function calculateScrapingCost(tweetCount: number): TorAmount {
  // COST_PER_TWEET and BASELINE_SCRAPING_COST are TorAmount (branded bigint)
  // Extract bigint for math, then wrap result
  const tweetCostRems = COST_PER_TWEET.multipliedBy(makeTorAmount(tweetCount)); // TODO: this makes no sense, we need to improve the TorAmount type
  const totalRems = BASELINE_SCRAPING_COST.plus(tweetCostRems);
  return totalRems;
}

/**
 * Converts TORUS token amount to credits.
 *
 * Currently 1:1 exchange rate, but abstracted for future flexibility.
 *
 * @param torusAmount - TORUS amount as TorAmount
 * @returns Credits as TorAmount (same value, 1:1 rate)
 */
export function torusToCredits(torusAmount: TorAmount): TorAmount {
  // 1:1 exchange rate - credits = TORUS
  return torusAmount;
}

/**
 * Converts credits to TORUS token amount.
 *
 * Currently 1:1 exchange rate, but abstracted for future flexibility.
 *
 * @param credits - Credit amount as TorAmount
 * @returns TORUS amount as TorAmount (same value, 1:1 rate)
 */
export function creditsToTorus(credits: TorAmount): TorAmount {
  // 1:1 exchange rate - TORUS = credits
  return credits;
}
