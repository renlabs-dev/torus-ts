import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_WALLET_CONNECT_ID: z.string().default(""),
  NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/, "Must be a valid EVM address"),
});

type EnvVars = z.infer<typeof envSchema>;

let _cache: EnvVars | undefined;

function getEnv(): EnvVars {
  if (_cache !== undefined) return _cache;

  const result = envSchema.safeParse({
    NEXT_PUBLIC_WALLET_CONNECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID,
    NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS:
      process.env.NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS,
  });

  if (!result.success) {
    throw new Error(
      `Invalid environment variables:\n${JSON.stringify(result.error.format(), null, 2)}`,
    );
  }

  _cache = result.data;
  return _cache;
}

export function env<K extends keyof EnvVars>(key: K): EnvVars[K] {
  return getEnv()[key];
}
