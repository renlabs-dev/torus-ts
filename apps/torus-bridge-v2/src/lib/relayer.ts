import { readFileSync } from "fs";
import { join } from "path";
import { env, serverEnv } from "~/env";
import { torusEvm } from "~/lib/chain";
import {
  getProofForAccount,
  isSameEvmAddress,
  parseClaimProofBundle,
} from "~/lib/claim-proof-bundle";
import { torusMigrationClaimAbi } from "~/lib/contract";
import {
  createPublicClient,
  createWalletClient,
  formatEther,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { z } from "zod";

const relayBodySchema = z.object({
  index: z.number().int().nonnegative(),
  account: z.string().regex(/^0x[0-9a-fA-F]{40}$/) as z.ZodType<`0x${string}`>,
  recipient: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/) as z.ZodType<`0x${string}`>,
  amountRaw: z.string().regex(/^\d+$/),
  proof: z.array(z.string().regex(/^0x[0-9a-fA-F]{64}$/)) as z.ZodType<
    `0x${string}`[]
  >,
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/) as z.ZodType<`0x${string}`>,
});

export type RelayBody = z.infer<typeof relayBodySchema>;

export type RelayResult =
  | { ok: true; txHash: `0x${string}` }
  | { ok: false; status: 400 | 409 | 500; error: string; detail?: string };

let _bundleCache: ReturnType<typeof parseClaimProofBundle> | undefined;

function loadBundle() {
  if (_bundleCache !== undefined) return _bundleCache;
  const raw = readFileSync(
    join(process.cwd(), "public", "torus-migration-claim-proofs.json"),
    "utf8",
  );
  _bundleCache = parseClaimProofBundle(JSON.parse(raw) as unknown);
  return _bundleCache;
}

export function parseRelayBody(
  raw: unknown,
): { ok: true; body: RelayBody } | { ok: false; error: string } {
  const result = relayBodySchema.safeParse(raw);
  if (!result.success) {
    return { ok: false, error: result.error.message };
  }
  return { ok: true, body: result.data };
}

export async function submitRelayedClaim(
  body: RelayBody,
): Promise<RelayResult> {
  const contractAddress = env(
    "NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS",
  ) as `0x${string}`;

  // Validate proof server-side against the pinned bundle
  const bundle = loadBundle();

  if (!isSameEvmAddress(bundle.deployment.address, contractAddress)) {
    return {
      ok: false,
      status: 400,
      error: "proof_mismatch",
      detail: "Bundle deployment address does not match contract address",
    };
  }

  const serverProof = getProofForAccount(bundle, body.account);
  if (serverProof === null) {
    return { ok: false, status: 400, error: "not_eligible" };
  }

  if (
    serverProof.index !== body.index ||
    serverProof.amountRaw !== body.amountRaw
  ) {
    return {
      ok: false,
      status: 400,
      error: "proof_mismatch",
      detail: "index or amount does not match bundle",
    };
  }

  const publicClient = createPublicClient({
    chain: torusEvm,
    transport: http(),
  });

  // Check on-chain before submitting
  const alreadyClaimed = await publicClient.readContract({
    address: contractAddress,
    abi: torusMigrationClaimAbi,
    functionName: "isClaimed",
    args: [BigInt(body.index)],
  });

  if (alreadyClaimed) {
    return { ok: false, status: 409, error: "already_claimed" };
  }

  const { RELAYER_PRIVATE_KEY } = serverEnv();

  if (!RELAYER_PRIVATE_KEY) {
    return {
      ok: false,
      status: 500,
      error: "relay_failed",
      detail: "Relayer not configured",
    };
  }

  const relayerAccount = privateKeyToAccount(
    RELAYER_PRIVATE_KEY as `0x${string}`,
  );
  const walletClient = createWalletClient({
    account: relayerAccount,
    chain: torusEvm,
    transport: http(),
  });

  const txHash = await walletClient.writeContract({
    address: contractAddress,
    abi: torusMigrationClaimAbi,
    functionName: "claimTo",
    args: [
      BigInt(body.index),
      body.account,
      body.recipient,
      BigInt(body.amountRaw),
      body.proof,
      body.signature,
    ],
  });

  return { ok: true, txHash };
}

const LOW_BALANCE_THRESHOLD = 1_000_000_000_000_000_000n; // 1 TORUS

export async function getRelayerStatus() {
  const { RELAYER_PRIVATE_KEY } = serverEnv();

  if (!RELAYER_PRIVATE_KEY) {
    return {
      configured: false,
      address: null,
      balance: null,
      balanceFormatted: null,
      estimatedClaimsRemaining: null,
      lowBalance: false,
    };
  }

  const relayerAccount = privateKeyToAccount(
    RELAYER_PRIVATE_KEY as `0x${string}`,
  );
  const publicClient = createPublicClient({
    chain: torusEvm,
    transport: http(),
  });

  const balance = await publicClient.getBalance({
    address: relayerAccount.address,
  });

  // ~0.005 TORUS per claim (5_000_000_000_000_000 wei)
  const costPerClaim = 5_000_000_000_000_000n;
  const estimatedClaimsRemaining =
    balance > 0n ? Number(balance / costPerClaim) : 0;

  return {
    configured: true,
    address: relayerAccount.address,
    balance: balance.toString(),
    balanceFormatted: formatEther(balance),
    estimatedClaimsRemaining,
    lowBalance: balance < LOW_BALANCE_THRESHOLD,
  };
}
