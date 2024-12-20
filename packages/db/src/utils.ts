import type { PgEnum } from "drizzle-orm/pg-core";

export function extract_pgenum_values<T extends [string, ...string[]]>(
  pgEnum: PgEnum<T>,
): {
  [K in T[number]]: K;
} {
  const map = {} as { [K in T[number]]: K };
  pgEnum.enumValues.forEach((value: T[number]) => {
    map[value] = value;
  });
  return map;
}
