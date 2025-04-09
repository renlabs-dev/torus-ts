import { assert } from "tsafe";
import type { NonEmpty, Result } from "./result";
import { empty, makeErr, makeOk } from "./result";

// === Async Result types ===
export type AsyncResult<T, E> = Promise<Result<T, E>>;

export class AsyncResultObj<T, E> {
  constructor(public value: Promise<Result<T, E>>) {}

  static async Ok<T, E>(val: T): Promise<AsyncResultObj<T, E>> {
    return new AsyncResultObj(Promise.resolve(makeOk(val) as Result<T, E>));
  }
  static async Err<T, E>(val: E): Promise<AsyncResultObj<T, E>> {
    return new AsyncResultObj(Promise.resolve(makeErr(val) as Result<T, E>));
  }
  static from<T, E>(result: AsyncResult<T, E>): AsyncResultObj<T, E> {
    return new AsyncResultObj(result);
  }

  async match<U>(matchers: {
    Ok: (value: T) => U;
    Err: (value: E) => U;
  }): Promise<U> {
    const result = await this.value;
    const [err, value] = result;
    if (err !== empty) {
      return matchers.Err(err);
    }
    assert(value !== empty);
    return matchers.Ok(value);
  }

  async map<U>(f: (value: T) => NonEmpty<U>): Promise<AsyncResultObj<U, E>> {
    const [err, value] = await this.value;
    if (err !== empty) {
      return AsyncResultObj.Err(err);
    }
    assert(value !== empty);
    return AsyncResultObj.Ok(f(value));
  }

  async mapErr<U>(f: (value: E) => U): Promise<AsyncResultObj<T, U>> {
    const [err, value] = await this.value;
    if (err !== empty) return AsyncResultObj.Err(f(err));
    assert(value !== empty);
    return AsyncResultObj.Ok(value);
  }

  async andThen<U, E2>(
    f: (value: T) => AsyncResult<U, E2>,
  ): Promise<AsyncResultObj<U, E | E2>> {
    const result = await this.value;
    const [err, value] = result;
    if (err !== empty) {
      return AsyncResultObj.from(
        Promise.resolve(makeErr(err) as Result<U, E | E2>),
      );
    }
    assert(value !== empty);
    return AsyncResultObj.from(f(value));
  }
}
