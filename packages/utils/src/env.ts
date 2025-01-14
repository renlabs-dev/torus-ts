import { z } from "zod";

export const validateEnvOrExit =
  (varSchemas: Record<string, z.ZodType>) => (env: unknown) => {
    const envSchema = z.object(varSchemas);

    const result = envSchema.safeParse(env);

    if (!result.success) {
      console.error("❌ Invalid environment variables:");
      console.error(JSON.stringify(result.error.format(), null, 2));
      process.exit(1);
    }

    return result.data;
  };
