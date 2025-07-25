import { create } from "zustand";

interface SubmitState {
  isSubmitting: boolean;
  setSubmitting: (value: boolean) => void;
  toggleSubmitting: () => void;
}

const useSubmitStore = create<SubmitState>((set) => ({
  isSubmitting: false,
  setSubmitting: (value: boolean) => set({ isSubmitting: value }),
  toggleSubmitting: () =>
    set((state) => ({ isSubmitting: !state.isSubmitting })),
}));

export default useSubmitStore;
