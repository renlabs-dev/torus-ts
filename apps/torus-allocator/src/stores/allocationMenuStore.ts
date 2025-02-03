import { create } from "zustand";

interface AllocationMenuState {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggleIsOpen: () => void;
}

export const useAllocationMenuStore = create<AllocationMenuState>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
  toggleIsOpen: () => set((state) => ({ isOpen: !state.isOpen })),
}));
