import { assert } from "tsafe";

import { ensureError } from "./error.js";
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
export function defer<T>(): Waiter<T> & { promise: Promise<T> } {
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

interface Waiter<T> {
  resolve: (result: T) => void;
  reject: (e: unknown) => void;
}

/**
 * A push-based async iterable/iterator that lets a producer inject values,
 * which consumers then pull via `for await … of`. Useful to bridge callback- or
 * event-based sources into a simple, backpressure-friendly async stream.
 *
 * Semantics:
 * - `undefined` values are allowed.
 * - `end()` drains any buffered values first, then yields `{done:true}`.
 * - `throw(err)`:
 *    - Finishes the stream, clears the buffer.
 *    - All pending `next()` promises reject with `err`.
 *    - The `throw()` call itself rejects with `err` (or a default error).
 *    - Subsequent `throw()` calls still reject (stream is already finished).
 * - After finished, `push()` returns an Error via the Result type.
 *
 * Single-Consumer Iterator: This class implements both `AsyncIterable` and
 * `AsyncIterator`, with `[Symbol.asyncIterator]()` returning `this`. This
 * means:
 * - All iterations share the same internal state (values buffer and waiters
 *   queue)
 * - Multiple concurrent `for await...of` loops will interfere with each other
 * - The sequence cannot be restarted once consumed
 * - This is spec-compliant behavior (generator objects work the same way)
 * - For multi-consumer or restartable iteration, wrap or buffer externally
 *
 * @template T The type of items in the stream.
 */
export class AsyncPushStream<T> implements AsyncIterable<T>, AsyncIterator<T> {
  private _values: T[] = [];
  private _waiters: Waiter<IteratorResult<T>>[] = [];
  private _finished = false;

  /** True once `end()` or `return()` has been called (or `throw()`). */
  public get isFinished(): boolean {
    return this._finished;
  }

  /**
   * Push a new value into the stream.
   * @param value The value to enqueue for downstream consumption (may be `undefined`).
   * @returns Result<void, Error> — error if the stream is already finished.
   */
  push(value: T): Result<void, Error> {
    if (this._finished) {
      return makeErr(new Error("Cannot push after stream has ended"));
    }
    const waiter = this._waiters.shift();
    if (waiter !== undefined) {
      waiter.resolve({ value, done: false });
    } else {
      this._values.push(value);
    }
    return makeOk(undefined);
  }

  /**
   * Mark the stream as finished: no more values will be delivered.
   *
   * Effects:
   * - Resolves any currently *waiting* consumers of `next()` with `{ value: undefined, done: true }`.
   * - Clears the internal buffer (any enqueued values are discarded).
   * - Subsequent `next()` calls resolve immediately with `{ done: true }`.
   *
   * Note: Calling `end()` multiple times is a no-op after the first call.
   */
  end(): void {
    if (this._finished) return;
    this._finished = true;

    // Wake pending waiters as done.
    for (const waiter of this._waiters) {
      waiter.resolve({ value: undefined, done: true });
    }
    this._waiters = [];

    // Discard any buffered values.
    this._values = [];
  }

  // ---- AsyncIterator ----

  /**
   * Pull the next value. If none are buffered:
   * - waits until a value is pushed,
   * - or resolves `{ done: true }` if the stream is finished before a value arrives.
   */
  async next(): Promise<IteratorResult<T>> {
    // Note: If we want buffered values to be consumed after the stream is
    // finished, we can move the buffer shift() here <=== and not empty _values
    // in end().

    if (this._finished) {
      return { value: undefined, done: true };
    }
    if (this._values.length > 0) {
      // `undefined` is a valid value; we check length rather than sentinel.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const value = this._values.shift()!;
      return { value, done: false };
    }
    const waiter = defer<IteratorResult<T>>();
    this._waiters.push(waiter);
    return waiter.promise;
  }

  /**
   * Consumer-initiated graceful close.
   *
   * Semantics:
   * - Equivalent to `end()`.
   * - Resolves any pending `next()` with `{ done: true }`.
   * - Returns `{ done: true }` to the caller.
   */
  return(): Promise<IteratorResult<T>> {
    this.end();
    return Promise.resolve({ value: undefined, done: true });
  }

  /**
   * Signal an error and close the stream (fatal close).
   *
   * Effects (first call while open):
   * - Marks the stream finished and clears the buffer.
   * - Rejects all *pending* `next()` waiters with the provided error.
   * - Returns a rejected promise with that same error.
   *
   * Idempotence:
   * - If the stream is already finished, this returns `{ done: true }`
   *   instead of rejecting again, to avoid double faults in teardown code.
   */
  async throw(error?: unknown): Promise<IteratorResult<T>> {
    if (this._finished) {
      // Idempotent after close
      return { value: undefined, done: true };
    }

    this._finished = true;

    const err = ensureError(error ?? "Stream aborted");

    // Fail any pending `next()` calls.
    for (const waiter of this._waiters) {
      waiter.reject(err);
    }
    this._waiters = [];

    // Discard any buffered values.
    this._values = [];

    // Surface the fatal error to the caller of throw().
    return Promise.reject(err);
  }

  // ---- AsyncIterable ----

  /**
   * Returns the iterator object (this instance itself).
   *
   * Note: This returns `this`, making AsyncPushStream a single-consumer
   * iterator. Multiple iterations or concurrent loops will share the same state
   * and interfere with each other. This is intentional and follows the same
   * pattern as generator objects.
   */
  [Symbol.asyncIterator](): AsyncIterator<T> {
    return this;
  }
}
