import { beforeEach, describe, expect, it } from "vitest";
import { SwarmAuth } from "../auth/swarm-auth.js";

// Test mnemonic - Alice from Substrate
const TEST_MNEMONIC =
  "bottom drive obey lake curtain smoke basket hold race lonely fit walk";

describe("SwarmAuth - Real API", () => {
  let swarmAuth: SwarmAuth;

  beforeEach(async () => {
    swarmAuth = await SwarmAuth.fromMnemonic(TEST_MNEMONIC);
  });

  describe("initialization", () => {
    it("should initialize with mnemonic", () => {
      expect(swarmAuth).toBeInstanceOf(SwarmAuth);
    });

    it("should work with any mnemonic phrase", async () => {
      // Note: Polkadot keyring accepts any string as seed, so this actually works
      const anyAuth = await SwarmAuth.fromMnemonic("invalid mnemonic");
      const mockRequest = new Request("https://example.com");
      await anyAuth.authenticate(mockRequest);
      const token =
        mockRequest.headers.get("Authorization")?.replace("Bearer ", "") || "";

      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
      console.log(`Any phrase works, got token: ${token.substring(0, 8)}...`);
    }, 10000);
  });

  describe("wallet operations", () => {
    it("should get wallet address", async () => {
      const address = await swarmAuth.getWalletAddress();
      expect(address).toMatch(/^[a-zA-Z0-9]{47,48}$/); // Substrate address format
      console.log("Alice wallet address:", address);
    });

    it("should have consistent wallet address", async () => {
      const address1 = await swarmAuth.getWalletAddress();
      const address2 = await swarmAuth.getWalletAddress();
      expect(address1).toBe(address2);
    });
  });

  describe("authentication flow", () => {
    it("should complete successful authentication", async () => {
      const mockRequest = new Request("https://example.com");
      await swarmAuth.authenticate(mockRequest);
      const token =
        mockRequest.headers.get("Authorization")?.replace("Bearer ", "") || "";
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
      console.log("Authentication successful, token length:", token.length);
    }, 10000);

    it("should cache token and not re-authenticate while valid", async () => {
      // First call should trigger authentication
      const mockRequest1 = new Request("https://example.com");
      await swarmAuth.authenticate(mockRequest1);
      const token1 =
        mockRequest1.headers.get("Authorization")?.replace("Bearer ", "") || "";
      expect(typeof token1).toBe("string");

      // Second call should use cached token (much faster)
      const startTime = Date.now();
      const mockRequest2 = new Request("https://example.com");
      await swarmAuth.authenticate(mockRequest2);
      const token2 =
        mockRequest2.headers.get("Authorization")?.replace("Bearer ", "") || "";
      const duration = Date.now() - startTime;

      expect(token2).toBe(token1);
      expect(duration).toBeLessThan(100); // Should be very fast if cached
      console.log("Token caching working, second call took:", duration, "ms");
    }, 10000);

    it("should re-authenticate after token is cleared", async () => {
      // First authentication
      const mockRequest1 = new Request("https://example.com");
      await swarmAuth.authenticate(mockRequest1);
      const token1 =
        mockRequest1.headers.get("Authorization")?.replace("Bearer ", "") || "";
      expect(typeof token1).toBe("string");

      // Clear token to simulate expiry
      swarmAuth.clearToken();
      expect(await swarmAuth.isValid()).toBe(false);

      // Second authentication should get new token
      const mockRequest2 = new Request("https://example.com");
      await swarmAuth.authenticate(mockRequest2);
      const token2 =
        mockRequest2.headers.get("Authorization")?.replace("Bearer ", "") || "";
      expect(typeof token2).toBe("string");
      expect(token2).not.toBe(token1); // Should be different token

      console.log("Token refresh working, got new token");
    }, 15000);
  });

  describe("token management", () => {
    it("should check if token is valid", async () => {
      expect(await swarmAuth.isValid()).toBe(false);

      const mockRequest = new Request("https://example.com");
      await swarmAuth.authenticate(mockRequest);
      expect(await swarmAuth.isValid()).toBe(true);
    }, 10000);

    it("should refresh token", async () => {
      const mockRequest1 = new Request("https://example.com");
      await swarmAuth.authenticate(mockRequest1);
      const token1 =
        mockRequest1.headers.get("Authorization")?.replace("Bearer ", "") || "";
      expect(typeof token1).toBe("string");

      await swarmAuth.refresh();
      const mockRequest2 = new Request("https://example.com");
      await swarmAuth.authenticate(mockRequest2);
      const token2 =
        mockRequest2.headers.get("Authorization")?.replace("Bearer ", "") || "";
      expect(typeof token2).toBe("string");
      expect(token2).not.toBe(token1); // Should be different after refresh

      console.log("Token refresh successful");
    }, 15000);

    it("should clear token", async () => {
      const mockRequest = new Request("https://example.com");
      await swarmAuth.authenticate(mockRequest);
      expect(await swarmAuth.isValid()).toBe(true);

      swarmAuth.clearToken();
      expect(await swarmAuth.isValid()).toBe(false);
    }, 10000);
  });

  describe("factory methods", () => {
    it("should create SwarmAuth with custom base URL", async () => {
      const customUrl = "https://memory.sension.torus.directory";
      const auth = await SwarmAuth.fromMnemonic(TEST_MNEMONIC, customUrl);
      expect(auth).toBeDefined();

      // Test authentication works with custom URL
      const mockRequest = new Request("https://example.com");
      await auth.authenticate(mockRequest);
      expect(mockRequest.headers.get("Authorization")).toMatch(/^Bearer .+$/);
    }, 10000);
  });
});
