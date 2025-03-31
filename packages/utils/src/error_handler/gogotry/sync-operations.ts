import { goTryRawSync, goTrySync } from "go-go-try";

/**
 * trySync - handles synchronous operations with Go-style error handling
 * Returns a tuple with the error message (or undefined) and the data (or undefined)
 *
 * @param syncOperation A synchronous function that might throw
 * @returns A tuple with [error message or undefined, data or undefined]
 */
export function trySync<T>(
  syncOperation: () => T,
): readonly [string | undefined, T | undefined] {
  return goTrySync(syncOperation);
}

/**
 * trySyncRawError - Same as trySync but returns the raw error object
 *
 * @param syncOperation A synchronous function that might throw
 * @returns A tuple with [error object or undefined, data or undefined]
 */
export function trySyncRawError<E = unknown, T = unknown>(
  syncOperation: () => T,
): readonly [E | undefined, T | undefined] {
  return goTryRawSync<E, T>(syncOperation);
}
