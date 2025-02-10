import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface TutorialStore {
  hasSeenTutorial: boolean;
  setHasSeenTutorial: (value: boolean) => void;
  shouldShowTutorial: boolean;
  setShouldShowTutorial: (value: boolean) => void;
}

export const useTutorialStore = create<TutorialStore>()(
  persist(
    (set) => ({
      hasSeenTutorial: false,
      setHasSeenTutorial: (value) => set({ hasSeenTutorial: value }),
      shouldShowTutorial: false,
      setShouldShowTutorial: (value) => set({ shouldShowTutorial: value }),
    }),
    {
      name: "tutorial-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
