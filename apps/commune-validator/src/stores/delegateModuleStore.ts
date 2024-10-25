import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DelegatedModule {
  id: number;
  name: string;
  address: string;
  percentage: number;
}

interface DelegateState {
  delegatedModules: DelegatedModule[];
  originalModules: DelegatedModule[];
  addModule: (module: Omit<DelegatedModule, "percentage">) => void;
  removeModule: (id: number) => void;
  updatePercentage: (id: number, percentage: number) => void;
  getTotalPercentage: () => number;
  setDelegatedModulesFromDB: (modules: DelegatedModule[]) => void;
  hasUnsavedChanges: () => boolean;
  updateOriginalModules: () => void;
}

export const useDelegateModuleStore = create<DelegateState>()(
  persist(
    (set, get) => ({
      delegatedModules: [],
      originalModules: [],
      addModule: (module) =>
        set((state) => ({
          delegatedModules: [
            ...state.delegatedModules,
            { ...module, percentage: 1 },
          ],
        })),
      removeModule: (id) =>
        set((state) => ({
          delegatedModules: state.delegatedModules.filter((m) => m.id !== id),
        })),
      updatePercentage: (id, percentage) =>
        set((state) => ({
          delegatedModules: state.delegatedModules.map((m) =>
            m.id === id ? { ...m, percentage } : m,
          ),
        })),
      getTotalPercentage: () => {
        return get().delegatedModules.reduce((sum, m) => sum + m.percentage, 0);
      },
      setDelegatedModulesFromDB: (modules) =>
        set(() => ({ delegatedModules: modules, originalModules: modules })),
      updateOriginalModules: () =>
        set((state) => ({ originalModules: [...state.delegatedModules] })),
      hasUnsavedChanges: () => {
        const state = get();
        if (state.delegatedModules.length !== state.originalModules.length) {
          return true;
        }
        return state.delegatedModules.some((module, index) => {
          const originalModule = state.originalModules[index];
          return (
            module.id !== originalModule?.id ||
            module.percentage !== originalModule.percentage
          );
        });
      },
    }),
    {
      name: "delegate-module-storage",
    },
  ),
);
