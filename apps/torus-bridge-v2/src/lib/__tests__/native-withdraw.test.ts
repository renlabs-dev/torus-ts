import { encodeAddress } from "@polkadot/util-crypto";
import type { SS58Address } from "@torus-network/sdk/types";
import { privateKeyToAccount } from "viem/accounts";
import { describe, expect, it } from "vitest";
import {
  buildNativeWithdrawTransaction,
  formatUnsignedNativeWithdrawTransaction,
  parseSignedRawTransaction,
  validateSignedNativeWithdrawTransaction,
} from "../native-withdraw";

const account = privateKeyToAccount(`0x${"11".repeat(32)}`);

function testAddress(byte: number): SS58Address {
  return encodeAddress(new Uint8Array(32).fill(byte), 42) as SS58Address;
}

function signableTransaction(
  quote: ReturnType<typeof buildNativeWithdrawTransaction>,
) {
  return {
    type: quote.transaction.type,
    chainId: quote.transaction.chainId,
    nonce: quote.transaction.nonce,
    gas: quote.transaction.gas,
    gasPrice: quote.transaction.gasPrice,
    to: quote.transaction.to,
    value: quote.transaction.value,
    data: quote.transaction.data,
  } as const;
}

describe("native withdraw raw transactions", () => {
  it("builds a legacy withdraw transaction with gas-aware value", () => {
    const quote = buildNativeWithdrawTransaction({
      from: account.address,
      destination: testAddress(1),
      balance: 1_000n,
      nonce: 7,
      gasEstimate: 100n,
      gasPrice: 2n,
    });

    expect(quote.transaction.type).toBe("legacy");
    expect(quote.transaction.chainId).toBe(21_000);
    expect(quote.transaction.to).toBe(
      "0x0000000000000000000000000000000000000800",
    );
    expect(quote.transaction.gas).toBe(120n);
    expect(quote.maxGasCost).toBe(240n);
    expect(quote.amount).toBe(760n);
    expect(quote.transaction.value).toBe(760n);
    expect(quote.transaction.data.startsWith("0xcd6f4eb1")).toBe(true);
  });

  it("formats the exact unsigned transaction as hex quantity JSON", () => {
    const quote = buildNativeWithdrawTransaction({
      from: account.address,
      destination: testAddress(2),
      balance: 1_000n,
      nonce: 7,
      gasEstimate: 100n,
      gasPrice: 2n,
    });

    const formatted = JSON.parse(
      formatUnsignedNativeWithdrawTransaction(quote.transaction),
    ) as Record<string, string>;

    expect(formatted.chainId).toBe("0x5208");
    expect(formatted.nonce).toBe("0x7");
    expect(formatted.gas).toBe("0x78");
    expect(formatted.gasPrice).toBe("0x2");
    expect(formatted.from).toBe(account.address);
    expect(formatted.value).toBe("0x2f8");
  });

  it("accepts a signed transaction that matches the prepared withdraw", async () => {
    const quote = buildNativeWithdrawTransaction({
      from: account.address,
      destination: testAddress(3),
      balance: 1_000_000_000_000_000_000n,
      nonce: 0,
      gasEstimate: 100_000n,
      gasPrice: 1_000_000n,
    });
    const signedTransaction = await account.signTransaction(
      signableTransaction(quote),
    );

    const result = await validateSignedNativeWithdrawTransaction({
      signedTransaction,
      expected: quote.transaction,
    });

    expect(result).toEqual({ ok: true, signer: account.address });
  });

  it("rejects a signed transaction for a different mainnet destination", async () => {
    const quote = buildNativeWithdrawTransaction({
      from: account.address,
      destination: testAddress(4),
      balance: 1_000_000_000_000_000_000n,
      nonce: 0,
      gasEstimate: 100_000n,
      gasPrice: 1_000_000n,
    });
    const otherQuote = buildNativeWithdrawTransaction({
      from: account.address,
      destination: testAddress(5),
      balance: 1_000_000_000_000_000_000n,
      nonce: 0,
      gasEstimate: 100_000n,
      gasPrice: 1_000_000n,
    });
    const signedTransaction = await account.signTransaction(
      signableTransaction(quote),
    );

    const result = await validateSignedNativeWithdrawTransaction({
      signedTransaction,
      expected: otherQuote.transaction,
    });

    expect(result).toEqual({
      ok: false,
      error: "Signed transaction calldata does not match the mainnet address.",
    });
  });

  it("parses signed raw transaction input only when it is even-length hex", () => {
    expect(parseSignedRawTransaction(" 0x1234 ")).toBe("0x1234");
    expect(parseSignedRawTransaction("0x123")).toBeUndefined();
    expect(parseSignedRawTransaction("not hex")).toBeUndefined();
  });
});
