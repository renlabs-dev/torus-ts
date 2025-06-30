import { mnemonicGenerate } from "@polkadot/util-crypto";
import { Keypair } from "../agent-client/index.js";
import * as jwt from "jsonwebtoken";
import { sr25519Sign } from "@polkadot/util-crypto";
import base64url from "base64url";

// Generate a valid test mnemonic
async function generateTestMnemonic() {
  const { cryptoWaitReady } = await import("@polkadot/util-crypto");
  await cryptoWaitReady();
  return mnemonicGenerate();
}

// Create a JWT token for testing
async function createJWTToken(mnemonic: string) {
  const keypair = new Keypair(mnemonic);
  const keyInfo = await keypair.getKeyInfo();

  if (!keyInfo.publicKey || !keyInfo.privateKey || !keyInfo.address) {
    throw new Error("Failed to get keypair info");
  }

  // Create JWT payload - must match TokenDataSchema (only userWalletAddress and userPublicKey)
  const payload = {
    userWalletAddress: keyInfo.address,
    userPublicKey: keyInfo.publicKey,
  };

  // Create the header and payload parts using base64url encoding
  const header = { alg: "SR25519", typ: "JWT" };
  const encodedHeader = base64url.default.encode(JSON.stringify(header));
  const encodedPayload = base64url.default.encode(JSON.stringify(payload));

  // Sign the header.payload with SR25519
  const message = new TextEncoder().encode(
    `${encodedHeader}.${encodedPayload}`,
  );
  const signature = sr25519Sign(message, {
    publicKey: new Uint8Array(Buffer.from(keyInfo.publicKey, "hex")),
    secretKey: new Uint8Array(Buffer.from(keyInfo.privateKey, "hex")),
  });

  // The signature should be exactly 64 bytes
  // Convert Uint8Array to Buffer for proper base64url encoding
  const encodedSignature = base64url.default.encode(Buffer.from(signature));

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

async function testAuthenticatedHelloEndpoint() {
  const serverUrl = "http://localhost:3002";

  // Generate a valid mnemonic for testing
  const testMnemonic = await generateTestMnemonic();
  console.log("🔑 Generated test mnemonic:", testMnemonic);

  // Create keypair for authentication
  const keypair = new Keypair(testMnemonic);
  const keyInfo = await keypair.getKeyInfo();

  console.log("🔑 Client authentication info:");
  console.log(`Address: ${keyInfo.address}`);
  console.log(`Public Key: ${keyInfo.publicKey}\n`);

  try {
    // Sign the request
    const authData = await keypair.signRequest("POST", "/hello");

    const response = await fetch(`${serverUrl}/hello`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Signature": authData.signature,
        "X-Public-Key": authData.publicKey,
        "X-Wallet-Address": authData.walletAddress,
        "X-Timestamp": authData.timestamp.toString(),
      },
      body: JSON.stringify({
        name: "Authenticated User",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorText}`,
      );
    }

    const result = await response.json();
    console.log("✅ Authenticated request success:", result);
    return result;
  } catch (error) {
    console.error("❌ Authenticated request error:", error);
    throw error;
  }
}

async function testUnauthenticatedRequest() {
  const serverUrl = "http://localhost:3002";

  console.log("🚫 Testing unauthenticated request (should fail)...");

  try {
    const response = await fetch(`${serverUrl}/hello`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Unauthenticated User",
      }),
    });

    const responseText = await response.text();
    console.log(`Response status: ${response.status}`);
    console.log(`Response body: ${responseText}`);

    if (response.status === 401) {
      console.log("✅ Correctly rejected unauthenticated request\n");
    } else {
      console.log("❌ Unexpected response for unauthenticated request\n");
    }
  } catch (error) {
    console.error("❌ Error testing unauthenticated request:", error);
  }
}

async function testJWTAuthentication() {
  console.log("🔐 Testing JWT authentication...\n");

  const testMnemonic = await generateTestMnemonic();
  const jwtToken = await createJWTToken(testMnemonic);

  console.log("Generated JWT token:", jwtToken.slice(0, 50) + "...\n");

  try {
    const response = await fetch("http://localhost:3002/hello", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({ name: "JWT User" }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `JWT Auth failed: status: ${response.status}, body: ${errorText}`,
      );
      return;
    }

    const result = await response.json();
    console.log("✅ JWT Authentication success:", result);
    console.log(`   Message: ${result.message}`);
    console.log(`   User Address: ${result.userAddress}\n`);
  } catch (error) {
    console.error("❌ JWT Authentication error:", error);
  }
}

async function runAuthenticatedTests() {
  console.log("🚀 Starting authenticated client tests...\n");

  // Generate a valid mnemonic for all tests
  const testMnemonic = await generateTestMnemonic();
  console.log("🔑 Using test mnemonic:", testMnemonic, "\n");

  // Test unauthenticated request first (should fail)
  await testUnauthenticatedRequest();

  // Test JWT authentication
  await testJWTAuthentication();

  // Test message signature authentication (should succeed)
  console.log("🔏 Testing message signature authentication...\n");
  const testCases = ["Alice", "Bob", "Charlie"];

  for (const name of testCases) {
    try {
      console.log(`Testing signature auth request with name: "${name}"`);

      const keypair = new Keypair(testMnemonic);
      const authData = await keypair.signRequest("POST", "/hello");

      const response = await fetch("http://localhost:3002/hello", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Signature": authData.signature,
          "X-Public-Key": authData.publicKey,
          "X-Wallet-Address": authData.walletAddress,
          "X-Timestamp": authData.timestamp.toString(),
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `HTTP error! status: ${response.status}, body: ${errorText}`,
        );
        continue;
      }

      const result = await response.json();
      console.log(`✅ Result: ${result.message}`);
      console.log(`   Timestamp: ${result.timestamp}`);
      console.log(`   User Address: ${result.userAddress}\n`);
    } catch (error) {
      console.error(`❌ Failed for name "${name}":`, error);
    }
  }
}

// Export for programmatic use
export { testAuthenticatedHelloEndpoint, runAuthenticatedTests };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAuthenticatedTests().catch(console.error);
}
