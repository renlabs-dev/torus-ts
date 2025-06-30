import { mnemonicGenerate, sr25519Sign } from "@polkadot/util-crypto";
import { Keypair } from "../agent-client/index.js";
import { randomUUID } from "crypto";
import base64url from "base64url";

async function generateTestMnemonic() {
  const { cryptoWaitReady } = await import("@polkadot/util-crypto");
  await cryptoWaitReady();
  return mnemonicGenerate();
}

async function createJWTToken(mnemonic: string) {
  const keypair = new Keypair(mnemonic);
  return await keypair.createJWT();
}

// Create a JWT token with custom iat and exp for testing JWT age window
async function createOldJWTToken(mnemonic: string) {
  const keypair = new Keypair(mnemonic);
  const keyInfo = await keypair.getKeyInfo();
  
  const yesterday = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
  const nextYear = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60);
  
  const payload = {
    sub: keyInfo.address,
    publicKey: keyInfo.publicKey,
    iat: yesterday,
    exp: nextYear,
    nonce: randomUUID()
  };
  
  const header = { alg: "SR25519", typ: "JWT" };
  
  const encodedHeader = base64url.default.encode(JSON.stringify(header));
  const encodedPayload = base64url.default.encode(JSON.stringify(payload));
  
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const message = new TextEncoder().encode(signingInput);
  
  const signature = sr25519Sign(message, {
    publicKey: new Uint8Array(Buffer.from(keyInfo.publicKey!, "hex")),
    secretKey: new Uint8Array(Buffer.from(keyInfo.privateKey!, "hex")),
  });
  
  const encodedSignature = base64url.default.encode(Buffer.from(signature));
  
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

async function testAuthenticatedHelloEndpoint() {
  const serverUrl = "http://localhost:3002";

  const testMnemonic = await generateTestMnemonic();
  console.log("🔑 Generated test mnemonic:", testMnemonic);

  const keypair = new Keypair(testMnemonic);
  const keyInfo = await keypair.getKeyInfo();

  console.log("🔑 Client authentication info:");
  console.log(`Address: ${keyInfo.address}`);
  console.log(`Public Key: ${keyInfo.publicKey}\n`);

  try {
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
  console.log("🔐 Testing SR25519 JWT authentication...\n");

  const testMnemonic = await generateTestMnemonic();
  const jwtToken = await createJWTToken(testMnemonic);

  console.log("Generated SR25519 JWT token:", jwtToken.slice(0, 50) + "...\n");

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
    console.log("✅ SR25519 JWT Authentication success:", result);
    console.log(`   Message: ${result.message}`);
    console.log(`   User Address: ${result.userAddress}\n`);
  } catch (error) {
    console.error("❌ SR25519 JWT Authentication error:", error);
  }
}

async function testOldJWTRejection() {
  console.log("🕰️ Testing JWT age window rejection (should fail)...\n");

  const testMnemonic = await generateTestMnemonic();
  const oldJwtToken = await createOldJWTToken(testMnemonic);

  console.log("Generated old JWT token (iat=yesterday, exp=next year):", oldJwtToken.slice(0, 50) + "...\n");

  try {
    const response = await fetch("http://localhost:3002/hello", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${oldJwtToken}`,
      },
      body: JSON.stringify({ name: "Old JWT User" }),
    });

    if (response.status === 401) {
      const errorResponse = await response.json();
      console.log(`Response status: ${response.status}`);
      console.log(`Response body:`, errorResponse);
      
      if (errorResponse.code === 'TOO_OLD') {
        console.log("✅ Correctly rejected old JWT token with proper error message");
        console.log(`   Error: ${errorResponse.message}`);
        console.log(`   Code: ${errorResponse.code}\n`);
      } else {
        console.log("❌ Unexpected error code - expected 'TOO_OLD'\n");
      }
    } else {
      const responseText = await response.text();
      console.log(`❌ Unexpected response status: ${response.status}`);
      console.log(`Response body: ${responseText}\n`);
    }
  } catch (error) {
    console.error("❌ Error testing old JWT rejection:", error);
  }
}

async function runAuthenticatedTests() {
  console.log("🚀 Starting authenticated client tests...\n");

  const testMnemonic = await generateTestMnemonic();
  console.log("🔑 Using test mnemonic:", testMnemonic, "\n");

  await testUnauthenticatedRequest();

  await testJWTAuthentication();

  await testOldJWTRejection();

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
