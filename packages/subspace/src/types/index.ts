import type { ZodRawShape, ZodType, ZodTypeAny } from "zod";
import {
  BTreeSet,
  Bytes,
  Enum,
  GenericAccountId,
  Null,
  Option as polkadot_Option,
  Struct,
  UInt,
} from "@polkadot/types";
import { AnyJson, Codec } from "@polkadot/types/types";
import { match } from "rustie";
import { z } from "zod";

import type { Option } from "@torus-ts/utils";

import { SS58_SCHEMA } from "../address";

export { sb_enum } from "./sb_enum";

// == Zod ==

export declare type ZodRawCreateParams =
  | {
      // errorMap?: ZodErrorMap;
      invalid_type_error?: string;
      required_error?: string;
      message?: string;
      description?: string;
    }
  | undefined;

/**
 * Similar to `z.object()` but accepts `Map`.
 */
export const z_map = <T extends ZodRawShape>(
  shape: T,
  params?: ZodRawCreateParams,
) =>
  z
    .custom<Map<unknown, unknown>>((data) => data instanceof Map, "not a Map")
    .transform((map, ctx) => {
      const obj: Record<string | number | symbol, unknown> = {};
      for (const [key, value] of map.entries()) {
        if (
          typeof key !== "string" &&
          typeof key !== "number" &&
          typeof key !== "symbol"
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Map key must be a string, number, or symbol. Received ${typeof key}`,
          });
          continue;
        }
        obj[key] = value;
      }
      return obj;
    })
    .pipe(z.object(shape, params));

// == Default toPrimitive Conversion ==

interface ToPrimitive {
  toPrimitive(disableAscii?: boolean): AnyJson;
}

export const sb_to_primitive = z.unknown().transform<AnyJson>((val, ctx) => {
  if (!(typeof val === "object" && val !== null)) {
    ctx.addIssue({
      code: z.ZodIssueCode.invalid_type,
      expected: "object",
      received: typeof val,
    });
    return z.NEVER;
  }
  if (!("toPrimitive" in val && typeof val.toPrimitive === "function")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "toPrimitive not present, it's not a Codec",
    });
    return z.NEVER;
  }
  return (val as ToPrimitive).toPrimitive();
});

// == Struct ==

export const Struct_schema = z.custom<Struct>(
  (val) => val instanceof Struct,
  "not a substrate Struct",
);

export const sb_struct = <T extends ZodRawShape>(
  shape: T,
  params?: ZodRawCreateParams,
) => Struct_schema.pipe(z_map(shape, params));

// == Null ==

export const Null_schema = z.custom<Null>(
  (val) => val instanceof Null,
  "not a substrate Null",
);

export const sb_null = Null_schema.transform((val) => val.toPrimitive());

// == Option ==

export const Option_schema = z.custom<polkadot_Option<Codec>>(
  (val) => val instanceof polkadot_Option,
  "not a substrate Option",
);

export const sb_option = <T extends ZodTypeAny>(
  inner: T,
): ZodType<Option<z.output<T>>, z.ZodTypeDef, polkadot_Option<Codec>> =>
  Option_schema.transform((val, ctx): Option<z.output<T>> => {
    type Out = z.output<T>;
    if (val.isNone) {
      const none: Option<Out> = { None: null };
      return none;
    } else if (val.isSome) {
      const result = inner.safeParse(val.unwrap());
      if (!result.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Error in Option inner value: ${result.error.message}`,
          path: [...ctx.path, "Some"],
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

export const sb_some = <T extends ZodTypeAny>(
  inner: T,
): ZodType<z.output<T>, z.ZodTypeDef, polkadot_Option<Codec>> =>
  sb_option<T>(inner).transform(
    (val, ctx): z.output<T> =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      match(val)({
        None: () => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Expected Some`,
            path: [...ctx.path, "Some"],
          });
          return z.NEVER;
        },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        Some: (value) => value,
      }),
  );

// == Numbers ==

export const UInt_schema = z.custom<UInt>(
  (val) => val instanceof UInt,
  "not a substrate UInt",
);

export const sb_bigint = UInt_schema.transform((val) =>
  BigInt(val.toPrimitive()),
);

export const sb_number = UInt_schema.transform((val, ctx): number => {
  const num = val.toPrimitive();
  if (typeof num !== "number") {
    ctx.addIssue({
      code: z.ZodIssueCode.invalid_type,
      expected: "number",
      received: typeof num,
    });
    return z.NEVER;
  }
  return num;
});

// == String ==

export const Bytes_schema = z.custom<Bytes>(
  (val) => val instanceof Bytes,
  "not a substrate Bytes",
);

export const sb_string = Bytes_schema.transform<string>((val, ctx) => {
  if (!val.isUtf8) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Bytes is not valid UTF8`,
    });
    return z.NEVER;
  }
  return val.toUtf8();
});

// == Enum ==

export const Enum_schema = z.custom<Enum>(
  (val) => val instanceof Enum,
  "not an substrate Enum",
);

export const sb_basic_enum = (
  variants: [string, ...string[]],
  params: ZodRawCreateParams = {},
) =>
  Enum_schema.transform((val, ctx) => {
    if (!val.isBasic) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Enum is not basic (no values)`,
      });
    }
    return val.type;
  }).pipe(z.enum(variants, params));

// == Address ==

export const GenericAccountId_schema = z.custom<GenericAccountId>(
  (val) => val instanceof GenericAccountId,
  "not a substrate BaseAccountId",
);

export const sb_address = GenericAccountId_schema.transform((val) =>
  val.toString(),
).pipe(SS58_SCHEMA);

// == Collections ==

export const BTreeSet_schema = z.custom<BTreeSet>(
  (val) => val instanceof BTreeSet,
);

export const sb_array = <T, S extends ZodType<T, z.ZodTypeDef, unknown>>(
  inner: S,
): z.ZodType<z.output<S>[], z.ZodTypeDef, unknown> =>
  z
    .custom<unknown[] | Set<unknown> | BTreeSet>((val: unknown) => {
      if (Array.isArray(val)) {
        return true;
      }
      if (val instanceof Set) {
        return true;
      }
      if (val instanceof BTreeSet) {
        return true;
      }
      return false;
    })
    .transform((val, ctx): T[] => {
      const xs: T[] = [];
      val.forEach((v, i) => {
        const result = inner.safeParse(v);
        if (!result.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            message: `Error in array element ${i}: ${result.error.message}`,
          });
          return;
        }
        xs.push(result.data);
      });
      return xs;
    });
