import type { z } from "zod";
import { ZodError } from "zod";
import type { Result } from "./result/sync.js";
import { makeErr, makeOk } from "./result/sync.js";

/**
 * Prefixes a path to all issues in a Zod SafeParse result.
 *
 * This helper is useful when parsing nested structures where you want to
 * provide context about where in the data structure a parsing error occurred.
 *
 * @param res - The SafeParse result from a Zod schema
 * @param path - Array of path segments to prefix to error paths
 * @returns The result with prefixed paths on any errors
 *
 * @example
 * ```ts
 * const schema = z.string();
 * const result = schema.safeParse(123);
 * const prefixed = prefixPath(result, ["user", "name"]);
 * // Error path becomes ["user", "name"] instead of []
 * ```
 */
export function prefixPath<T>(
  res: z.ZodSafeParseResult<T>,
  path: (string | number)[],
): z.ZodSafeParseResult<T> {
  if (res.success) return res;
  return {
    success: false as const,
    error: new ZodError(
      res.error.issues.map((iss: any) => ({
        ...iss,
        path: [...path, ...iss.path],
      })),
    ) as z.ZodError<T>,
  };
}

/**
 * Parse a typed value using a Zod schema, instead of accepting any value.
 */
export function parseTyped<S extends z.ZodType>(
  schema: S,
  val: z.input<S>,
): z.output<S> {
  return schema.parse(val);
}

/**
 * SafeParse a typed value using a Zod schema, instead of accepting any value.
 */
export function safeParseTyped<S extends z.ZodType>(
  schema: S,
  val: z.input<S>,
): z.ZodSafeParseResult<z.output<S>> {
  return schema.safeParse(val);
}

/**
 * Creates a curried parser from a Zod schema that returns a functional Result
 * instead of throwing.
 *
 * The returned function calls `schema.safeParse(input, params)` and:
 * - returns `[undefined, parsedValue]` when validation succeeds
 * - returns `[zodError, undefined]` when validation fails
 *
 * The returned function is generic over `Strict extends boolean` to control the
 * accepted input type:
 * - `Strict = true` enforces the schema's inferred input type (`z.input<S>`) at
 *   the call site
 * - `Strict = false` allows a broader input type (`unknown`) like `safeParse`
 * - see {@link parseTyped} and {@link safeParseTyped}
 *
 * @typeParam O - Schema output type (equivalent to `z.output<S>`).
 * @typeParam I - Schema input type (equivalent to `z.input<S>`).
 * @typeParam S - A `z.ZodSchema` that maps `I` to `O`.
 *
 * @param schema - The Zod schema used to validate and parse inputs.
 * @param params - Optional Zod parse parameters forwarded to `safeParse` (e.g.,
 * `errorMap`, `path`).
 *
 * @returns A function `<Strict extends boolean>(input: Strict extends true ?
 * z.input<S> : I) => Result<z.output<S>, z.ZodError<z.input<S>>>`.
 *
 * @example
 * import { z } from 'zod';
 *
 * const userSchema = z.object({ name: z.string() });
 * const parseUser = zodParseResult(userSchema);
 *
 * // Default usage (Strict inferred as false)
 * const res1 = parseUser({ name: 'Ada' });
 *
 * // Enforce strict input typing at the call site
 * const res2 = parseUser<true>({ name: 'Grace' });
 *
 * // res1 and res2 are Result<{ name: string }, z.ZodError<{ name: unknown }>>
 */
export const zodParseResult =
  <S extends z.ZodType>(schema: S, params?: Parameters<S["safeParse"]>[1]) =>
  <Strict extends boolean = false>(
    input: Strict extends true ? z.input<S> : unknown,
  ): Result<z.output<S>, z.ZodError<z.output<S>>> => {
    const parseRes = schema.safeParse(input, params);
    if (parseRes.success) {
      return makeOk(parseRes.data);
    }
    // Note: the error type using `z.output<S>` here is weird, but seems
    // consistent with Zod's internal usage.
    return makeErr<z.ZodError<z.output<S>>>(parseRes.error);
  };
