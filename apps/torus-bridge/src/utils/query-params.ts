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
  const params = new URLSearchParams(currentSearchParams.toString());

  Object.entries(updates).forEach(([key, value]) => {
    if (value === null) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  });

  return params.toString();
}
