/**
 * Retries an async operation with exponential backoff.
 *
 * @param operation - The async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Initial delay in milliseconds, doubles each retry (default: 1000ms)
 *
 * @example
 * ```ts
 * const data = await withRetry(
 *   () => api.prophet.getTweetsNext.query({ limit: 10 }),
 *   3,
 *   1000
 * );
 * ```
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(
          `  Retry attempt ${attempt + 1}/${maxRetries - 1} after ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
