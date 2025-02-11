import type { SS58Address } from "@torus-ts/subspace";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DelegatedAgent {
  id: number;
  name: string;
  address: string;
  percentage: number;
  metadataUri: string | null;
  registrationBlock: number | null;
}

interface DelegateState {
  delegatedAgents: DelegatedAgent[];
  originalAgents: DelegatedAgent[];
  addAgent: (agent: Omit<DelegatedAgent, "percentage">) => void;
  removeAgent: (agentKey: string | SS58Address) => void;
  updatePercentage: (
    agentKey: string | SS58Address,
    percentage: number,
  ) => void;
  updateBalancedPercentage: (
    agentKey: string | SS58Address,
    percentage: number,
  ) => void;
  getTotalPercentage: () => number;
  setDelegatedAgentsFromDB: (agents: DelegatedAgent[]) => void;
  hasUnsavedChanges: () => boolean;
  updateOriginalAgents: () => void;

  hasPercentageChange: boolean;
  setPercentageChange: (isOpen: boolean) => void;

  getAgentPercentage: (agentKey: string | SS58Address) => number;
}

export const useDelegateAgentStore = create<DelegateState>()(
  persist(
    (set, get) => ({
      delegatedAgents: [],
      originalAgents: [],
      isAllocationMenuOpen: false,
      addAgent: (agent) =>
        set((state) => ({
          delegatedAgents: [
            ...state.delegatedAgents,
            { ...agent, percentage: 1 },
          ],
        })),
      removeAgent: (agentKey) =>
        set((state) => ({
          delegatedAgents: state.delegatedAgents.filter(
            (agent) => agent.address !== agentKey,
          ),
        })),
      updatePercentage: (agentKey, percentage) =>
        set((state) => ({
          delegatedAgents: state.delegatedAgents.map((agent) =>
            agent.address === agentKey ? { ...agent, percentage } : agent,
          ),
        })),
      updateBalancedPercentage: (
        agentKey: string | SS58Address,
        newPercentage: number,
      ) =>
        set((state) => {
          const agents = [...state.delegatedAgents];
          const agentIndex = agents.findIndex((a) => a.address === agentKey);

          if (!agents[agentIndex]) {
            return { delegatedAgents: agents };
          }
          agents[agentIndex].percentage = newPercentage;

          const totalPercentage = agents.reduce(
            (sum, agent) => sum + agent.percentage,
            0,
          );

          let remainingPercentage = 100;
          agents.forEach((agent, index) => {
            if (index === agents.length - 1) {
              agent.percentage = remainingPercentage;
            } else {
              const scaledPercentage = Math.round(
                (agent.percentage / totalPercentage) * 100,
              );
              agent.percentage = scaledPercentage;
              remainingPercentage -= scaledPercentage;
            }
          });

          return { delegatedAgents: agents };
        }),

      getTotalPercentage: () => {
        return get().delegatedAgents.reduce(
          (sum, agent) => sum + agent.percentage,
          0,
        );
      },
      setDelegatedAgentsFromDB: (agents) =>
        set(() => ({ delegatedAgents: agents, originalAgents: agents })),
      updateOriginalAgents: () =>
        set((state) => ({ originalAgents: [...state.delegatedAgents] })),
      hasUnsavedChanges: () => {
        const state = get();
        if (state.delegatedAgents.length !== state.originalAgents.length) {
          return true;
        }
        return state.delegatedAgents.some((agent, index) => {
          const originalAgent = state.originalAgents[index];
          return (
            agent.address !== originalAgent?.address ||
            agent.percentage !== originalAgent.percentage
          );
        });
      },
      getAgentPercentage: (agentKey) => {
        const agent = get().delegatedAgents.find((a) => a.address === agentKey);
        return agent ? agent.percentage : 0;
      },
      hasPercentageChange: false,
      setPercentageChange: (hasPercentageChange) =>
        set({ hasPercentageChange }),
    }),

    {
      name: "delegate-module-storage",
    },
  ),
);
