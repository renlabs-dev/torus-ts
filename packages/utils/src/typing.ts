import type { Enum } from "rustie";
import { match } from "rustie";

export type Nullish = null | undefined;

export type ListItem<L> = L extends (infer T)[] ? T : never;

// == ADTs ==

export type Result<T, E> = Enum<{ Ok: T; Err: E }>;

export function flattenResult<T, E>(x: Result<T, E>): T | null {
  return match(x)({
    Ok(r) {
      return r;
    },
    Err() {
      return null;
    },
  });
}
