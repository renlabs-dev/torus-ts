import {
  encodeTorusEvmWithdrawData,
  TORUS_EVM_WITHDRAW_PRECOMPILE_ADDRESS,
} from "@torus-network/sdk/evm";
import type { SS58Address } from "@torus-network/sdk/types";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";
import { torusEvm } from "~/lib/chain";
import {
  getNativeWithdrawAmount,
  MIN_NATIVE_WITHDRAW_AMOUNT,
} from "~/lib/claim-amounts";
import type {
  Address,
  Hex,
  PublicClient,
  TransactionSerialized,
  TransactionSerializedGeneric,
} from "viem";
import {
  formatEther,
  isAddressEqual,
  isHex,
  numberToHex,
  parseTransaction,
  recoverTransactionAddress,
} from "viem";

const GAS_LIMIT_MARGIN_NUMERATOR = 12n;
const GAS_LIMIT_MARGIN_DENOMINATOR = 10n;

export interface NativeWithdrawTransaction {
  type: "legacy";
  chainId: number;
  from: Address;
  to: Address;
  nonce: number;
  gas: bigint;
  gasPrice: bigint;
  value: bigint;
  data: Hex;
}

export interface NativeWithdrawQuote {
  transaction: NativeWithdrawTransaction;
  destination: SS58Address;
  balance: bigint;
  amount: bigint;
  gasEstimate: bigint;
  maxGasCost: bigint;
}

export type NativeWithdrawPrepareResult =
  | { ok: true; quote: NativeWithdrawQuote }
  | { ok: false; error: string };

export type NativeWithdrawValidationResult =
  | { ok: true; signer: Address }
  | { ok: false; error: string };

function applyGasLimitMargin(gasEstimate: bigint): bigint {
  return (
    (gasEstimate * GAS_LIMIT_MARGIN_NUMERATOR +
      GAS_LIMIT_MARGIN_DENOMINATOR -
      1n) /
    GAS_LIMIT_MARGIN_DENOMINATOR
  );
}

export function getNativeWithdrawGasEstimateValue(
  balance: bigint,
): bigint | undefined {
  const bufferedAmount = getNativeWithdrawAmount(balance);
  if (bufferedAmount <= MIN_NATIVE_WITHDRAW_AMOUNT) {
    return undefined;
  }

  // The withdraw precompile rejects dust values during estimation.
  return MIN_NATIVE_WITHDRAW_AMOUNT + 1n;
}

export function buildNativeWithdrawTransaction({
  from,
  destination,
  balance,
  nonce,
  gasEstimate,
  gasPrice,
}: {
  from: Address;
  destination: SS58Address;
  balance: bigint;
  nonce: number;
  gasEstimate: bigint;
  gasPrice: bigint;
}): NativeWithdrawQuote {
  const data = encodeTorusEvmWithdrawData(destination);
  const gas = applyGasLimitMargin(gasEstimate);
  const maxGasCost = gas * gasPrice;
  const amount = balance > maxGasCost ? balance - maxGasCost : 0n;

  return {
    destination,
    balance,
    amount,
    gasEstimate,
    maxGasCost,
    transaction: {
      type: "legacy",
      chainId: torusEvm.id,
      from,
      to: TORUS_EVM_WITHDRAW_PRECOMPILE_ADDRESS,
      nonce,
      gas,
      gasPrice,
      value: amount,
      data,
    },
  };
}

