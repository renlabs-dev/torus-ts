import { Text } from "@polkadot/types";
import { z } from "zod";
import { Bytes_schema } from "./bytes.js";

// ==== String/Text Parsing ====

export const Text_schema = z.custom<Text>(
  (val) => val instanceof Text,
  "not a substrate Text",
);

/**
 * Parser that converts Substrate `Text` or UTF-8 `Bytes` to JavaScript `string`.
 *
 * @example
 * ```ts
 * const result = sb_string.parse(substrateText); // "hello world"
 * ```
 */
export const sb_string = Text_schema.or(Bytes_schema).transform<string>(
  (val, ctx) => {
    if (val instanceof Text) {
      return val.toString();
    }
    if (!val.isUtf8) {
      ctx.addIssue({
        code: "custom",
        message: `Bytes is not valid UTF8`,
      });
      return z.NEVER;
    }
    return val.toUtf8();
  },
);
