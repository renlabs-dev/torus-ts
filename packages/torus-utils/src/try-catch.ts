import { ensureError } from "./error.js";
import { BasicLogger } from "./logger.js";
import { AsyncResultObj } from "./result/async.js";
import type { Result } from "./result/index.js";
import { empty, makeErr, makeOk } from "./result/index.js";

const log = BasicLogger.create({ name: "try-catch" });

// ==== Sync ====

/**
 * Handles synchronous operations with Go-style error handling i.e. returning
 * error as value.
 *
 * @param syncOperation - A synchronous function that might throw.
 * @param parseError - A function that parses the error with unknown type.
 * @returns A tuple with [error or undefined, data or undefined]
 */
export function trySyncRaw<T, E>(
  syncOperation: () => T,
  parseError: (err: unknown) => E,
): Result<T, E> {
  let value;
  try {
    value = syncOperation();
  } catch (err) {
    // now we know
    return makeErr(parseError(err));
  }
  return makeOk(value);
}

/**
 * Handles synchronous operations with Go-style error handling i.e. returning
 * error as value.
 *
 * @param syncOperation A synchronous function that might throw
 * @returns A tuple with [error or undefined, data or undefined]
 */
export function trySync<T>(syncOperation: () => T): Result<T, Error> {
  return trySyncRaw(syncOperation, ensureError);
}

/**
 * Same as {@link trySync} but returns the error converted to a string.
 */
export function trySyncStr<T>(syncOperation: () => T): Result<T, string> {
  const result = trySync(syncOperation);
  const [error, _value] = result;
  if (error !== undefined) {
    return makeErr(error.toString());
  }
  return result;
}

// ==== Async ====

/**
 * Handles asynchronous operations with Go-style error handling.
 *
 * @param promiseLike - A Promise-like value that might resolve or reject.
 * @param parseError - A function that parses the error with unknown type.
 * @returns An AsyncResultObj containing success or error.
 */

export function tryAsyncRaw<T, E>(
  promiseLike: PromiseLike<T>,
  parseError: (err: unknown) => E,
): AsyncResultObj<T, E> {
  const resultPromise = (async () => {
    try {
      const value = await promiseLike;
      return makeOk(value);
    } catch (err) {
      return makeErr(parseError(err));
    }
  })();

  return AsyncResultObj.from(resultPromise);
}

/**
 * Handles asynchronous operations with Go-style error handling.
 *
 * @param promiseLike - A Promise-like value that might resolve or reject.
 * @returns An AsyncResultObj containing success or Error.
 *
 * @example
 * ```ts
 * const result = await tryAsync(fetch('https://api.example.com/data'))
 *   .match({
 *     Ok: (data) => console.log('API data:', data),
 *     Err: (error) => console.error('API request failed:', error)
 *   });
 * ```
 */
export function tryAsync<T>(
  promiseLike: PromiseLike<T>,
): AsyncResultObj<T, Error> {
  return new AsyncResultObj(tryAsyncRaw(promiseLike, ensureError)._value);
}

/**
 * Handles asynchronous operations with Go-style error handling. Unlike {@link
 * tryAsync}, this function returns the error as a string.
 *
 * @param promiseLike - A Promise-like value that might resolve or reject.
 * @returns An AsyncResultObj containing success or string error.
 */
export function tryAsyncStr<T>(
  promiseLike: PromiseLike<T>,
): AsyncResultObj<T, string> {
  return new AsyncResultObj(
    (async () => {
      const result = await tryAsync(promiseLike)._value;
      const [error, value] = result;
      if (error !== empty) {
        return [error.toString(), undefined];
      }
      return makeOk(value);
    })(),
  );
}

// Unwrap function to convert AsyncResultObj to tuple format
export async function unwrapAsyncResult<T, E extends Error>(
  result: AsyncResultObj<T, E>,
): Promise<[E | undefined, T | undefined]> {
  return await result.match<[E | undefined, T | undefined]>({
    Ok: (value) => [undefined, value],
    Err: (error) => [error, undefined],
  });
}

export async function tryAsyncLogging<T>(
  asyncOperation: PromiseLike<T>,
  message?: string | ((error: Error) => string),
): Promise<[undefined, T] | [Error, undefined]> {
  const result = await tryAsync(asyncOperation);
  if (log.ifResultIsErr(result, message)) return [result[0], undefined];
  return [undefined, result[1]];
}
