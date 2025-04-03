import type { Result } from "./result";
import { makeErr, makeOk } from "./result";

/**
 * Type guard to check if a value is an instance of Error.
 *
 * @param error - The value to check.
 * @returns True if the value is an Error instance, false otherwise.
 *
 * @example
 * if (isError(result)) {
 *   console.error(result.message);
 * }
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Ensures that the provided value is converted to an Error object.
 *
 * If the input is already an Error, returns it unchanged. Otherwise, attempts
 * to create a new Error with a stringified version of the input.
 *
 * @param maybeError - The value to convert to an Error
 * @returns An Error object
 *
 * @example
 * ```typescript
 * // Returns original error
 * ensureError(new Error('test')); // Error: test
 *
 * // Converts object to Error
 * ensureError({ message: 'test' }); // Error: {"message":"test"}
 *
 * // Handles non-stringifiable values
 * ensureError(undefined); // Error: undefined
 * ```
 */
// TODO: add unit tests for `ensureError`
export function ensureError(maybeError: unknown): Error {
  if (isError(maybeError)) {
    return maybeError;
  }

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    // Fallback in case there's an error stringifying the maybeError with
    // circular references for example.
    return new Error(String(maybeError));
  }
}

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
 * @returns Resolves to a tuple with [error or undefined, data or undefined].
 */
export async function tryAsyncRaw<T, E>(
  promiseLike: PromiseLike<T>,
  parseError: (err: unknown) => E,
): Promise<Result<T, E>> {
  try {
    const value = await promiseLike;
    return makeOk(value);
  } catch (err) {
    return makeErr(parseError(err));
  }
}

/**
 * Handles asynchronous operations with Go-style error handling.
 *
 * @param promiseLike - A Promise-like value that might resolve or reject.
 * @returns Resolves to a tuple with [error or undefined, data or undefined].
 *
 * @example
 * ```typescript
 * const [error, data] = await tryAsync(fetch('https://api.example.com/data'));
 * if (error) {
 *   console.error('API request failed:', error);
 * } else {
 *   console.log('API data:', data);
 * }
 * ```
 */
export function tryAsync<T>(
  promiseLike: PromiseLike<T>,
): Promise<Result<T, Error>> {
  return tryAsyncRaw(promiseLike, ensureError);
}

/**
 * Handles asynchronous operations with Go-style error handling. Unlike {@link
 * tryAsync}, this function returns the error as a string.
 *
 * @param promiseLike - A Promise-like value that might resolve or reject.
 * @returns A tuple with [error message or undefined, data or undefined].
 */
export async function tryAsyncStr<T>(
  promiseLike: PromiseLike<T>,
): Promise<Result<T, string>> {
  const [error, value] = await tryAsync(promiseLike);
  if (error !== undefined) {
    return makeErr(error.toString());
  }
  return makeOk(value);
}
