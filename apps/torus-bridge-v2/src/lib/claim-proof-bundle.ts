import { z } from "zod";

export const CLAIM_PROOF_BUNDLE_PATH = "/torus-migration-claim-proofs.json";

const evmAddressSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/)
  .transform((value) => value as `0x${string}`);

const bytes32Schema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{64}$/)
  .transform((value) => value as `0x${string}`);

const decimalStringSchema = z.string().regex(/^\d+(?:\.\d+)?$/);
const integerStringSchema = z.string().regex(/^\d+$/);

const proofDataSchema = z.object({
  index: z.number().int().nonnegative(),
  account: evmAddressSchema,
  amount: decimalStringSchema,
  amountRaw: integerStringSchema,
  leaf: bytes32Schema.optional(),
  proof: z.array(bytes32Schema),
});

const claimProofBundleSchema = z
  .object({
    schema: z.literal("torus-migration-claim-v1"),
    merkleRoot: bytes32Schema,
    totalAllocation: decimalStringSchema,
    totalAllocationRaw: integerStringSchema,
    claimCount: z.number().int().nonnegative(),
    claims: z.array(proofDataSchema),
    deployment: z
      .object({
        address: evmAddressSchema,
        network: z
          .object({
            chainId: z.coerce.number().int().nonnegative(),
          })
          .passthrough(),
      })
      .passthrough(),
  })
  .passthrough()
  .superRefine((bundle, context) => {
    if (bundle.claimCount !== bundle.claims.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `claimCount ${bundle.claimCount} does not match ${bundle.claims.length} claims`,
        path: ["claimCount"],
      });
    }

    const accounts = new Set<string>();
    for (const claim of bundle.claims) {
      const account = normalizeEvmAddress(claim.account);
      if (accounts.has(account)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate claim account ${claim.account}`,
          path: ["claims", claim.index, "account"],
        });
      }
      accounts.add(account);
    }
  });

export type ProofData = z.infer<typeof proofDataSchema>;
export type ClaimProofBundle = z.infer<typeof claimProofBundleSchema>;

const bundleProofIndex = new WeakMap<
  ClaimProofBundle,
  ReadonlyMap<string, ProofData>
>();

export function parseClaimProofBundle(value: unknown): ClaimProofBundle {
  return claimProofBundleSchema.parse(value);
}

export function getProofForAccount(
  bundle: ClaimProofBundle,
  account: `0x${string}`,
): ProofData | null {
  return getProofIndex(bundle).get(normalizeEvmAddress(account)) ?? null;
}

export function isSameEvmAddress(
  left: `0x${string}`,
  right: `0x${string}`,
): boolean {
  return normalizeEvmAddress(left) === normalizeEvmAddress(right);
}

function getProofIndex(
  bundle: ClaimProofBundle,
): ReadonlyMap<string, ProofData> {
  const existing = bundleProofIndex.get(bundle);
  if (existing !== undefined) return existing;

  const index = new Map<string, ProofData>();
  for (const claim of bundle.claims) {
    index.set(normalizeEvmAddress(claim.account), claim);
  }

  bundleProofIndex.set(bundle, index);
  return index;
}

function normalizeEvmAddress(address: `0x${string}`): string {
  return address.toLowerCase();
}
