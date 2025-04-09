import type { ApiPromise } from "@polkadot/api";
import type { ApiDecoration } from "@polkadot/api/types";
import type { StorageKey } from "@polkadot/types";
import type { Codec } from "@polkadot/types/types";
import { assert_error } from "@torus-network/torus-utils";
import type { z, ZodTypeAny } from "zod";

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
    let parsed: Out;
    try {
      parsed = schema.parse(valueRaw) as Out;
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
    let parsedKey: KeyOut;
    try {
      parsedKey = keySchema.parse(key1Raw) as KeyOut;
    } catch (err) {
      assert_error(err);
      errors.push(err);
      continue;
    }
    let parsedVal: ValOut;
    try {
      parsedVal = valueSchema.parse(valueRaw) as ValOut;
    } catch (err) {
      assert_error(err);
      errors.push(err);
      continue;
    }

    entries.set(parsedKey, parsedVal);
  }
  return [entries, errors];
}

export function handleDoubleMapEntries<
  K1 extends ZodTypeAny,
  K2 extends ZodTypeAny,
  V extends ZodTypeAny,
>(
  rawEntries: [StorageKey<[Codec, Codec]>, Codec][],
  key1Schema: K1,
  key2Schema: K2,
  valueSchema: V,
): [Map<z.output<K1>, Map<z.output<K2>, z.output<V>>>, Error[]] {
  type Key1Out = z.output<K1>;
  type Key2Out = z.output<K2>;
  type ValOut = z.output<V>;
  const entries = new Map<Key1Out, Map<Key2Out, ValOut>>();
  const errors: Error[] = [];
  for (const entry of rawEntries) {
    const [keysRaw, valueRaw] = entry;
    const [key1Raw, key2Raw] = keysRaw.args;
    let parsedKey1: Key1Out;
    let parsedKey2: Key2Out;
    let parsedVal: ValOut;
    try {
      parsedKey1 = key1Schema.parse(key1Raw) as Key1Out;
    } catch (err) {
      assert_error(err);
      errors.push(err);
      continue;
    }
    try {
      parsedKey2 = key2Schema.parse(key2Raw) as Key2Out;
    } catch (err) {
      assert_error(err);
      errors.push(err);
      continue;
    }
    try {
      parsedVal = valueSchema.parse(valueRaw) as ValOut;
    } catch (err) {
      assert_error(err);
      errors.push(err);
      continue;
    }

    if (!entries.has(parsedKey1)) {
      entries.set(parsedKey1, new Map<Key2Out, ValOut>());
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    entries.get(parsedKey1)!.set(parsedKey2, parsedVal);
  }
  return [entries, errors];
}
