/**
 * This ReactScript is used to validate and set the environment variables in runtime.
 * 
 * The envs should be accessed using the `env` function.
 * On the client side, the environment variables are set in the window.__ENV object.
 * On the server side, the environment variables are set in the process.env object.
 * 
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { z } from "zod";
import { PublicEnvScript, env } from "next-runtime-env"
import { unstable_noStore as noStore } from "next/cache";
import type { NonceConfig } from "next-runtime-env/build/typings/nonce";
import type { FC } from "react";

interface EnvScriptProps {
  nonce?: string | NonceConfig;
}

interface ZodEnvScriptProps extends EnvScriptProps {
  skipValidation?: boolean;
  schema: z.ZodObject<any, any>;
}

/**
 * Validates and sets the public environment variables in the browser. If an nonce is
 * available, it will be set on the script tag.
 *
 * This component is disables Next.js' caching mechanism to ensure that the
 * environment variables are always up-to-date.
 */
export const ZodEnvScript: FC<ZodEnvScriptProps> = ({ nonce, skipValidation, schema }) => {
  noStore();
  if (!skipValidation) {
    const envs = schema.parse(process.env);
    // setting default values and transformations, if any
    for (const [key, value] of Object.entries(envs)) {
      // if zod schema has a default value, process.env[key] will be set to that value
      process.env[key] = value as string;
    }
  }


  return <PublicEnvScript nonce={nonce} />
};


export interface BuildEnvProviderOptions {
  skipValidation?: boolean;
}

/**
 * This function builds 
 * - EnvProvider: an environment provider that uses Zod to validate and transform environment variables.
 * - env: a function that returns the value of an environment variable.
 *
 * @param schema Zod schema for the environment variables
 * @param opts 
 * @param opts.skipValidation Skip validation of environment variables
 * @returns \{ EnvScript: FC<EnvScriptProps>, env: (key: string) => T[keyof T] }
 * 
 * Usage:
 * Add the following to your `head` tag in your Layout component.
 * ```ts
 * <head>
 *   <EnvScript />
 * </head>
 * ```
 * 
 * Access the environment variables in your components using the `env` function.
 * ```ts
 * const a = env('NEXT_PUBLIC_FAVOURITE_COLOR')
 * ```
 */
export function buildZodEnvScript<Z extends z.ZodObject<any, any>, T = z.infer<Z>>(schema: Z, opts: BuildEnvProviderOptions): {
  EnvScript: FC<EnvScriptProps>;
  env: (key: keyof z.infer<typeof schema>) => T[keyof T];
} {
  return {
    EnvScript: (props) => <ZodEnvScript schema={schema} skipValidation={opts?.skipValidation} {...props} />,
    env: (key) => env(key as string) as T[keyof T]
  }
}
