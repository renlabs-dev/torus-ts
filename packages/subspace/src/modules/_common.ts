import type { ApiPromise } from "@polkadot/api";
import type { ApiDecoration } from "@polkadot/api/types";
import type { Codec } from "@polkadot/types/types";
import type { z, ZodTypeAny } from "zod";

import { assert_error } from "@torus-ts/utils";

export type Api = ApiDecoration<"promise"> | ApiPromise;

export function handleMapValues<K extends Codec, T extends ZodTypeAny>(
  rawEntries: [K, Codec][],
  schema: T,
): [z.output<T>[], Error[]] {
  type Out = z.output<T>;
  const entries: Out[] = [];
  const errors: Error[] = [];
  for (const entry of rawEntries) {
    const [, valueRaw] = entry;
    try {
      var parsed = schema.parse(valueRaw) as Out;
    } catch (err) {
      assert_error(err);
      errors.push(err);
      continue;
    }

    entries.push(parsed);
  }
  entries.reverse();
  return [entries, errors];
}
