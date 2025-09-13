import { z } from "zod";

export const validateEnvOrExit =
  <S extends Record<string, z.ZodType>>(varSchemas: S) =>
  (env: unknown) => {
    const envSchema = z.object(varSchemas);

    const result = envSchema.safeParse(env);

    if (!result.success) {
      console.error("❌ Invalid environment variables:");
      console.error(z.prettifyError(result.error));
      process.exit(1);
    }

    return result.data;
  };
