import { z } from "zod";

const envSchema = z.object({
  COMMUNITY_VALIDATOR_MNEMONIC: z.string().min(1),
  NEXT_PUBLIC_WS_PROVIDER_URL: z.string().url(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Invalid environment variables:");
  console.error(JSON.stringify(result.error.format(), null, 2));
  process.exit(1);
}

export const env = result.data;
