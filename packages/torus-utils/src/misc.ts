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

