import type { SafeParseReturnType, z } from "zod";

/**
 * Parse a typed value using a Zod schema, instead of accepting any value.
 */
export function parseTyped<Z extends z.ZodType<unknown>>(
  schema: Z,
  val: z.input<Z>,
): z.output<Z> {
  return schema.parse(val);
}

/**
 * SafeParse a typed value using a Zod schema, instead of accepting any value.
 */
export function safeParseTyped<Z extends z.ZodType>(
  schema: Z,
  val: z.input<Z>,
): SafeParseReturnType<z.input<Z>, z.output<Z>> {
  return schema.safeParse(val);
}
