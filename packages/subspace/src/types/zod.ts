// TODO: split `zod.ts` into multiple files

import type { AnyJson, Codec } from "@polkadot/types/types";
import type { ZodRawShape, ZodType, ZodTypeAny, ZodTypeDef } from "zod";
import {
  bool,
  BTreeSet,
  Bytes,
  Enum,
  GenericAccountId,
  Null,
  Option as polkadot_Option,
  Struct,
} from "@polkadot/types";
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

export interface ToPrimitive {
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

export const sb_option_default = <
  T extends ZodType<unknown, ZodTypeDef, unknown>,
>(
  inner: T,
  defaultValue: z.output<T>,
): ZodType<z.output<T>, z.ZodTypeDef, polkadot_Option<Codec>> =>
  sb_option<T>(inner).transform((val, _ctx) => {
    const r = match(val)({
      Some: (value) => value,
      None: () => defaultValue,
    });
    return r;
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

// == Boolean ==

export const bool_schema = z.custom<bool>((val) => val instanceof bool);

export const sb_bool = bool_schema.transform((val) => val.toPrimitive());

// == Numbers ==

export interface ToBigInt {
  toBigInt(): bigint;
}

export const ToBigInt_schema = z.unknown().transform<ToBigInt>((val, ctx) => {
  if (!(typeof val === "object" && val !== null)) {
    ctx.addIssue({
      code: z.ZodIssueCode.invalid_type,
      expected: "object",
      received: typeof val,
    });
    return z.NEVER;
  }
  if (!("toBigInt" in val && typeof val.toBigInt === "function")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "toBigInt not present, it's not a Codec conversible to BigInt",
    });
    return z.NEVER;
  }
  return val as ToBigInt;
});

export const sb_bigint = ToBigInt_schema.transform((val) => val.toBigInt());

export const sb_number = ToBigInt_schema.transform((val, ctx): number => {
  const num = val.toBigInt();
  const result = Number(num);
  if (!Number.isSafeInteger(result)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Expected a safe Number integer, got ${num}`,
    });
    return z.NEVER;
  }
  return result;
});

export const sb_number_int = sb_number.pipe(z.number().int());

export const sb_percent = sb_number_int.transform((val, ctx) => {
  if (val < 0 || val > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Percent must be between 0 and 100`,
    });
  }
  return val;
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

export const sb_basic_enum = <
  U extends string,
  T extends Readonly<[U, ...U[]]>,
>(
  variants: T,
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
