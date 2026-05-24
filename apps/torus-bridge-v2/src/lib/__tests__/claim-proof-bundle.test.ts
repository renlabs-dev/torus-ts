import { readFileSync } from "node:fs";
import {
  getProofForAccount,
  isSameEvmAddress,
  parseClaimProofBundle,
} from "~/lib/claim-proof-bundle";
import { assert } from "tsafe";
import { describe, expect, it } from "vitest";

describe("claim proof bundle", () => {
  it("parses the public bundle and looks up claims case-insensitively", () => {
    const bundle = parseClaimProofBundle(readPublicBundle());
    const firstClaim = bundle.claims[0];
    assert(firstClaim !== undefined, "public proof bundle must include claims");

    expect(bundle.claimCount).toBe(bundle.claims.length);
    expect(bundle.merkleRoot).toMatch(/^0x[0-9a-fA-F]{64}$/);
    expect(
      getProofForAccount(
        bundle,
        firstClaim.account.toLowerCase() as `0x${string}`,
      ),
    ).toEqual(firstClaim);
    expect(
      getProofForAccount(
        bundle,
        firstClaim.account.toUpperCase() as `0x${string}`,
      ),
    ).toEqual(firstClaim);
  });

  it("rejects internally inconsistent bundles", () => {
    const bundle = parseClaimProofBundle(readPublicBundle());

    expect(() =>
      parseClaimProofBundle({
        ...bundle,
        claimCount: 0,
      }),
    ).toThrow(/claimCount 0 does not match/);
  });

  it("compares evm addresses without depending on checksum casing", () => {
    expect(
      isSameEvmAddress(
        "0xBdB62c057E3Bae5f12296A1729BEBa9aEF0E8961",
        "0xbdb62c057e3bae5f12296a1729beba9aef0e8961",
      ),
    ).toBe(true);
  });
});

function readPublicBundle(): unknown {
  return JSON.parse(
    readFileSync("public/torus-migration-claim-proofs.json", "utf8"),
  );
}
