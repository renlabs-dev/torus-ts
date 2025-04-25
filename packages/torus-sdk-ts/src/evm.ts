import { hexToU8a, stringToU8a } from "@polkadot/util";
import {
  blake2AsU8a,
  decodeAddress,
  encodeAddress,
} from "@polkadot/util-crypto";
import { assert } from "tsafe";
import type { Chain, WalletClient } from "viem";
import { encodeFunctionData } from "viem";
import type { SS58Address } from "./address";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

export { waitForTransactionReceipt } from "@wagmi/core";

const ADDRESS_FORMAT = 42;

/**
 * Converts an Ethereum H160 address to a Substrate SS58 address public key.
 * @param ethAddress - The H160 Ethereum address as a hex string.
 * @return The bytes array containing the Substrate public key.
 */
export function convertH160ToSS58(
  ethAddress: string,
  ss58_format = ADDRESS_FORMAT,
) {
  assert(ethAddress.startsWith("0x"), "EVM address must start with 0x");

  const prefixBytes = stringToU8a("evm:");
  const addressBytes = hexToU8a(ethAddress);

  // Concatenate prefix and Ethereum address
  const combined = new Uint8Array(prefixBytes.length + addressBytes.length);
  combined.set(prefixBytes);
  combined.set(addressBytes, prefixBytes.length);

  // Hash the combined data (the public key)
  const hash = blake2AsU8a(combined);

  // Convert the hash to SS58 format
  const ss58Address = encodeAddress(hash, ss58_format);
  return ss58Address as SS58Address;
}

// == Withdraw ==

// Precompile contract address
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000800";

// BalanceTransfer ABI
const CONTRACT_ABI = [
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "data",
        type: "bytes32",
      },
    ],
    name: "transfer",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const;

export async function withdrawFromTorusEvm(
  walletClient: WalletClient,
  chain: Chain,
  destination: SS58Address,
  value: bigint,
  refetchHandler: () => Promise<void>,
) {
  // Check if wallet client account exists
  if (!walletClient.account) {
    throw new Error("Wallet client account is undefined");
  }

  // Decode the address
  const [decodeError, pubk] = trySync(() => decodeAddress(destination));
  if (decodeError !== undefined) {
    console.error("Error decoding destination address:", decodeError);
    throw decodeError;
  }

  // Convert Uint8Array to hex string with 0x prefix
  const [bufferError, pubkHex] = trySync(
    () => `0x${Buffer.from(pubk).toString("hex")}`,
  );
  if (bufferError !== undefined) {
    console.error("Error converting address to hex:", bufferError);
    throw bufferError;
  }

  // Encode function data
  const [encodeError, data] = trySync(() =>
    encodeFunctionData({
      abi: CONTRACT_ABI,
      functionName: "transfer",
      args: [pubkHex as `0x${string}`],
    }),
  );

  if (encodeError !== undefined) {
    console.error("Error encoding function data:", encodeError);
    throw encodeError;
  }

  // Send transaction using walletClient
  const [txError, txHash] = await tryAsync(
    walletClient.sendTransaction({
      account: walletClient.account,
      to: CONTRACT_ADDRESS,
      data,
      value,
      chain,
    }),
  );

  if (txError !== undefined) {
    console.error("Error sending transaction:", txError);
    throw txError;
  }

  // Refetch data after transaction
  const [refetchError] = await tryAsync(refetchHandler());
  if (refetchError !== undefined) {
    console.error("Error refetching data after transaction:", refetchError);
  }

  return txHash;
}
