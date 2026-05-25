import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_TORUS_CACHE_URL: z.string().default(""),
  NEXT_PUBLIC_TORUS_CHAIN_ENV: z.string().default("mainnet"),
  NEXT_PUBLIC_TORUS_RPC_URL: z.string().default(""),
  NEXT_PUBLIC_WALLET_CONNECT_ID: z.string().default(""),
  NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/, "Must be a valid EVM address"),
});

const serverEnvSchema = z.object({
  RELAYER_PRIVATE_KEY: z.preprocess(
    (v) => {
      if (v === "" || v === undefined || v === null) return undefined;
      if (typeof v !== "string") return v;
      return v.startsWith("0x") ? v : `0x${v}`;
    },
    z
      .string()
      .regex(/^0x[0-9a-fA-F]{64}$/, "Must be a 64-char hex private key")
      .optional(),
  ),
});

type ClientEnvVars = z.infer<typeof clientEnvSchema>;

let _clientCache: ClientEnvVars | undefined;

function getClientEnv(): ClientEnvVars {
  if (_clientCache !== undefined) return _clientCache;

  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_TORUS_RPC_URL: process.env.NEXT_PUBLIC_TORUS_RPC_URL,
    NEXT_PUBLIC_TORUS_CACHE_URL: process.env.NEXT_PUBLIC_TORUS_CACHE_URL,
    NEXT_PUBLIC_TORUS_CHAIN_ENV: process.env.NEXT_PUBLIC_TORUS_CHAIN_ENV,
    NEXT_PUBLIC_WALLET_CONNECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID,
    NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS:
      process.env.NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS,
  });

  if (!result.success) {
    throw new Error(
      `Invalid environment variables:\n${JSON.stringify(result.error.format(), null, 2)}`,
    );
  }

  _clientCache = result.data;
  return _clientCache;
}

export function env<K extends keyof ClientEnvVars>(key: K): ClientEnvVars[K] {
  return getClientEnv()[key];
}

export function serverEnv() {
  const result = serverEnvSchema.safeParse({
    RELAYER_PRIVATE_KEY: process.env.RELAYER_PRIVATE_KEY,
  });

  if (!result.success) {
    throw new Error(
      `Invalid server environment variables:\n${JSON.stringify(result.error.format(), null, 2)}`,
    );
  }

  return result.data;
}

export function validateEnv(): void {
  getClientEnv();
}
