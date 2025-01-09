import { assert } from "tsafe";
import type { AbiFunction, Chain, WalletClient } from "viem";
import { encodeAbiParameters } from "viem";

import { hexToU8a, stringToU8a } from "@polkadot/util";
import {
  blake2AsU8a,
  decodeAddress,
  encodeAddress,
} from "@polkadot/util-crypto";

import type { SS58Address } from "./address";

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
const balance_transfer_abi: AbiFunction = {
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
};

export async function withdrawFromTorusEvm(
  walletClient: WalletClient,
  chain: Chain,
  destination: SS58Address,
  value: bigint,
) {
  if (!walletClient.account) {
    throw new Error("Wallet client account is undefined");
  }
  console.log("shadowheart");
  const pubk = decodeAddress(destination);
  const pubk_hex = Buffer.from(pubk).toString("hex").padStart(64, "0");
  // console.debug(`pubk_hex = ${pubk_hex}`);

  // Prepare transaction data
  const encodedData = encodeAbiParameters(balance_transfer_abi.inputs, [
    `0x${pubk_hex}`,
  ]);

  // Send transaction using walletClient
  const txHash = await walletClient.sendTransaction({
    account: walletClient.account,
    to: CONTRACT_ADDRESS,
    data: encodedData,
    value,
    chain,
  });

  return txHash;
}
