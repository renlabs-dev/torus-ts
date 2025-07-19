import { assert } from "tsafe";

// ==== Map ====

export function getOrSetDefault<K, V>(
  map: Map<K, V>,
  key: K,
  defaultValueFn: () => V,
): V {
  if (!map.has(key)) {
    const val = defaultValueFn();
    map.set(key, val);
    return val;
  }
  const val = map.get(key);
  assert(val !== undefined, "Map should have value for key");
  return val;
}

export function extractFromMap<K, T>(map: Map<K, T>, keys: K[]) {
  const permsMap = new Map<K, T>();
  for (const id of keys) {
    const perm = map.get(id);
    if (perm === undefined) {
      throw new Error(`Key not found: ${String(id)}`);
    }
    permsMap.set(id, perm);
  }
  return permsMap;
}
