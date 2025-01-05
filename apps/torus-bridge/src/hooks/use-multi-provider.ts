import { useStore } from "~/features/store";

export function useMultiProvider() {
  return useStore((s) => s.multiProvider);
}
