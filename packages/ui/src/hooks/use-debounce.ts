import * as React from "react";

/**
 * Debounce a value for a given delay.
 *
 * @example
 * const debouncedValue = useDebounce(value, 500);
 *
 * useEffect(() => {
 *   console.log(debouncedValue);
 * }, [debouncedValue]);
 * @param value - The value to debounce.
 * @param delay - The delay in milliseconds.
 * @returns The debounced value.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
