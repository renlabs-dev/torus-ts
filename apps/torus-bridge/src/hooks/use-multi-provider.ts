import { useStore } from "~/utils/store";

export function useMultiProvider() {
  return useStore((s) => s.multiProvider);
}
