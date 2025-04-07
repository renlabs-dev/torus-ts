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
export type AsyncResult<T, E> = Promise<Result<T, E>>;

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

export class ResultObj<T, E> {
  constructor(public value: Result<T, E>) {}
  static Ok<T, E>(val: T): ResultObj<T, E> {
    return new ResultObj(makeOk(val) as Result<T, E>);
  }
  static Err<T, E>(val: E): ResultObj<T, E> {
    return new ResultObj(makeErr(val) as Result<T, E>);
  }
  static from<T, E>(result: Result<T, E>): ResultObj<T, E> {
    return new ResultObj(result);
  }

  match<U>(matchers: { Ok: (value: T) => U; Err: (value: E) => U }): U {
    const [err, value] = this.value;
    if (err !== empty) {
      return matchers.Err(err);
    }
    assert(value !== empty);
    return matchers.Ok(value);
  }

  map<U>(f: (value: T) => NonEmpty<U>): ResultObj<U, E> {
    const [err, value] = this.value;
    if (err !== empty) {
      return ResultObj.Err(err);
    }
    assert(value !== empty);
    return ResultObj.Ok(f(value));
  }

  mapErr<U>(f: (value: E) => U): ResultObj<T, U> {
    const [err, value] = this.value;
    if (err !== empty) return ResultObj.Err(f(err));
    assert(value !== empty);
    return ResultObj.Ok(value);
  }

  andThen<U, E2>(f: (value: T) => ResultObj<U, E2>): ResultObj<U, E | E2> {
    const [err, value] = this.value;
    if (err !== empty) return ResultObj.Err(err);
    assert(value !== empty);
    return f(value);
  }
}

export const from = ResultObj.from.bind(ResultObj);

function _test() {
  const res1 = makeOk(1);
  const res2 = makeErr("ono");
  const rests = [res1, res2];

  for (const res of rests) {
    console.log(res);
    from(res)
      .andThen((x) => from(makeOk(x + 1)))
      .match({
        Ok: (x) => x + 3,
        Err: (_e) => NaN,
      });
  }
}

// // ==== Proxy wrapper ====

// // TODO: test proxy wrapper properly

// export interface ResultI<T, E> {
//   match<U>(matchers: { Ok: (value: T) => U; Err: (value: E) => U }): U;
//   map<U>(f: (value: T) => U): ResultI<U, E>;
//   mapErr<U>(f: (value: E) => U): ResultI<T, U>;
//   andThen<U, E2>(f: (value: T) => ResultI<U, E>): ResultI<U, E | E2>;
// }

// export interface AsyncResultI<T, E> {
//   // TODO
// }

// // TODO: build type helper to check this against `ResultI` etc
// const resultMethods = {
//   isOk,
//   isErr,
//   match,
//   map,
//   mapErr,
// };

// /* Proxy wrapper to add methods to Result tuples */

// export const wrappedOk = <T, E>(value: T): ResultI<T, E> =>
//   from<T, E>(makeOk(value));

// export const wrappedErr = <T, E>(value: E): ResultI<T, E> =>
//   from<T, E>(makeErr(value));

// export const from = <T, E>(result: Result<T, E>): ResultI<T, E> => {
//   const proxyHandler = {
//     get: (target: Result<T, E>, prop: string | symbol) => {
//       if (prop in resultMethods) {
//         // eslint-disable-next-line @typescript-eslint/no-unsafe-return
//         return Reflect.get(resultMethods, prop, target);
//       }
//       // eslint-disable-next-line @typescript-eslint/no-unsafe-return
//       return Reflect.get(target, prop);
//     },
//   };

//   return new Proxy(result, proxyHandler) as unknown as Result<T, E> &
//     ResultI<T, E>;
// };
