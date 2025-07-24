import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface TutorialStore {
  hasSeenTutorial: boolean;
  isTutorialOpen: boolean;
  openTutorial: () => void;
  closeTutorial: () => void;
  markTutorialAsSeen: () => void;
}

export const useTutorialStore = create<TutorialStore>()(
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
      name: "tutorial-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
