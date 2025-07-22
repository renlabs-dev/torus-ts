import { Enum } from "@polkadot/types";
import type {
  ParseInput,
  ParseReturnType,
  ProcessedCreateParams,
  RawCreateParams,
  SyncParseReturnType,
  z,
  ZodErrorMap,
  ZodTypeAny,
  ZodTypeDef,
} from "zod";
import {
  addIssueToContext,
  INVALID,
  ZodIssueCode,
  ZodParsedType,
  ZodType,
} from "zod";

export type ZodSubstrateEnumVariants = Record<string, ZodTypeAny>;

export interface ZodSubstrateEnumDef<
  Options extends ZodSubstrateEnumVariants = ZodSubstrateEnumVariants,
> extends ZodTypeDef {
  variants: Options;
  // typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion;
  typeName: "ZodSubstrateEnum";
}

export type MapZodVariantsToRaw<T extends ZodSubstrateEnumVariants> = {
  [K in keyof T]: Record<K, z.output<T[K]>>;
}[keyof T];

export class ZodSubstrateEnum<
  Variants extends ZodSubstrateEnumVariants,
> extends ZodType<
  MapZodVariantsToRaw<Variants>,
  ZodSubstrateEnumDef<Variants>
  // , input<Variants[string]>
> {
  _parse(input: ParseInput): ParseReturnType<this["_output"]> {
    const { ctx } = this._processInputParams(input);

    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType,
      });
      return INVALID;
    }

    if (!(ctx.data instanceof Enum)) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.custom,
        message: "Expected Substrate Enum",
      });
      return INVALID;
    }

    const variant_name = ctx.data.type;

    if (!Object.hasOwn(this.variants, variant_name)) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.custom,
        message: `Invalid variant name '${variant_name}'`,
      });
      return INVALID;
    }

    const variantType = this.variants[variant_name];

    if (!variantType) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.custom,
        message: `Invalid variant name '${variant_name}', valid variants are: ${Object.keys(this.variants).join(", ")}`,
      });
      return INVALID;
    }

    // Wraps the parsed values in object with the variant name
    const handleParseResult = (result: SyncParseReturnType<unknown>) => {
      if (result.status == "aborted") return result;
      const value = { [variant_name]: result.value };
      return { ...result, value };
    };

    const data = ctx.data.inner;
    const path = [...ctx.path, variant_name];
    const parseInput = { data, path, parent: ctx };

    if (ctx.common.async) {
      const parseResult = variantType._parseAsync(parseInput);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
      return parseResult.then(handleParseResult) as any;
    } else {
      const parseResult = variantType._parseSync(parseInput);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
      return handleParseResult(parseResult) as any;
    }
  }

  get variants() {
    return this._def.variants;
  }

  /**
   * The constructor of the discriminated union schema. Its behavior is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create<Types extends ZodSubstrateEnumVariants>(
    this: void,
    variants: Types,
    params?: RawCreateParams,
  ): ZodSubstrateEnum<Types> {
    return new ZodSubstrateEnum<Types>({
      typeName: "ZodSubstrateEnum",
      variants: variants,
      ...processCreateParams(params),
    });
  }
}

function processCreateParams(params: RawCreateParams): ProcessedCreateParams {
  if (!params) return {};
  const { errorMap, invalid_type_error, required_error, description } = params;
  if (errorMap && (invalid_type_error || required_error)) {
    throw new Error(
      `Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`,
    );
  }
  if (errorMap) return { errorMap: errorMap, description };
  const customMap: ZodErrorMap = (iss, ctx) => {
    const { message } = params;

    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type") return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}

export const sb_enum = ZodSubstrateEnum.create;
