import { z } from "zod";

/**
 * @deprecated Use `validateEnvOrExit` from `@torus-network/torus-utils/env`
 * instead.
 *
 * This function is deprecated in favor of `validateEnvOrExit` which
 * provides the same functionality with a more consistent API for object
 * schemas.
 */
export const parseEnvOrExit =
  <Out>(envSchema: z.ZodType<Out>) =>
  (env: unknown): Out => {
    const result = envSchema.safeParse(env);

    if (!result.success) {
      console.error("❌ Invalid environment variables:");
      console.error(z.prettifyError(result.error));
      process.exit(1);
    }

    return result.data;
  };
