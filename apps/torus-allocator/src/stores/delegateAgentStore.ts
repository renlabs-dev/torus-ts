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
  removeZeroPercentageAgents: () => void;
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
      updateBalancedPercentage: (agentKey: string, newPercentage: number) =>
        set((state) => {
          const agentIndex = state.delegatedAgents.findIndex(
            (agent) => agent.address === agentKey,
          );

          const updatedAgents = [...state.delegatedAgents];
          const currentAgent = updatedAgents[agentIndex];

          if (!currentAgent) {
            return state;
          }

          currentAgent.percentage = newPercentage;

          const totalPercentage = updatedAgents.reduce(
            (sum, agent) => sum + agent.percentage,
            0,
          );

          const remainingAgentsCount = updatedAgents.length - 1;

          if (totalPercentage > 100) {
            const excess = totalPercentage - 100;

            if (remainingAgentsCount) {
              for (let i = 0; i < updatedAgents.length; i++) {
                const agent = updatedAgents[i];
                if (agent && i !== agentIndex) {
                  agent.percentage = Math.max(
                    0,
                    Math.round(
                      agent.percentage -
                        (agent.percentage /
                          (totalPercentage - currentAgent.percentage)) *
                          excess,
                    ),
                  );
                }
              }
            }
          } else if (totalPercentage < 100) {
            const needed = 100 - totalPercentage;
            if (remainingAgentsCount > 0) {
              for (let i = 0; i < updatedAgents.length; i++) {
                const agent = updatedAgents[i];
                if (agent && i !== agentIndex) {
                  agent.percentage = Math.round(
                    agent.percentage +
                      (agent.percentage /
                        (totalPercentage - currentAgent.percentage)) *
                        needed,
                  );
                }
              }
            }
          }

          const finalTotal = updatedAgents.reduce(
            (sum, agent) => sum + agent.percentage,
            0,
          );
          let diff = Math.round(100 - finalTotal);

          if (diff !== 0) {
            let remainingAgentsToAdjust = remainingAgentsCount;
            for (let i = 0; i < updatedAgents.length; i++) {
              const agent = updatedAgents[i];
              if (agent && i !== agentIndex && remainingAgentsToAdjust > 0) {
                const adjustment = Math.round(diff / remainingAgentsToAdjust);
                agent.percentage += adjustment;
                diff -= adjustment;
                remainingAgentsToAdjust--;
              }
            }
          }
          return { delegatedAgents: updatedAgents };
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
      removeZeroPercentageAgents: () =>
        set((state) => ({
          delegatedAgents: state.delegatedAgents.filter(
            (agent) => agent.percentage > 0,
          ),
        })),
      hasPercentageChange: false,
      setPercentageChange: (hasPercentageChange) =>
        set({ hasPercentageChange }),
    }),

    {
      name: "delegate-module-storage",
    },
  ),
);
