import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DelegatedAgent {
  id: number;
  name: string;
  address: string;
  percentage: number;
}

interface DelegateState {
  delegatedAgents: DelegatedAgent[];
  originalAgents: DelegatedAgent[];
  addAgent: (module: Omit<DelegatedAgent, "percentage">) => void;
  removeAgent: (id: number) => void;
  updatePercentage: (id: number, percentage: number) => void;
  getTotalPercentage: () => number;
  setDelegatedAgentsFromDB: (modules: DelegatedAgent[]) => void;
  hasUnsavedChanges: () => boolean;
  updateOriginalAgents: () => void;
}

export const useDelegateAgentStore = create<DelegateState>()(
  persist(
    (set, get) => ({
      delegatedAgents: [],
      originalAgents: [],
      addAgent: (module) =>
        set((state) => ({
          delegatedAgents: [
            ...state.delegatedAgents,
            { ...module, percentage: 1 },
          ],
        })),
      removeAgent: (id) =>
        set((state) => ({
          delegatedAgents: state.delegatedAgents.filter((m) => m.id !== id),
        })),
      updatePercentage: (id, percentage) =>
        set((state) => ({
          delegatedAgents: state.delegatedAgents.map((m) =>
            m.id === id ? { ...m, percentage } : m,
          ),
        })),
      getTotalPercentage: () => {
        return get().delegatedAgents.reduce((sum, m) => sum + m.percentage, 0);
      },
      setDelegatedAgentsFromDB: (modules) =>
        set(() => ({ delegatedAgents: modules, originalAgents: modules })),
      updateOriginalAgents: () =>
        set((state) => ({ originalAgents: [...state.delegatedAgents] })),
      hasUnsavedChanges: () => {
        const state = get();
        if (state.delegatedAgents.length !== state.originalAgents.length) {
          return true;
        }
        return state.delegatedAgents.some((module, index) => {
          const originalAgent = state.originalAgents[index];
          return (
            module.id !== originalAgent?.id ||
            module.percentage !== originalAgent.percentage
          );
        });
      },
    }),
    {
      name: "delegate-module-storage",
    },
  ),
);
