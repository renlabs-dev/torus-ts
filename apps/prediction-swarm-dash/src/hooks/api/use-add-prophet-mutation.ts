import { api } from "~/trpc/react";

/**
 * Hook to add a Twitter username to SwarmMemory for scraping
 *
 * Creates a task to scrape all tweets from the specified user.
 * Requires user to be authenticated.
 *
 * @example
 * ```ts
 * const addProphet = useAddProphetMutation();
 *
 * // Add a prophet
 * await addProphet.mutateAsync({ username: 'elonmusk' });
 *
 * // Check status
 * if (addProphet.isPending) { ... }
 * if (addProphet.isError) { ... }
 * if (addProphet.isSuccess) { ... }
 * ```
 */
export function useAddProphetMutation() {
  return api.prophet.addToMemory.useMutation();
}
