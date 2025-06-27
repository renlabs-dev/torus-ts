import { trySync } from "@torus-network/torus-utils/try-catch";

/**
 * Utility to simplify setting/removing query params.
 *
 * @param currentSearchParams The current URLSearchParams (from next/navigation)
 * @param updates A Record whose keys are query param names and values are either
 *                strings (to be set) or null (to be removed).
 * @returns The updated query string (WITHOUT leading "?").
 */
export function updateSearchParams(
  currentSearchParams: URLSearchParams,
  updates: Record<string, string | null>,
): string {
  const [paramsError, params] = trySync(
    () => new URLSearchParams(currentSearchParams.toString()),
  );

  if (paramsError !== undefined) {
    console.error("Error creating URLSearchParams:", paramsError);
    return currentSearchParams.toString(); // Return original params if there's an error
  }

  const [updateError] = trySync(() => {
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    return true;
  });

  if (updateError !== undefined) {
    console.error("Error updating search parameters:", updateError);
    return currentSearchParams.toString(); // Return original params if there's an error
  }

  return params.toString();
}
