import type { Enum } from "rustie";
import { match } from "rustie";
import type { SafeParseReturnType, z } from "zod";

export type Nullish = null | undefined;

export type ListItem<L> = L extends (infer T)[] ? T : never;

// == ADTs ==

// -- Option --

export type Option<T> = { None: null } | { Some: T };

export const flattenOption = <T>(x: Option<T>): T | null => {
  return match(x)({
    None() {
      return null;
    },
    Some(r) {
      return r;
    },
  });
};

// -- Result --

export type Result<T, E> = Enum<{ Ok: T; Err: E }>;

export function flattenResult<T, E>(x: Result<T, E>): T | null {
  return match(x)({
    Ok(r) {
      return r;
    },
    Err() {
      return null;
    },
  });
}

/**
 * Parse a typed value using a Zod schema, instead of accepting any value.
 */
export function parseTyped<Z extends z.ZodType<unknown>>(schema: Z, val: z.input<Z>): z.output<Z> {
  return schema.parse(val);
}

/**
 * SafeParse a typed value using a Zod schema, instead of accepting any value.
 */
export function safeParseTyped<Z extends z.ZodType>(schema: Z, val: z.input<Z>): SafeParseReturnType<z.input<Z>, z.output<Z>> {
  return schema.safeParse(val);
}
