import type { ProofData } from "~/lib/claim-proof-bundle";
import {
  buildClaimTypedData,
  buildRelayClaimRequest,
  formatClaimTypedDataForDisplay,
  parseClaimSignature,
} from "~/lib/relay-claim";
import { describe, expect, it } from "vitest";

const proof: ProofData = {
  index: 7,
  account: "0x1111111111111111111111111111111111111111",
  amount: "12.5",
  amountRaw: "12500000000000000000",
  proof: [`0x${"a".repeat(64)}`],
};

const recipient = "0x2222222222222222222222222222222222222222";
const contractAddress = "0x3333333333333333333333333333333333333333";

describe("relay claim helpers", () => {
  it("builds the EIP-712 claim typed data", () => {
    const typedData = buildClaimTypedData({
      proof,
      recipient,
      contractAddress,
    });

    expect(typedData.domain).toEqual({
      name: "TorusMigrationClaim",
      version: "1",
      chainId: 21000n,
      verifyingContract: contractAddress,
    });
    expect(typedData.primaryType).toBe("Claim");
    expect(typedData.message).toEqual({
      index: 7n,
      account: proof.account,
      recipient,
      amount: 12500000000000000000n,
    });
  });

  it("formats typed data as JSON-safe eth_signTypedData_v4 input", () => {
    const display = JSON.parse(
      formatClaimTypedDataForDisplay({
        proof,
        recipient,
        contractAddress,
      }),
    ) as {
      domain: { chainId: string; verifyingContract: string };
      types: { EIP712Domain: unknown; Claim: unknown };
      message: { index: string; amount: string };
    };

    expect(display.domain.chainId).toBe("21000");
    expect(display.domain.verifyingContract).toBe(contractAddress);
    expect(display.types.EIP712Domain).toBeDefined();
    expect(display.types.Claim).toBeDefined();
    expect(display.message.index).toBe("7");
    expect(display.message.amount).toBe("12500000000000000000");
  });

  it("builds the relay request from the same proof and signature", () => {
    const signature: `0x${string}` = `0x${"b".repeat(130)}`;

    expect(
      buildRelayClaimRequest({
        proof,
        recipient,
        signature,
      }),
    ).toEqual({
      index: proof.index,
      account: proof.account,
      recipient,
      amountRaw: proof.amountRaw,
      proof: proof.proof,
      signature,
    });
  });

  it("accepts only 65-byte hex signatures", () => {
    const signature = `0x${"b".repeat(130)}`;

    expect(parseClaimSignature(signature)).toBe(signature);
    expect(parseClaimSignature(`0x${"b".repeat(128)}`)).toBeUndefined();
    expect(parseClaimSignature("not-a-signature")).toBeUndefined();
  });
});
