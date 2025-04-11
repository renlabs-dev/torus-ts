import { assert } from "tsafe";
import type { NonEmpty, Result } from "./result";
import { empty, makeErr, makeOk } from "./result";

// === Async Result types ===

export type AsyncResult<T, E> = Promise<Result<T, E>>;

export class AsyncResultObj<T, E> implements Promise<Result<T, E>> {
  _value: Promise<Result<T, E>>;

  constructor(value: Promise<Result<T, E>>) {
    this._value = value;
  }

  // -- Promise interface implementation --

  then<TResult1 = Result<T, E>, TResult2 = never>(
    onfulfilled?:
      | ((value: Result<T, E>) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this._value.then(onfulfilled, onrejected);
  }
  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ): Promise<Result<T, E> | TResult> {
    return this._value.catch(onrejected);
  }
  finally(onfinally?: (() => void) | null): Promise<Result<T, E>> {
    return this._value.finally(onfinally);
  }
  [Symbol.toStringTag]: string = "AsyncResultObj";

  // -- Wrapping and unwrapping --

  get inner(): Promise<Result<T, E>> {
    return this._value;
  }

  static resolveOk<T, E>(val: T): AsyncResultObj<T, E> {
    return new AsyncResultObj(Promise.resolve(makeOk(val) as Result<T, E>));
  }

  static resolveErr<T, E>(val: E): AsyncResultObj<T, E> {
    return new AsyncResultObj(Promise.resolve(makeErr(val) as Result<T, E>));
  }

  static from<T, E>(result: AsyncResult<T, E>): AsyncResultObj<T, E> {
    return new AsyncResultObj(result);
  }

  // -- Helpers --

  async match<U>(matchers: {
    Ok: (value: T) => U;
    Err: (value: E) => U;
  }): Promise<U> {
    const result = await this._value;
    const [err, value] = result;
    if (err !== empty) {
      return matchers.Err(err);
    }
    assert(value !== empty);
    return matchers.Ok(value);
  }

  async map<U>(f: (value: T) => NonEmpty<U>): Promise<AsyncResultObj<U, E>> {
    const [err, value] = await this._value;
    if (err !== empty) {
      return AsyncResultObj.resolveErr(err);
    }
    assert(value !== empty);
    return AsyncResultObj.resolveOk(f(value));
  }

  async mapErr<U>(f: (value: E) => U): Promise<AsyncResultObj<T, U>> {
    const [err, value] = await this._value;
    if (err !== empty) return AsyncResultObj.resolveErr(f(err));
    assert(value !== empty);
    return AsyncResultObj.resolveOk(value);
  }

  async andThen<U, E2>(
    f: (value: T) => AsyncResult<U, E2>,
  ): Promise<AsyncResultObj<U, E | E2>> {
    const result = await this._value;
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
