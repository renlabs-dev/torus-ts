import { assert } from "tsafe";

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
