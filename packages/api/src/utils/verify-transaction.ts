/**
 * Utilities for verifying TORUS token transfer transactions on-chain.
 *
 * Used to verify credit purchases before granting credits.
 */

import type { ApiPromise } from "@polkadot/api";
import type { SS58Address } from "@torus-network/sdk/types";
import { TRPCError } from "@trpc/server";

export interface VerifiedTransfer {
  txHash: string;
  sender: SS58Address;
  recipient: SS58Address;
  amount: bigint;
  blockNumber: number;
  blockHash: string;
}

/**
 * Verifies a TORUS token transfer transaction on-chain.
 *
 * Checks:
 * - Transaction exists in the specified block
 * - Transaction succeeded (ExtrinsicSuccess event)
 * - It's a balances.transfer call
 * - Sender matches expected address
 * - Recipient matches service address
 * - Amount is positive
 *
 * @param wsAPI - Blockchain API connection
 * @param txHash - Transaction hash to verify
 * @param blockHash - Block hash containing the transaction
 * @param expectedSender - Expected sender address (authenticated user)
 * @param serviceAddress - Expected recipient address (prediction app)
 * @returns Verified transaction details
 * @throws TRPCError if verification fails
 */
export async function verifyTorusTransfer(
  wsAPI: Promise<ApiPromise>,
  txHash: string,
  blockHash: string,
  expectedSender: SS58Address,
  serviceAddress: SS58Address,
): Promise<VerifiedTransfer> {
  const api = await wsAPI;

  // Validate hash formats
  if (!txHash.startsWith("0x") || txHash.length !== 66) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid transaction hash format",
    });
  }

  if (!blockHash.startsWith("0x") || blockHash.length !== 66) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid block hash format",
    });
  }

  // Get the block
  const signedBlock = await api.rpc.chain.getBlock(blockHash);
  const blockNumber = signedBlock.block.header.number.toNumber();

  // Get events for this block
  const apiAt = await api.at(signedBlock.block.header.hash);
  const allRecords = await apiAt.query.system.events();

  // Find the extrinsic matching txHash
  let found = false;
  let sender: string | null = null;
  let recipient: string | null = null;
  let amount: bigint | null = null;

  // Debug: log all extrinsic hashes in the block
  console.log(`Searching for txHash: ${txHash}`);
  console.log(`Block has ${signedBlock.block.extrinsics.length} extrinsics:`);
  signedBlock.block.extrinsics.forEach((ext, i) => {
    console.log(
      `  [${i}] ${ext.hash.toHex()} - ${ext.method.section}.${ext.method.method}`,
    );
  });

  signedBlock.block.extrinsics.forEach((extrinsic, index) => {
    const extrinsicHash = extrinsic.hash.toHex();

    if (extrinsicHash !== txHash) return;
    found = true;
    if (extrinsic.method.section !== "balances") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Transaction is not a balance transfer",
      });
    }

    if (
      !["transfer", "transferKeepAlive", "transferAllowDeath"].includes(
        extrinsic.method.method,
      )
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Invalid transfer method: ${extrinsic.method.method}`,
      });
    }

    // Extract transfer details
    sender = extrinsic.signer.toString();
    const [destArg, amountArg] = extrinsic.method.args;

    if (!destArg || !amountArg) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Transfer arguments missing",
      });
    }

    recipient = destArg.toString();
    amount = BigInt(amountArg.toString());

    // Check events to verify success
    const extrinsicEvents = allRecords.filter(
      ({ phase }) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index),
    );

    const success = extrinsicEvents.some(({ event }) =>
      api.events.system.ExtrinsicSuccess.is(event),
    );

    const failed = extrinsicEvents.some(({ event }) =>
      api.events.system.ExtrinsicFailed.is(event),
    );

    if (failed || !success) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Transaction failed on-chain",
      });
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!found) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Transaction not found in specified block",
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (sender === null || recipient === null || amount === null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Transaction data incomplete",
    });
  }

  // Verify sender
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (sender !== expectedSender) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Transaction not sent by authenticated user",
    });
  }

  // Verify recipient
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (recipient !== serviceAddress) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      message: `Transaction not sent to service address (expected: ${serviceAddress}, got: ${recipient})`,
    });
  }

  // Verify amount is positive
  if (amount <= 0n) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Transfer amount must be positive",
    });
  }

  return {
    txHash,
    sender: sender as SS58Address,
    recipient: recipient as SS58Address,
    amount,
    blockNumber,
    blockHash,
  };
}
