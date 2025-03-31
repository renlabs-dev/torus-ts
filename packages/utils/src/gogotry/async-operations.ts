import { goTry, goTryRaw } from "go-go-try";

/**
 * tryAsync - handles asynchronous operations with Go-style error handling
 * Returns a tuple with the error message (or undefined) and the data (or undefined)
 *
 * @param asyncOperation Any asynchronous function or Promise-returning object method
 * @returns A tuple with [error message or undefined, data or undefined]
 */
export async function tryAsync<T>(
  asyncOperation: Promise<T> | (() => Promise<T>),
): Promise<readonly [string | undefined, T | undefined]> {
  // If asyncOperation is a function, call it to get the Promise
  const promise =
    typeof asyncOperation === "function" ? asyncOperation() : asyncOperation;

  // Use goTry to handle the async operation
  return await goTry(promise);
}

/**
 * tryAsyncRawError - Same as tryAsync but returns the raw error object
 *
 * @param asyncOperation Any asynchronous function or Promise-returning object method
 * @returns A tuple with [error object or undefined, data or undefined]
 */
export async function tryAsyncRawError<E = unknown, T = unknown>(
  asyncOperation: Promise<T> | (() => Promise<T>),
): Promise<readonly [E | undefined, T | undefined]> {
  // If asyncOperation is a function, call it to get the Promise
  const promise =
    typeof asyncOperation === "function" ? asyncOperation() : asyncOperation;

  // Use goTryRaw to get the raw error object
  return await goTryRaw<E, T>(promise);
}