export async function prepareNativeWithdrawTransaction({
  publicClient,
  from,
  destination,
}: {
  publicClient: PublicClient;
  from: Address;
  destination: SS58Address;
}): Promise<NativeWithdrawPrepareResult> {
  const [dataError, data] = trySync(() =>
    encodeTorusEvmWithdrawData(destination),
  );
  if (dataError !== undefined) {
    return { ok: false, error: "Invalid Torus mainnet key address." };
  }

  const [balanceError, balance] = await tryAsync(
    publicClient.getBalance({ address: from }),
  );
  if (balanceError !== undefined) {
    return {
      ok: false,
      error:
        "Could not read the TorusEVM balance. Check your connection and try again.",
    };
  }

  const [gasPriceError, gasPrice] = await tryAsync(publicClient.getGasPrice());
  if (gasPriceError !== undefined) {
    return {
      ok: false,
      error:
        "Could not read the TorusEVM gas price. Check your connection and try again.",
    };
  }

  const gasEstimateValue = getNativeWithdrawGasEstimateValue(balance);
  if (gasEstimateValue === undefined) {
    return {
      ok: false,
      error: `No withdrawable balance found after gas. TorusEVM balance is ${formatEther(balance)} TORUS.`,
    };
  }

  const [gasEstimateError, gasEstimate] = await tryAsync(
    publicClient.estimateGas({
      account: from,
      to: TORUS_EVM_WITHDRAW_PRECOMPILE_ADDRESS,
      data,
      value: gasEstimateValue,
    }),
  );
  if (gasEstimateError !== undefined) {
    return {
      ok: false,
      error:
        "Could not estimate withdrawal gas. Make sure the EVM address has TORUS on TorusEVM and try again after the claim lands.",
    };
  }

  const [nonceError, nonce] = await tryAsync(
    publicClient.getTransactionCount({
      address: from,
      blockTag: "pending",
    }),
  );
  if (nonceError !== undefined) {
    return {
      ok: false,
      error:
        "Could not read the EVM account nonce. Check your connection and try again.",
    };
  }

  const quote = buildNativeWithdrawTransaction({
    from,
    destination,
    balance,
    nonce,
    gasEstimate,
    gasPrice,
  });

  if (quote.amount <= MIN_NATIVE_WITHDRAW_AMOUNT) {
    return {
      ok: false,
      error: `No withdrawable balance found after gas. TorusEVM balance is ${formatEther(balance)} TORUS.`,
    };
  }

  return { ok: true, quote };
}

export function parseSignedRawTransaction(
  value: string,
): TransactionSerializedGeneric | undefined {
  const trimmed = value.trim();
  if (
    trimmed.length <= 2 ||
    trimmed.length % 2 !== 0 ||
    !isHex(trimmed, { strict: true })
  ) {
    return undefined;
  }

  return trimmed;
}

export async function validateSignedNativeWithdrawTransaction({
  signedTransaction,
  expected,
}: {
  signedTransaction: TransactionSerializedGeneric;
  expected: NativeWithdrawTransaction;
}): Promise<NativeWithdrawValidationResult> {
  const [parseError, parsed] = trySync(() =>
    parseTransaction(signedTransaction),
  );
  if (parseError !== undefined) {
    return { ok: false, error: "Could not parse signed raw transaction." };
  }

  const [recoverError, signer] = await tryAsync(
    recoverTransactionAddress({
      serializedTransaction: signedTransaction as TransactionSerialized,
    }),
  );
  if (recoverError !== undefined) {
    return { ok: false, error: "Could not recover transaction signer." };
  }

  if (!isAddressEqual(signer, expected.from)) {
    return {
      ok: false,
      error: "Signed transaction was not signed by the recipient EVM address.",
    };
  }

  if (parsed.type !== "legacy") {
    return { ok: false, error: "Signed transaction must be legacy type." };
  }

  if (parsed.chainId !== expected.chainId) {
    return { ok: false, error: "Signed transaction has the wrong chain ID." };
  }

  if (
    parsed.to === null ||
    parsed.to === undefined ||
    !isAddressEqual(parsed.to, expected.to)
  ) {
    return {
      ok: false,
      error: "Signed transaction is not addressed to the withdraw precompile.",
    };
  }

  if (!sameHex(parsed.data ?? "0x", expected.data)) {
    return {
      ok: false,
      error: "Signed transaction calldata does not match the mainnet address.",
    };
  }

  if (parsed.nonce !== expected.nonce) {
    return { ok: false, error: "Signed transaction nonce does not match." };
  }

  if (parsed.gas !== expected.gas) {
    return { ok: false, error: "Signed transaction gas limit does not match." };
  }

  if (parsed.gasPrice !== expected.gasPrice) {
    return { ok: false, error: "Signed transaction gas price does not match." };
  }

  if ((parsed.value ?? 0n) !== expected.value) {
    return { ok: false, error: "Signed transaction value does not match." };
  }

  return { ok: true, signer };
}

export function formatUnsignedNativeWithdrawTransaction(
  transaction: NativeWithdrawTransaction,
): string {
  return JSON.stringify(
    {
      type: transaction.type,
      chainId: numberToHex(transaction.chainId),
      nonce: numberToHex(transaction.nonce),
      gas: numberToHex(transaction.gas),
      gasPrice: numberToHex(transaction.gasPrice),
      from: transaction.from,
      to: transaction.to,
      value: numberToHex(transaction.value),
      data: transaction.data,
    },
    null,
    2,
  );
}

function sameHex(left: Hex, right: Hex): boolean {
  return left.toLowerCase() === right.toLowerCase();
}
