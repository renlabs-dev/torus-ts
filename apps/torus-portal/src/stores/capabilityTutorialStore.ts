import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface CapabilityTutorialStore {
  hasSeenTutorial: boolean;
  isTutorialOpen: boolean;
  openTutorial: () => void;
  closeTutorial: () => void;
  markTutorialAsSeen: () => void;
}

export const useCapabilityTutorialStore = create<CapabilityTutorialStore>()(
  persist(
    (set) => ({
      hasSeenTutorial: false,
      isTutorialOpen: true,
      openTutorial: () => set({ isTutorialOpen: true }),
      closeTutorial: () => set({ isTutorialOpen: false }),
      markTutorialAsSeen: () =>
        set({ hasSeenTutorial: true, isTutorialOpen: false }),
    }),
    {
      name: "capability-tutorial-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);