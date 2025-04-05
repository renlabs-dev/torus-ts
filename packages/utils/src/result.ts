import { assert } from "tsafe";

// === Empty placeholder ===

// export const empty: unique symbol = Symbol();
// type empty = typeof empty;
// type NonEmpty<T> = [T] extends [empty] ? never : T;

export const empty = undefined;
export type empty = typeof empty;
type NonEmpty<T> = T;

// === Result types ===

export type Ok<T> = readonly [empty, NonEmpty<T>];
export type Err<E> = readonly [NonEmpty<E>, empty];

export type Result<T, E> = Ok<T> | Err<E>;

export const makeOk = <T>(value: T): Ok<T> => Object.freeze([empty, value]);
export const makeErr = <E>(value: E): Err<E> => Object.freeze([value, empty]);

export const makeErrFrom =
  <E, Args extends unknown[]>(constr: new (...args: Args) => E) =>
  (...args: Args): Err<E> =>
    makeErr(new constr(...args));

// ==== Result utilities ====

export const isErr = <T, E>(result: Result<T, E>): result is Err<E> =>
  result[0] !== empty;

export const isOk = <T, E>(result: Result<T, E>): result is Ok<T> =>
  result[1] === empty;

const match = <T, E, U>(
  result: Result<T, E>,
  matchers: { Ok: (value: T) => U; Err: (value: E) => U },
): U => {
  const [err, value] = result;
  if (err !== empty) {
    return matchers.Err(err);
  }
  assert(value !== empty);
  return matchers.Ok(value);
};

const map = <T, E, U>(
  result: Result<T, E>,
  f: (value: T) => NonEmpty<U>,
): Result<U, E> => {
  const [err, value] = result;
  if (err !== empty) {
    return makeErr(err);
  }
  assert(value !== empty);
  return makeOk(f(value));
};

const mapErr = <T, E, U>(
  result: Result<T, E>,
  f: (value: E) => U,
): Result<T, U> => {
  const [err, value] = result;
  if (err !== empty) return makeErr(f(err));
  assert(value !== empty);
  return makeOk(value);
};

// ==== Proxy wrapper ====

// TODO: test proxy wrapper properly

export interface ResultI<T, E> {
  match<U>(matchers: { Ok: (value: T) => U; Err: (value: E) => U }): U;
  map<U>(f: (value: T) => U): ResultI<U, E>;
  mapErr<U>(f: (value: E) => U): ResultI<T, U>;
}

// TODO: build type helper to check this against `ResultI` etc
const resultMethods = {
  isOk,
  isErr,
  match,
  map,
  mapErr,
};

/* Proxy wrapper to add methods to Result tuples */

export const wrappedOk = <T, E>(value: T): ResultI<T, E> =>
  from<T, E>(makeOk(value));

export const wrappedErr = <T, E>(value: E): ResultI<T, E> =>
  from<T, E>(makeErr(value));

export const from = <T, E>(result: Result<T, E>): ResultI<T, E> => {
  const proxyHandler = {
    get: (target: Result<T, E>, prop: string | symbol) => {
      if (prop in resultMethods) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return Reflect.get(resultMethods, prop, target);
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return Reflect.get(target, prop);
    },
  };

  return new Proxy(result, proxyHandler) as unknown as Result<T, E> &
    ResultI<T, E>;
};
