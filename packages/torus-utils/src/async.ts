import { assert } from "tsafe";

import type { Result } from "./result/sync.js";
import { makeErr, makeOk } from "./result/sync.js";

/**
 * Creates a deferred promise with external resolution control.
 *
 * This function returns an object containing:
 * - `promise`: A Promise that can be resolved or rejected externally
 * - `resolve`: Function to resolve the promise with a value
 * - `reject`: Function to reject the promise with an error
 *
 * ### Example
 *
 * ```ts
 * const deferred = defer<string>();
 *
 * // Somewhere else in the code
 * deferred.promise.then(value => console.log(value));
 *
 * // Later, resolve the promise
 * deferred.resolve("Success!");
 * ```
 *
 * ### Use Cases
 *
 * - Creating promises that need to be resolved from outside their constructor
 * - Managing async operations with complex control flow
 * - Building custom async primitives and patterns
 *
 * @returns An object with `promise`, `resolve`, and `reject` properties
 */
export function defer<T>() {
  let resolve: ((value: T) => void) | undefined;
  let reject: ((reason: unknown) => void) | undefined;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  assert(resolve, "resolve function not defined");
  assert(reject, "reject function not defined");

  return { promise, resolve, reject };
}

/**
 * A push-based async iterable and iterator that lets a producer inject values,
 * which consumers then pull via `for await…of`. Ideal for bridging callback-
 * or event-based systems into a simple, back-pressure–friendly async stream.
 *
 * @template T The type of items in the stream.
 */
export class AsyncPushStream<T> implements AsyncIterable<T>, AsyncIterator<T> {
  private values: T[] = [];
  private resolvers: ((result: IteratorResult<T>) => void)[] = [];
  private _finished = false;

  /**
   * True once `end()` (or an early `return()`) has been called.
   */
  public get isFinished(): boolean {
    return this._finished;
  }

  /**
   * Push a new value into the stream.
   * @param value The value to enqueue for downstream consumption.
   * @throws If called after the stream has been ended.
   */
  push(value: T): Result<void, Error> {
    if (this._finished) {
      return makeErr(new Error("Cannot push after stream has ended"));
    }
    const resolve = this.resolvers.shift();
    if (resolve !== undefined) {
      resolve({ value, done: false });
    } else {
      this.values.push(value);
    }
    return makeOk(undefined);
  }

  /**
   * Signal that no more values will be pushed. Resolves any waiting consumers
   * with `done: true`.
   */
  end(): void {
    if (this._finished) return;
    this._finished = true;
    for (const resolve of this.resolvers) {
      resolve({ value: undefined, done: true });
    }
    this.resolvers = [];
    this.values = [];
  }

  // ---- AsyncIterator ----

  /**
   * Pulls the next value from the stream, waiting if none are available yet.
   * @returns A promise that resolves to the next `{ value, done }` tuple.
   */
  async next(): Promise<IteratorResult<T>> {
    if (this._finished) {
      return { value: undefined, done: true };
    }

    // Check list length instead of return of shift to allow `undefined` values
    if (this.values.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const value = this.values.shift()!;
      return { value, done: false };
    }
    return new Promise<IteratorResult<T>>((resolve) => {
      this.resolvers.push(resolve);
    });
  }

  /**
   * Allows the consumer to early-close the stream.
   * @returns A `{ value: undefined, done: true }` result.
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async return(): Promise<IteratorResult<T>> {
    this.end();
    return { value: undefined, done: true };
  }

  // ---- AsyncIterable ----

  /**
   * @returns This instance, as it implements both `AsyncIterable` and `AsyncIterator`.
   */
  [Symbol.asyncIterator](): AsyncIterator<T> {
    return this;
  }
}
