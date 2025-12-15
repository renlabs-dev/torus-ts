#!/usr/bin/env tsx
/**
 * CLI client for testing swarm-api endpoints
 *
 * Usage:
 *   pnpm tsx services/swarm-api/tests/client.ts gainPermission [options]
 *   pnpm tsx services/swarm-api/tests/client.ts balance
 *   pnpm tsx services/swarm-api/tests/client.ts history
 */
import { Keyring } from "@polkadot/keyring";
import { blake2AsHex, cryptoWaitReady } from "@polkadot/util-crypto";
import canonicalize from "canonicalize";
import { Command } from "commander";

const API_BASE_URL = "http://localhost:3117";

interface AuthHeaders {
  "x-agent-address": string;
  "x-signature": string;
  "x-timestamp": string;
}

/**
 * Create authentication headers for a request
 */
async function createAuthHeaders(mnemonic: string): Promise<AuthHeaders> {
  await cryptoWaitReady();

  const keyring = new Keyring({ type: "sr25519" });
  const keypair = keyring.addFromMnemonic(mnemonic);
  const address = keypair.address;
  const timestamp = new Date().toISOString();

  const payload = {
    address,
    timestamp,
  };

  const payloadCanonical = canonicalize(payload);
  if (!payloadCanonical) {
    throw new Error("Failed to canonicalize payload");
  }

  const payloadHash = blake2AsHex(payloadCanonical);
  const signature = keypair.sign(payloadHash);

  return {
    "x-agent-address": address,
    "x-signature": `0x${Buffer.from(signature).toString("hex")}`,
    "x-timestamp": timestamp,
  };
}

/**
 * Make an authenticated request to the API
 */
async function makeRequest(
  method: "GET" | "POST",
  endpoint: string,
  authHeaders: AuthHeaders,
  body?: unknown,
) {
  const url = `${API_BASE_URL}${endpoint}`;

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`\n→ ${method} ${url}`);
  console.log(`  Address: ${authHeaders["x-agent-address"]}`);
  if (body) {
    console.log(`  Body:`);
    console.log(
      JSON.stringify(body, null, 2)
        .split("\n")
        .map((line) => `    ${line}`)
        .join("\n"),
    );
  }

  const response = await fetch(url, options);
  const responseText = await response.text();

  console.log(`\n← Status: ${response.status} ${response.statusText}`);

  let parsedResponse;
  try {
    parsedResponse = JSON.parse(responseText);
    console.log(JSON.stringify(parsedResponse, null, 2));
  } catch {
    console.log(responseText);
    parsedResponse = responseText;
  }

  if (response.status >= 400) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return { status: response.status, data: parsedResponse };
}

// Create CLI program
const program = new Command();

program
  .name("swarm-api-client")
  .description("CLI client for testing Swarm API endpoints")
  .version("1.0.0")
  .option(
    "-m, --mnemonic <mnemonic>",
    "Wallet mnemonic for authentication",
    process.env.PREDICTION_APP_MNEMONIC,
  )
  .option("-u, --url <url>", "API base URL", "http://localhost:3117");

// Command: gainPermission
program
  .command("gainPermission")
  .alias("gain")
  .description(
    "Gain filter permission (optionally with transaction verification)",
  )
  .option("-t, --tx-hash <hash>", "Transaction hash (66 chars, starts with 0x)")
  .option("-b, --block <number|hash>", "Block number or block hash")
  .action(async (options) => {
    const parentOpts = program.opts();
    const authHeaders = await createAuthHeaders(parentOpts.mnemonic);

    console.log("\n╔════════════════════════════════════════╗");
    console.log("║     Gain Filter Permission             ║");
    console.log("╚════════════════════════════════════════╝");

    const body: { txData?: { txHash: string; blockInfo: number | string } } =
      {};

    if (options.txHash && options.block) {
      // Try to parse block as number, otherwise use as string (block hash)
      const blockInfo = /^\d+$/.test(options.block)
        ? parseInt(options.block, 10)
        : options.block;

      body.txData = {
        txHash: options.txHash,
        blockInfo,
      };
      console.log("Mode: Purchase credits + gain permission");
    } else if (options.txHash || options.block) {
      console.error(
        "\n❌ Error: Both --tx-hash and --block are required when providing transaction data",
      );
      process.exit(1);
    } else {
      console.log("Mode: Gain permission using existing credits");
    }

    try {
      await makeRequest("POST", "/v1/gainPermission", authHeaders, body);
      console.log("\n✅ Success! Permission granted");
    } catch (error) {
      console.error(
        `\n❌ Failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      process.exit(1);
    }
  });

// Command: balance
program
  .command("balance")
  .description("Get credit balance for the authenticated user")
  .action(async () => {
    const parentOpts = program.opts();
    const authHeaders = await createAuthHeaders(parentOpts.mnemonic);

    console.log("\n╔════════════════════════════════════════╗");
    console.log("║     Credit Balance                     ║");
    console.log("╚════════════════════════════════════════╝");

    try {
      const result = await makeRequest(
        "GET",
        "/v1/credits/balance",
        authHeaders,
      );
      console.log("\n✅ Balance retrieved");

      // Display formatted balance
      if (result.data && typeof result.data === "object") {
        console.log("\n" + "─".repeat(40));
        console.log(
          `Balance:        ${(result.data as { balance?: string }).balance ?? "0"}`,
        );
        console.log(
          `Total Purchased: ${(result.data as { totalPurchased?: string }).totalPurchased ?? "0"}`,
        );
        console.log(
          `Total Spent:    ${(result.data as { totalSpent?: string }).totalSpent ?? "0"}`,
        );
      }
    } catch (error) {
      console.error(
        `\n❌ Failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      process.exit(1);
    }
  });

// Command: history
program
  .command("history")
  .description("Get credit purchase history for the authenticated user")
  .option("-l, --limit <number>", "Maximum number of records to return", "50")
  .action(async (options) => {
    const parentOpts = program.opts();
    const authHeaders = await createAuthHeaders(parentOpts.mnemonic);

    console.log("\n╔════════════════════════════════════════╗");
    console.log("║     Purchase History                   ║");
    console.log("╚════════════════════════════════════════╝");

    try {
      const result = await makeRequest(
        "GET",
        "/v1/credits/history",
        authHeaders,
      );
      console.log(`\n✅ Retrieved purchase history`);

      // Display count
      if (Array.isArray(result.data)) {
        console.log(`\nTotal purchases: ${result.data.length}`);
      }
    } catch (error) {
      console.error(
        `\n❌ Failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      process.exit(1);
    }
  });

program.parse();
