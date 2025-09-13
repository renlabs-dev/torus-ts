import { Option as polkadot_Option } from "@polkadot/types";
import type { Codec } from "@polkadot/types/types";
import type { Option } from "@torus-network/torus-utils";
import { match } from "rustie";
import type { ZodType } from "zod";
import { z } from "zod";

// ==== Option ====

/**
 * Schema validator for Substrate `Option` types.
 */
export const Option_schema = z.custom<polkadot_Option<Codec>>(
  (val) => val instanceof polkadot_Option,
  "not a substrate Option",
);

/**
 * Parser for Substrate `Option` types to Rust-like `{Some: T} | {None: null}` format.
 */
export const sb_option = <T extends ZodType>(
  inner: T,
): ZodType<Option<z.output<T>>, polkadot_Option<Codec>> =>
  Option_schema.transform((val, ctx): Option<z.output<T>> => {
    type Out = z.output<T>;
    if (val.isNone) {
      const none: Option<Out> = { None: null };
      return none;
    } else if (val.isSome) {
      const result = inner.safeParse(val.unwrap());
      if (!result.success) {
        ctx.addIssue({
          code: "custom",
          message: `Error in Option inner value: ${result.error.message}`,
          path: ["Some"],
        });
        return z.NEVER;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const value: Out = result.data;
      const some: Option<Out> = { Some: value };
      return some;
    }
    throw new Error("Invalid Option");
  });

// ---- Option with fallback to default value ----

/**
 * Parser for Substrate `Option` types with fallback to default value when `None`.
 */
export const sb_option_default = <T extends ZodType>(
  inner: T,
  defaultValue: z.output<T>,
): ZodType<z.output<T>, polkadot_Option<Codec>> =>
  sb_option<T>(inner).transform((val, _ctx) => {
    const r = match(val)({
      Some: (value) => value,
      None: () => defaultValue,
    });
    return r;
  });

// --- Option forcing Some variant ---

/**
 * Parser that requires Substrate `Option` to be `Some`, failing if `None`.
 */
export const sb_some = <T extends ZodType>(
  inner: T,
): ZodType<z.output<T>, polkadot_Option<Codec>> =>
  sb_option<T>(inner).transform(
    (val, ctx): z.output<T> =>
      match(val)({
        None: () => {
          ctx.addIssue({
            code: "custom",
            message: `Expected Some`,
            path: ["Some"],
          });
          return z.NEVER;
        },
        Some: (value) => value,
      }),
  );
