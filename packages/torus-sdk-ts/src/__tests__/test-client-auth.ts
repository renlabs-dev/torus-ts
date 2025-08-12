import { sr25519Sign } from "@polkadot/util-crypto";
import { Keypair, AgentClient } from "../agent-client/index.js";
import { randomUUID } from "crypto";
import base64url from "base64url";
import { getCurrentProtocolVersion } from "../agent/jwt-sr25519.js";

const TEST_MNEMONIC = "";

async function createJWTToken(mnemonic: string) {
  const keypair = new Keypair(mnemonic);
  return await keypair.createJWT();
}

// Create a JWT token with custom iat and exp for testing JWT age window
async function createOldJWTToken(mnemonic: string) {
  const keypair = new Keypair(mnemonic);
  const keyInfo = await keypair.getKeyInfo();

  const yesterday = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
  const nextYear = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

  const payload = {
    sub: keyInfo.address,
    publicKey: keyInfo.publicKey,
    keyType: "sr25519",
    addressInfo: {
      addressType: "ss58",
      metadata: {
        prefix: 42,
      },
    },
    iat: yesterday,
    exp: nextYear,
    nonce: randomUUID(),
    _protocol_metadata: {
      version: getCurrentProtocolVersion(),
    },
  };

  const header = { alg: "SR25519", typ: "JWT" };

  const encodedHeader = base64url.default.encode(JSON.stringify(header));
  const encodedPayload = base64url.default.encode(JSON.stringify(payload));

  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const message = new TextEncoder().encode(signingInput);

  if (!keyInfo.publicKey || !keyInfo.privateKey) {
    throw new Error("Missing public or private key");
  }

  const signature = sr25519Sign(message, {
    publicKey: new Uint8Array(Buffer.from(keyInfo.publicKey, "hex")),
    secretKey: new Uint8Array(Buffer.from(keyInfo.privateKey, "hex")),
  });

  const encodedSignature = base64url.default.encode(Buffer.from(signature));

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
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

  const jwtToken = await createJWTToken(TEST_MNEMONIC);

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

    const result = (await response.json()) as {
      message: string;
      userAddress: string;
    };
    console.log("✅ SR25519 JWT Authentication success:", result);
    console.log(`   Message: ${result.message}`);
    console.log(`   User Address: ${result.userAddress}\n`);
  } catch (error) {
    console.error("❌ SR25519 JWT Authentication error:", error);
  }
}

async function testOldJWTRejection() {
  console.log("🕰️ Testing JWT age window rejection (should fail)...\n");

  const oldJwtToken = await createOldJWTToken(TEST_MNEMONIC);

  console.log(
    "Generated old JWT token (iat=yesterday, exp=next year):",
    oldJwtToken.slice(0, 50) + "...\n",
  );

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
      const errorResponse = (await response.json()) as {
        message: string;
        code: string;
      };
      console.log(`Response status: ${response.status}`);
      console.log(`Response body:`, errorResponse);

      if (errorResponse.code === "TOO_OLD") {
        console.log(
          "✅ Correctly rejected old JWT token with proper error message",
        );
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

async function testSimpleAgentClient() {
  console.log("🤖 Testing simplified AgentClient...\n");

  const keypair = new Keypair(TEST_MNEMONIC);
  const client = new AgentClient({
    keypair,
    baseUrl: "http://localhost:3002",
  });

  try {
    const response = await client.call({
      endpoint: "hello",
      data: { name: "Simple Client User" },
    });

    if (response.success) {
      console.log("✅ AgentClient success:", response.data);
    } else {
      console.log("❌ AgentClient error:", response.error);
    }
  } catch (error) {
    console.error("❌ AgentClient unexpected error:", error);
  }
}

async function testNamespacePermissionDenial() {
  console.log(
    "🚧 Testing namespace permission denial (should return 403)...\n",
  );

  // This test assumes the user has valid JWT auth but lacks namespace permission
  // In a real scenario, the agent server would check blockchain permissions
  const jwtToken = await createJWTToken(TEST_MNEMONIC);

  try {
    const response = await fetch(
      "http://localhost:3002/restricted-namespace-test-el-psy-congroo",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          message: "Testing restricted namespace access",
        }),
      },
    );

    if (response.status === 403) {
      const errorResponse = (await response.json()) as {
        message: string;
        code: string;
      };
      console.log(`Response status: ${response.status}`);
      console.log(`Response body:`, errorResponse);

      if (errorResponse.code === "NAMESPACE_ACCESS_DENIED") {
        console.log(
          "✅ Correctly denied access due to insufficient namespace permissions",
        );
        console.log(`   Message: ${errorResponse.message}`);
        console.log(`   Code: ${errorResponse.code}`);

        // Extract and display the namespace path from error message
        const namespaceMatch = errorResponse.message.match(/namespace (.+)$/);
        if (namespaceMatch) {
          console.log(`   Required namespace: ${namespaceMatch[1]}\n`);
        }
      } else {
        console.log(
          "❌ Unexpected error code - expected 'NAMESPACE_ACCESS_DENIED'\n",
        );
      }
    } else if (response.ok) {
      const result = await response.json();
      console.log(
        "⚠️  Warning: Request succeeded when it should have been denied",
      );
      console.log("   This might indicate:");
      console.log("   - The test user has the required namespace permissions");
      console.log("   - Namespace checking is disabled or not working");
      console.log("   - The agent couldn't resolve its name from blockchain");
      console.log(`   Response: ${JSON.stringify(result)}\n`);
    } else {
      const responseText = await response.text();
      console.log(`❌ Unexpected response status: ${response.status}`);
      console.log(`Response body: ${responseText}\n`);
    }
  } catch (error) {
    console.error("❌ Error testing namespace permission denial:", error);
  }
}

async function runAuthenticatedTests() {
  console.log("🚀 Starting authenticated client tests...\n");

  await testUnauthenticatedRequest();

  await testJWTAuthentication();

  await testOldJWTRejection();

  await testNamespacePermissionDenial();

  await testSimpleAgentClient();
}

// Export for programmatic use
export { runAuthenticatedTests };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAuthenticatedTests().catch(console.error);
}
