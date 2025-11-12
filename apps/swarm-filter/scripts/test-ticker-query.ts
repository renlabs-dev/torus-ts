/**
 * Test script for getByTickerSymbol endpoint
 *
 * Requires API server running at http://localhost:3004
 * Run: pnpm tsx apps/swarm-filter/scripts/test-ticker-query.ts
 */

import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@torus-ts/api/root";
import superjson from "superjson";

async function main() {
  console.log("Testing getByTickerSymbol endpoint...\n");

  // Create tRPC client (same pattern as swarm-filter API client)
  const client = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: "http://localhost:3004/api/trpc",
        transformer: superjson,
      }),
    ],
  });

  try {
    // Test 1: BTC (no limit to see total count)
    console.log("Test 1: Fetching BTC predictions...");
    const btc = await client.prediction.getByTickerSymbol.query({
      symbol: "BTC",
    });
    console.log(`✓ Found ${btc.length} BTC predictions (grouped tweets)`);
    if (btc.length > 0) {
      const first = btc[0];
      if (first) {
        console.log(`  First tweet has ${first.predictions.length} prediction(s)`);
        console.log(`  First prediction quality: ${first.predictions[0]?.predictionQuality}`);
      }
    }

    // Test 2: ETH
    console.log("\nTest 2: Fetching ETH predictions...");
    const eth = await client.prediction.getByTickerSymbol.query({
      symbol: "ETH",
    });
    console.log(`✓ Found ${eth.length} ETH predictions (grouped tweets)`);

    // Test 3: Non-existent
    console.log("\nTest 3: Fetching FOOBAR predictions (should be 0)...");
    const foo = await client.prediction.getByTickerSymbol.query({
      symbol: "FOOBAR",
    });
    console.log(`✓ Found ${foo.length} FOOBAR predictions`);

    // Test 4: Case insensitive
    console.log("\nTest 4: Fetching btc (lowercase)...");
    const btcLower = await client.prediction.getByTickerSymbol.query({
      symbol: "btc",
    });
    console.log(`✓ Found ${btcLower.length} btc predictions (should match BTC count)`);

    console.log("\n✅ All tests passed!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();
