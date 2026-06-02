import { tryAsync } from "@torus-network/torus-utils/try-catch";
import type { ProofData } from "~/lib/claim-proof-bundle";
import { CLAIM_EIP712_DOMAIN, CLAIM_EIP712_TYPES } from "~/lib/eip712";
import { z } from "zod";

export interface ClaimTypedDataInput {
  proof: ProofData;
  recipient: `0x${string}`;
  contractAddress: `0x${string}`;
}

export interface RelayClaimRequest {
  index: number;
  account: `0x${string}`;
  recipient: `0x${string}`;
  amountRaw: string;
  proof: `0x${string}`[];
  signature: `0x${string}`;
}

export type RelayClaimSubmission =
  | { ok: true; txHash: `0x${string}` }
  | { ok: false; error: string };

const relayClaimResponseSchema = z.object({
  txHash: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/)
    .transform((value) => value as `0x${string}`),
});

const relayClaimErrorSchema = z
  .object({
    error: z.string(),
    detail: z.string().optional(),
  })
  .passthrough();

const signatureSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{130}$/)
  .transform((value) => value as `0x${string}`);

export function buildClaimTypedData({
  proof,
  recipient,
  contractAddress,
}: ClaimTypedDataInput) {
  return {
    domain: { ...CLAIM_EIP712_DOMAIN, verifyingContract: contractAddress },
    types: CLAIM_EIP712_TYPES,
    primaryType: "Claim" as const,
    message: {
      index: BigInt(proof.index),
      account: proof.account,
      recipient,
      amount: BigInt(proof.amountRaw),
    },
  };
}

export function buildRelayClaimRequest({
  proof,
  recipient,
  signature,
}: {
  proof: ProofData;
  recipient: `0x${string}`;
  signature: `0x${string}`;
}): RelayClaimRequest {
  return {
    index: proof.index,
    account: proof.account,
    recipient,
    amountRaw: proof.amountRaw,
    proof: proof.proof,
    signature,
  };
}

export function parseClaimSignature(value: string): `0x${string}` | undefined {
  const parsed = signatureSchema.safeParse(value.trim());
  return parsed.success ? parsed.data : undefined;
}

export function formatClaimTypedDataForDisplay(
  input: ClaimTypedDataInput,
): string {
  const typedData = buildClaimTypedData(input);
  return JSON.stringify(
    {
      ...typedData,
      domain: {
        ...typedData.domain,
        chainId: typedData.domain.chainId.toString(),
      },
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ],
        ...typedData.types,
      },
      message: {
        ...typedData.message,
        index: typedData.message.index.toString(),
        amount: typedData.message.amount.toString(),
      },
    },
    null,
    2,
  );
}

export async function submitRelayClaimRequest(
  body: RelayClaimRequest,
): Promise<RelayClaimSubmission> {
  const [fetchError, response] = await tryAsync(
    fetch("/api/relay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

  if (fetchError !== undefined) {
    return { ok: false, error: fetchError.message };
  }

  if (!response.ok) {
    return { ok: false, error: await readRelayError(response) };
  }

  const [jsonError, data] = await tryAsync(response.json() as Promise<unknown>);
  if (jsonError !== undefined) {
    return { ok: false, error: "Invalid relay response" };
  }

  const parsed = relayClaimResponseSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: "Invalid relay response" };
  }

  return { ok: true, txHash: parsed.data.txHash };
}

async function readRelayError(response: Response): Promise<string> {
  const [jsonError, data] = await tryAsync(response.json() as Promise<unknown>);
  if (jsonError !== undefined) {
    return `HTTP ${response.status}`;
  }

  const parsed = relayClaimErrorSchema.safeParse(data);
  if (!parsed.success) {
    return `HTTP ${response.status}`;
  }

  return parsed.data.detail ?? parsed.data.error;
}
