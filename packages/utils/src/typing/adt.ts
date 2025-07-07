import type { Enum } from "rustie";
import { match } from "rustie";

// == ADTs ==

// -- Option --

/** @deprecated */
export type Option<T> = { None: null } | { Some: T };

/** @deprecated */
export const flattenOption = <T>(x: Option<T>): T | null => {
  return match(x)({
    None() {
      return null;
    },
    Some(r) {
      return r;
    },
  });
};

// -- Result --

/** @deprecated */
export type OldResult<T, E> = Enum<{ Ok: T; Err: E }>;

/** @deprecated */
export function flattenResult<T, E>(x: OldResult<T, E>): T | null {
  return match(x)({
    Ok(r) {
      return r;
    },
    Err() {
      return null;
    },
  });
}
