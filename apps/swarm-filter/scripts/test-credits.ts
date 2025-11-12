/**
 * Test credit system endpoints
 *
 * Run: pnpm tsx apps/swarm-filter/scripts/test-credits.ts
 * Requires: API server running at localhost:3004
 *
 * MANUAL STEPS TO TEST PURCHASE FLOW:
 *
 * 1. Make TORUS transfer on-chain to PREDICTION_APP_ADDRESS
 * 2. Note the txHash and blockHash from finalized event
 * 3. Paste them in TX_HASH and BLOCK_HASH constants below
 * 4. Run this script
 */

import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { createSessionToken } from "@torus-ts/api/auth";
import type { AppRouter } from "@torus-ts/api/root";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

// ========================================
// CONFIGURATION - UPDATE THESE VALUES
// ========================================

const TX_HASH =
  "0xb18ced8dc59bec8ba5da91aa8c4c5ca322869c504f2cb62daf9c18ddac473c00"; // Paste transaction hash here (0x...)
const BLOCK_HASH =
  "0x7d9fafb2c1f4a9272f94ac4e056c868ee37ea58d97f9b6f2a8227ac978a7715e"; // Paste block hash here (0x...)

const UNKNOWN_USER = "unknown123"; // User that doesn't exist
const TEST_USER = "furrydepressivo"; // User to test metadata purchase + scraping (leave empty to skip)

// ========================================

async function main() {
  await cryptoWaitReady();

  console.log("Testing Credit System...\n");

  // Generate JWT token from FILTER_AGENT_MNEMONIC
  const mnemonic = process.env.FILTER_AGENT_MNEMONIC;
  if (!mnemonic) {
    console.error("Error: FILTER_AGENT_MNEMONIC not set in .env");
    process.exit(1);
  }

  const keyring = new Keyring({ type: "sr25519" });
  const pair = keyring.addFromMnemonic(mnemonic);
  const address = pair.address;

  const jwtSecret = process.env.JWT_SECRET || "test-secret";
  const authOrigin = process.env.AUTH_ORIGIN || "sension.torus.directory";

  const JWT_TOKEN = createSessionToken(
    { userKey: address, uri: authOrigin },
    jwtSecret,
  );

  console.log(`Using agent: ${address}`);
  console.log(`JWT generated automatically\n`);

  // Client without auth for public endpoints
  const publicClient = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: "http://localhost:3004/api/trpc",
        transformer: superjson,
      }),
    ],
  });

  // Client with auth for protected endpoints
  const authClient = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: "http://localhost:3004/api/trpc",
        transformer: superjson,
        headers: { Authorization: `Bearer ${JWT_TOKEN}` },
      }),
    ],
  });

  try {
    // Test 1: Check user status (public endpoint)
    console.log("Test 1: Check Twitter user status...");
    const elonStatus = await publicClient.twitterUser.checkUserStatus.query({
      username: "elonmusk",
    });
    console.log(`✓ @elonmusk has metadata: ${elonStatus.hasMetadata}`);
    if (elonStatus.hasMetadata && elonStatus.scrapingCost) {
      console.log(`  Scraping cost: ${elonStatus.scrapingCost} credits`);
      console.log(
        `  Tweet count: ${elonStatus.user?.tweetCount?.toLocaleString()}`,
      );
    } else {
      console.log(`  Metadata cost: ${elonStatus.metadataCost} credits`);
    }

    // Test 2: Check unknown user
    console.log("\nTest 2: Check unknown user...");
    const unknownStatus = await publicClient.twitterUser.checkUserStatus.query({
      username: "unknown123",
    });
    console.log(`✓ Has metadata: ${unknownStatus.hasMetadata}`);
    console.log(`  Metadata cost: ${unknownStatus.metadataCost} credits`);

    // Test 3: Get balance (authenticated)
    console.log("\nTest 3: Get credit balance (authenticated)...");
    const balance = await authClient.credits.getBalance.query();
    console.log(`✓ Balance: ${balance.balance} credits`);
    console.log(`  Total purchased: ${balance.totalPurchased}`);
    console.log(`  Total spent: ${balance.totalSpent}`);

    // Test 4: Purchase credits (requires TX_HASH and BLOCK_HASH)
    if (TX_HASH && BLOCK_HASH) {
      console.log("\nTest 4: Purchase credits with transaction...");
      console.log(`  TX Hash: ${TX_HASH}`);
      console.log(`  Block Hash: ${BLOCK_HASH}`);

      // const result = await authClient.credits.purchaseCredits.mutate({
      //   txHash: TX_HASH,
      //   blockHash: BLOCK_HASH,
      // });

      // console.log(`✓ Credits granted: ${result.creditsGranted}`);
      // console.log(`  TORUS amount: ${result.torusAmount}`);

      // Check balance again
      const newBalance = await authClient.credits.getBalance.query();
      console.log(`  New balance: ${newBalance.balance} credits`);
    } else {
      console.log(
        "\nTest 4: SKIPPED - Set TX_HASH and BLOCK_HASH in script to test purchase",
      );
      console.log("  1. Transfer TORUS to PREDICTION_APP_ADDRESS on-chain");
      console.log("  2. Copy txHash and blockHash from finalized event");
      console.log("  3. Update TX_HASH and BLOCK_HASH constants above");
    }

    // Test 5: Get purchase history
    console.log("\nTest 5: Get purchase history...");
    const history = await authClient.credits.getPurchaseHistory.query();
    console.log(`✓ Found ${history.length} purchases`);
    if (history.length > 0) {
      const latest = history[0];
      console.log(`  Latest: ${latest?.creditsGranted} credits`);
      console.log(`  TX: ${latest?.txHash.substring(0, 20)}...`);
    }

    // Test 6: Purchase metadata for unknown user (should fail - user doesn't exist)
    // console.log("\nTest 6: Purchase metadata for unknown user...");
    // try {
    //   await authClient.twitterUser.purchaseMetadata.mutate({
    //     username: UNKNOWN_USER,
    //   });
    //   console.log(`✗ Unexpected success!`);
    // } catch (error) {
    //   console.log(`✓ Expected failure:`, error.message);
    // }

    // Test 7: Purchase metadata for real user (if TEST_USER configured)
    if (TEST_USER) {
      console.log(`\nTest 7: Purchase metadata for @${TEST_USER}...`);
      const metadataResult =
        await authClient.twitterUser.purchaseMetadata.mutate({
          username: TEST_USER,
        });
      console.log(`✓ Metadata purchased`);
      console.log(`  Credits spent: ${metadataResult.creditsSpent}`);
      console.log(`  User ID: ${metadataResult.user.userId}`);
      console.log(`  Tweet count: ${metadataResult.user.tweetCount}`);
      console.log(`  Followers: ${metadataResult.user.followerCount}`);

      // Test 8: Suggest user for scraping (after metadata purchased)
      console.log(`\nTest 8: Suggest @${TEST_USER} for scraping...`);
      const suggestResult = await authClient.twitterUser.suggestUser.mutate({
        username: TEST_USER,
      });
      console.log(`✓ User suggested for scraping`);
      console.log(`  Credits spent: ${suggestResult.creditsSpent}`);

      // Check final balance
      const finalBalance = await authClient.credits.getBalance.query();
      console.log(`\nFinal balance: ${finalBalance.balance} credits`);
    } else {
      console.log(
        "\nTest 7-8: SKIPPED - Set TEST_USER to test metadata + scraping flow",
      );
    }

    console.log("\n✅ All tests completed!");
  } catch (error) {
    console.error("\n❌ Test failed:");
    console.error(error);
    process.exit(1);
  }
}

main();
