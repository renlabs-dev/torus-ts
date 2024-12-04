import type { ApiPromise } from "@polkadot/api";
import type { ApiDecoration } from "@polkadot/api/types";
import type { StorageKey } from "@polkadot/types";
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

  return [entries, errors];
}

export function handleMapEntries<K extends ZodTypeAny, V extends ZodTypeAny>(
  rawEntries: [StorageKey<[Codec]>, Codec][],
  keySchema: K,
  valueSchema: V,
): [Map<z.output<K>, z.output<V>>, Error[]] {
  type KeyOut = z.output<K>;
  type ValOut = z.output<V>;
  const entries = new Map<KeyOut, ValOut>();
  const errors: Error[] = [];
  for (const entry of rawEntries) {
    const [keysRaw, valueRaw] = entry;
    const [key1Raw] = keysRaw.args;
    try {
      var parsedKey = keySchema.parse(key1Raw) as KeyOut;
    } catch (err) {
      assert_error(err);
      errors.push(err);
      continue;
    }
    try {
      var parsedVal = valueSchema.parse(valueRaw) as ValOut;
    } catch (err) {
      assert_error(err);
      errors.push(err);
      continue;
    }

    entries.set(parsedKey, parsedVal);
  }
  return [entries, errors];
}
