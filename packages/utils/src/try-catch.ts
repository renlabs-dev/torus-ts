import { AsyncResultObj } from "./async-result";
import type { Result } from "./result";
import { empty, makeErr, makeOk } from "./result";

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
 * ```typescript
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
  return new AsyncResultObj(tryAsyncRaw(promiseLike, ensureError).value);
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
      const result = await tryAsync(promiseLike).value;
      const [error, value] = result;
      if (error !== empty) {
        return [error.toString(), undefined];
      }
      return makeOk(value);
    })(),
  );
}

/**
 * Runs multiple async operations in parallel and collects their results.
 * If any operation fails, returns the first error encountered.
 *
 * @param operations Array of functions that return Promises
 * @returns AsyncResultObj containing an array of all operation results or the first error
 *
 * @example
 * ```typescript
 * const result = await tryAsyncParallel([
 *   () => api.fetchData1(),
 *   () => api.fetchData2(),
 *   () => api.fetchData3()
 * ]);
 *
 * await result.match({
 *   Ok: ([data1, data2, data3]) => console.log("All operations succeeded"),
 *   Err: (error) => console.error("An operation failed:", error)
 * });
 * ```
 */
export function tryAsyncParallel<T extends unknown[], E = Error>(
  operations: [() => Promise<T[0]>, ...(() => Promise<unknown>)[]],
): AsyncResultObj<T, E> {
  const resultPromise = (async () => {
    try {
      // Run all operations in parallel
      const results = await Promise.all(operations.map((op) => op()));
      return makeOk(results) as Result<T, E>;
    } catch (err) {
      return makeErr(ensureError(err) as unknown as E) as Result<T, E>;
    }
  })();

  return AsyncResultObj.from(resultPromise);
}

/**
 * Chains multiple async operations with proper error handling.
 * Each operation only runs if the previous operations succeeded.
 *
 * @param operations Array of functions that return Promises
 * @returns AsyncResultObj containing the result of the last operation or the first error
 *
 * @example
 * ```typescript
 * const result = await tryAsyncChain([
 *   () => api.fetchUser(userId),
 *   (user) => api.fetchPosts(user.id),
 *   (posts) => api.processData(posts)
 * ]);
 *
 * await result.match({
 *   Ok: (data) => console.log("All operations succeeded:", data),
 *   Err: (error) => console.error("An operation failed:", error)
 * });
 * ```
 */
export async function tryAsyncChain<T, E = Error>(
  operations: [() => Promise<T>, ...((prevResult: T) => Promise<T>)[]],
): Promise<AsyncResultObj<T, E>> {
  if (operations.length === 0) {
    throw new Error("Operations array cannot be empty");
  }

  // Start with the first operation
  // Using type assertion since tryAsync returns AsyncResultObj<T, Error> but we need AsyncResultObj<T, E>
  let chainResult = tryAsync(operations[0]()) as AsyncResultObj<T, E>;

  // Chain each subsequent operation
  for (let i = 1; i < operations.length; i++) {
    const operation = operations[i];
    if (!operation) continue;

    const currentOp = operation;

    // We need to convert Promise<T> to AsyncResult<T, E> (Promise<Result<T, E>>)
    chainResult = await chainResult.andThen((result: T) => {
      // Create a Promise<Result<T, E>> from Promise<T>
      return tryAsync(currentOp(result)).value as Promise<Result<T, E>>;
    });
  }

  return chainResult;
}

export async function tryAsyncAllExtended<T extends unknown[]>(operations: {
  [K in keyof T]: () => Promise<T[K]>;
}): Promise<AsyncResultObj<T, Error>> {
  try {
    // Use Promise.all but maintain the specific types
    const results = (await Promise.all(
      operations.map((op, _index) => op()) as { [K in keyof T]: Promise<T[K]> },
    )) as unknown as T;

    return AsyncResultObj.Ok(results);
  } catch (error) {
    const typedError =
      error instanceof Error ? error : new Error(String(error));
    return AsyncResultObj.Err(typedError);
  }
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

// tryAsyncAll that leverages your AsyncResultObj
export async function tryAsyncAll<T extends unknown[]>(operations: {
  [K in keyof T]: () => Promise<T[K]>;
}): Promise<[Error | undefined, T | undefined]> {
  try {
    // Execute operations in parallel
    const results = (await Promise.all(operations.map((op) => op()))) as T;

    // Create an AsyncResultObj with the results
    const resultObj = await AsyncResultObj.Ok<T, Error>(results);

    // Unwrap using our helper function
    return await unwrapAsyncResult(resultObj);
  } catch (error) {
    // Create an AsyncResultObj with the error
    const typedError =
      error instanceof Error ? error : new Error(String(error));
    const resultObj = await AsyncResultObj.Err<T, Error>(typedError);

    // Unwrap using our helper function
    return await unwrapAsyncResult(resultObj);
  }
}
