import { describe, expect, it } from "vitest";
import { getExplorerUrl } from "./fast-bridge-helpers";

describe("getExplorerUrl", () => {
  it("should return correct Basescan URL for Base chain", () => {
    const txHash = "0x1234567890abcdef1234567890abcdef12345678";
    const result = getExplorerUrl(txHash, "base");

    expect(result).toBe(`https://basescan.org/tx/${txHash}`);
  });

  it("should return correct Blockscout URL for Torus EVM chain", () => {
    const txHash = "0xabcdef1234567890abcdef1234567890abcdef12";
    const result = getExplorerUrl(txHash, "torus evm");

    expect(result).toBe(`https://blockscout.torus.network/tx/${txHash}`);
  });

  it("should return correct Polkadot.js URL for Torus chain", () => {
    const txHash =
      "0x32054b7ad2125bf26c4d28b09a056ac0e4ee89af51cfbbf7e2c96fa583638c91";
    const result = getExplorerUrl(txHash, "torus");

    expect(result).toBe(
      `https://polkadot.js.org/apps/?rpc=wss://api.torus.network#/explorer/query/${txHash}`,
    );
  });

  it("should return correct Polkadot.js URL for Torus Native chain", () => {
    const txHash = "0x9876543210fedcba9876543210fedcba98765432";
    const result = getExplorerUrl(txHash, "torus native");

    expect(result).toBe(
      `https://polkadot.js.org/apps/?rpc=wss://api.torus.network#/explorer/query/${txHash}`,
    );
  });

  it("should handle case insensitive chain names", () => {
    const txHash = "0x1234567890abcdef1234567890abcdef12345678";

    expect(getExplorerUrl(txHash, "BASE")).toBe(
      `https://basescan.org/tx/${txHash}`,
    );
    expect(getExplorerUrl(txHash, "Torus EVM")).toBe(
      `https://blockscout.torus.network/tx/${txHash}`,
    );
    expect(getExplorerUrl(txHash, "TORUS")).toBe(
      `https://polkadot.js.org/apps/?rpc=wss://api.torus.network#/explorer/query/${txHash}`,
    );
  });

  it("should return empty string for unsupported chains", () => {
    const txHash = "0x1234567890abcdef1234567890abcdef12345678";

    expect(getExplorerUrl(txHash, "ethereum")).toBe("");
    expect(getExplorerUrl(txHash, "polygon")).toBe("");
    expect(getExplorerUrl(txHash, "unknown")).toBe("");
  });

  it("should handle the exact URL format from user example", () => {
    const txHash =
      "0x32054b7ad2125bf26c4d28b09a056ac0e4ee89af51cfbbf7e2c96fa583638c91";
    const result = getExplorerUrl(txHash, "torus");

    // This should match the URL format provided by the user
    const expectedUrl = `https://polkadot.js.org/apps/?rpc=wss://api.torus.network#/explorer/query/${txHash}`;
    expect(result).toBe(expectedUrl);
  });
});
