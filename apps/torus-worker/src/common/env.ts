import type { z } from "zod";

export const parseEnvOrExit =
  <O>(envSchema: z.ZodType<O>) =>
  (env: unknown) => {
    const result = envSchema.safeParse(env);

    if (!result.success) {
      console.error("❌ Invalid environment variables:");
      console.error(JSON.stringify(result.error.format(), null, 2));
      process.exit(1);
    }

    return result.data;
  };
