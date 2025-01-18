/**
 * This ReactScript is used to validate and set the environment variables in runtime.
 *
 * The envs should be accessed using the `env` function.
 * On the client side, the environment variables are set in the window.__ENV object.
 * On the server side, the environment variables are set in the process.env object.
 *
 */

import type { FC } from "react";

import { env, PublicEnvScript } from "next-runtime-env";
import type { NonceConfig } from "next-runtime-env/build/typings/nonce";
import { unstable_noStore as noStore } from "next/cache";
import type { ZodType, ZodTypeAny } from "zod";
import { z } from "zod";

interface EnvScriptProps {
  nonce?: string | NonceConfig;
}

interface ZodEnvScriptProps extends EnvScriptProps {
  skipValidation?: boolean;
  schema: Record<string, ZodTypeAny>;
}

/**
 * Validates and sets the public environment variables in the browser. If an nonce is
 * available, it will be set on the script tag.
 *
 * This component is disables Next.js' caching mechanism to ensure that the
 * environment variables are always up-to-date.
 */
export const ZodEnvScript: FC<ZodEnvScriptProps> = ({
  nonce,
  skipValidation,
  schema,
}) => {
  noStore();

  if (!skipValidation) {
    const objSchema = z.object(schema);
    const result = objSchema.safeParse(process.env);

    if (!result.success) {
      throw new Error(
        `Failed to validate environment variables: ${result.error.message}`,
      );
    }

    // Note: zod can set default values, for our parsed envs, but they are not
    // being set in the process.env object. The code below would do that.

    // // Setting parsed and default values on process.env
    // for (const [key, value] of Object.entries(envs)) {
    //   process.env[key] = value as string;
    // }
  }

  return <PublicEnvScript nonce={nonce} />;
};

export interface BuildEnvProviderOptions {
  /** Skip validation of environment variables */
  skipValidation?: boolean;
}

/**
 * This function builds
 * - EnvScript: A script that sets the public environment variables in the
 *   browser, using the Zod schemas to parse environment variables.
 * - env: a function that returns the value of an environment variable.
 *
 * @param schema Zod schemas for the environment variables
 * @param opts.skipValidation Skip validation of environment variables
 *
 * Usage: Add the following to your `head` tag in your Layout component.
 * ```ts
 * <head>
 *   <EnvScript />
 * </head>
 * ```
 *
 * Access the environment variables in your components using the `env` function.
 * ```ts
 * const a = env('NEXT_PUBLIC_FAVORITE_COLOR')
 * ```
 */
export function buildZodEnvScript<S extends Record<string, ZodType<unknown>>>(
  schema: S,
  opts?: BuildEnvProviderOptions,
): {
  EnvScript: FC<EnvScriptProps>;
  env: <K extends string & keyof S>(key: K) => z.infer<S[K]>;
} {
  return {
    EnvScript: (props) => (
      <ZodEnvScript
        schema={schema}
        skipValidation={opts?.skipValidation}
        {...props}
      />
    ),
    env: (key) => {
      const val = env(key);
      return opts?.skipValidation ? val : schema[key]!.parse(val);
    },
  };
}
