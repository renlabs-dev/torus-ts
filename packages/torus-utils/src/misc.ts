/**
 * Creates a one-time gate with reset capability.
 *
 * This function returns an object that provides two methods:
 *
 * - `isFirst()`: Returns `true` the first time it is called after creation or reset,
 *   and `false` on every subsequent call until `reset()` is called.
 *
 * - `reset()`: Resets the internal state, allowing `isFirst()` to return `true` again.
 *
 * ### Example
 *
 * ```ts
 * const onceGate = once();
 *
 * onceGate.isFirst(); // true
 * onceGate.isFirst(); // false
 *
 * onceGate.reset();
 * onceGate.isFirst(); // true
 * ```
 *
 * ### Use Cases
 *
 * - Run initialization logic only once per session or conditionally.
 * - Track whether a one-time side effect (e.g., logging, animation) has occurred.
 * - Gate behavior to trigger only on the "first use" after reset.
 *
 * @returns An object with `isFirst()` and `reset()` methods to control one-time logic.
 */
export function once() {
  let fired = false;
  return {
    /**
     * Returns `true` the first time it's called after creation or reset.
     * Subsequent calls return `false` until `reset()` is invoked.
     *
     * @returns Whether this is the first call since the last reset.
     */
    isFirst(): boolean {
      const ret = !fired;
      fired = true;
      return ret;
    },
    /**
     * Resets the internal state so that the next call to `isFirst()` returns `true`.
     */
    reset() {
      fired = false;
    },
  };
}

/**
 * Creates a memoized version of a function that caches its result after the first call.
 *
 * The wrapped function will only be executed once on its first invocation.
 * All subsequent calls will return the cached result without re-executing the function.
 *
 * ### Example
 *
 * ```ts
 * const getConfig = memo(() => {
 *   console.log("Loading config...");
 *   return { apiUrl: "https://api.example.com", timeout: 5000 };
 * });
 *
 * const config1 = getConfig(); // Logs: "Loading config..."
 * const config2 = getConfig(); // No log, returns cached result
 * console.log(config1 === config2); // true (same object reference)
 * ```
 *
 * ### Use Cases
 *
 * - Lazy initialization of expensive resources
 * - Singleton pattern implementation
 * - Caching configuration or environment parsing
 * - Avoiding top-level stateful singletons
 *
 * @param fn - The function to memoize. Must not take any arguments.
 * @returns A memoized version of the function that returns the cached result.
 */
export function memo<T>(fn: () => T): () => T {
  let cached: T | undefined;
  let hasRun = false;

  return () => {
    if (!hasRun) {
      cached = fn();
      hasRun = true;
    }
    return cached as T;
  };
}
