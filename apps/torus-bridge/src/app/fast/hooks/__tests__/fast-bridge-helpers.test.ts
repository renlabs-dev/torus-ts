import { describe, expect, it } from "vitest";
import { EXPLORER_URLS, getExplorerUrl } from "../fast-bridge-helpers";

describe("getExplorerUrl", () => {
  it("should return correct Basescan URL for Base chain", () => {
    const txHash = "0x1234567890abcdef1234567890abcdef12345678";
    const result = getExplorerUrl(txHash, "base");

    expect(result).toBe(`${EXPLORER_URLS.BASE}/${txHash}`);
  });

  it("should return correct Hyperlane explorer URL for Torus EVM chain", () => {
    const txHash = "0xabcdef1234567890abcdef1234567890abcdef12";
    const result = getExplorerUrl(txHash, "torus evm");

    expect(result).toBe(`${EXPLORER_URLS.TORUS_EVM_HYPERLANE}/${txHash}`);
  });

  it("should return correct Polkadot.js URL for Torus chain", () => {
    const txHash =
      "0x32054b7ad2125bf26c4d28b09a056ac0e4ee89af51cfbbf7e2c96fa583638c91";
    const result = getExplorerUrl(txHash, "torus");

    expect(result).toBe(`${EXPLORER_URLS.TORUS}${txHash}`);
  });

  it("should return correct Polkadot.js URL for Torus Native chain", () => {
    const txHash = "0x9876543210fedcba9876543210fedcba98765432";
    const result = getExplorerUrl(txHash, "torus");

    expect(result).toBe(`${EXPLORER_URLS.TORUS}${txHash}`);
  });

  it("should handle case insensitive chain names", () => {
    const txHash = "0x1234567890abcdef1234567890abcdef12345678";

    expect(getExplorerUrl(txHash, "BASE")).toBe(
      `${EXPLORER_URLS.BASE}/${txHash}`,
    );
    expect(getExplorerUrl(txHash, "Torus EVM")).toBe(
      `${EXPLORER_URLS.TORUS_EVM_HYPERLANE}/${txHash}`,
    );
    expect(getExplorerUrl(txHash, "TORUS")).toBe(
      `${EXPLORER_URLS.TORUS}/${txHash}`,
    );
  });

  it("should return empty string for unsupported chains", () => {
    const txHash = "0x1234567890abcdef1234567890abcdef12345678";

    expect(getExplorerUrl(txHash, "ethereum")).toBe("");
    expect(getExplorerUrl(txHash, "polygon")).toBe("");
    expect(getExplorerUrl(txHash, "unknown")).toBe("");
  });

  it("should use enum URLs consistently", () => {
    const txHash =
      "0x32054b7ad2125bf26c4d28b09a056ac0e4ee89af51cfbbf7e2c96fa583638c91";

    const baseResult = getExplorerUrl(txHash, "base");
    expect(baseResult).toBe(`${EXPLORER_URLS.BASE}/${txHash}`);

    const torusResult = getExplorerUrl(txHash, "torus");
    expect(torusResult).toBe(`${EXPLORER_URLS.TORUS}/${txHash}`);

    const hyperlaneResult = getExplorerUrl(txHash, "torus evm");
    expect(hyperlaneResult).toBe(
      `${EXPLORER_URLS.TORUS_EVM_HYPERLANE}/${txHash}`,
    );
  });
});
