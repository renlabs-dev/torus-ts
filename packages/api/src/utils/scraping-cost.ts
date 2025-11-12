/**
 * Cost calculation utilities for Twitter scraping services.
 *
 * Uses a gas-based model where cost scales linearly with tweet count.
 * Costs are denominated in credits, which can be purchased with TORUS tokens.
 */

import { fromNano, toNano } from "@torus-network/torus-utils/torus/legacy";

/**
 * Fixed cost to fetch Twitter user metadata (one API call).
 * Required for users not yet in the database.
 */
export const BASELINE_METADATA_COST = 10;

/**
 * Base cost for any scraping job (overhead, queue management, etc.).
 */
export const BASELINE_SCRAPING_COST = 50;

/**
 * Cost per tweet scraped (gas price per unit of work).
 */
export const COST_PER_TWEET = 0.01;

/**
 * Calculates the cost to scrape a Twitter user's tweets.
 *
 * Uses gas-based model: BASE_COST + (tweet_count × COST_PER_TWEET)
 *
 * @param tweetCount - Number of tweets the user has posted
 * @returns Cost in credits
 *
 * @example
 * ```ts
 * calculateScrapingCost(10000) // 50 + (10000 × 0.01) = 150 credits
 * calculateScrapingCost(1000)  // 50 + (1000 × 0.01) = 60 credits
 * ```
 */
export function calculateScrapingCost(tweetCount: number): number {
  return BASELINE_SCRAPING_COST + tweetCount * COST_PER_TWEET;
}

/**
 * Converts TORUS token amount (bigint with 18 decimals) to credits.
 *
 * Exchange rate: 1 TORUS = 1 credit
 *
 * @param torusAmount - TORUS amount as bigint (10^18 = 1 TORUS)
 * @returns Credits as number (can be fractional)
 *
 * @example
 * ```ts
 * torusToCredits(toNano("1"))   // 1 credit
 * torusToCredits(toNano("5.5")) // 5.5 credits
 * ```
 */
export function torusToCredits(torusAmount: bigint): number {
  return Number(fromNano(torusAmount));
}

/**
 * Converts credits to TORUS token amount (bigint with 18 decimals).
 *
 * Exchange rate: 1 credit = 1 TORUS
 *
 * @param credits - Credit amount as number
 * @returns TORUS amount as bigint (10^18 = 1 TORUS)
 *
 * @example
 * ```ts
 * creditsToTorus(1)   // toNano("1")
 * creditsToTorus(5.5) // toNano("5.5")
 * ```
 */
export function creditsToTorus(credits: number): bigint {
  return toNano(credits.toString());
}
