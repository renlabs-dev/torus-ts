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
  getTotalPercentage: () => number;
  setDelegatedAgentsFromDB: (agents: DelegatedAgent[]) => void;
  hasUnsavedChanges: () => boolean;
  updateOriginalAgents: () => void;

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
      updatePercentage: (agentKey, newPercentage) =>
        set((state) => {
          const currentAgent = state.delegatedAgents.find(
            (agent) => agent.address === agentKey,
          );
          if (!currentAgent) return state;

          const otherAgents = state.delegatedAgents.filter(
            (agent) => agent.address !== agentKey,
          );

          const currentTotal = state.delegatedAgents.reduce(
            (sum, agent) => sum + agent.percentage,
            0,
          );
          const newTotal =
            currentTotal - currentAgent.percentage + newPercentage;

          if (newTotal <= 100) {
            // If new total is within limit, update the current agent and adjust others if needed
            const updatedAgents = state.delegatedAgents.map((agent) =>
              agent.address === agentKey
                ? { ...agent, percentage: newPercentage }
                : agent,
            );

            // Distribute any remaining percentage
            const remainingPercentage =
              100 -
              updatedAgents.reduce((sum, agent) => sum + agent.percentage, 0);
            for (let i = 0; i < remainingPercentage; i++) {
              if (
                updatedAgents[i % updatedAgents.length]?.address !== agentKey
              ) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                updatedAgents[i % updatedAgents.length]!.percentage += 1;
              }
            }

            return { delegatedAgents: updatedAgents };
          } else {
            // If new total exceeds 100%, adjust other agents proportionally
            const excessPercentage = newTotal - 100;
            const totalOtherPercentage = otherAgents.reduce(
              (sum, agent) => sum + agent.percentage,
              0,
            );

            const adjustedOtherAgents = otherAgents.map((agent) => {
              const reductionFactor = agent.percentage / totalOtherPercentage;
              const newPercentage = Math.max(
                0,
                Math.round(
                  agent.percentage - excessPercentage * reductionFactor,
                ),
              );
              return { ...agent, percentage: newPercentage };
            });

            // Ensure total is exactly 100%
            const adjustedTotal =
              adjustedOtherAgents.reduce(
                (sum, agent) => sum + agent.percentage,
                0,
              ) + newPercentage;
            const difference = 100 - adjustedTotal;

            // Distribute any remaining or excess percentage
            for (let i = 0; i < Math.abs(difference); i++) {
              const index = i % adjustedOtherAgents.length;
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              adjustedOtherAgents[index]!.percentage += Math.sign(difference);
            }

            return {
              delegatedAgents: [
                ...adjustedOtherAgents,
                { ...currentAgent, percentage: newPercentage },
              ],
            };
          }
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
    }),
    {
      name: "delegate-module-storage",
    },
  ),
);
