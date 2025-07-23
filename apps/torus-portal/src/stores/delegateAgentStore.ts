import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { SS58Address } from "@torus-network/sdk/types";

export interface DelegatedAgent {
  id: number;
  name: string;
  address: string;
  percentage: number;
  metadataUri: string | null;
  registrationBlock: number | null;
  percComputedWeight: number | null;
  weightFactor: number | null;
}

interface DelegateState {
  delegatedAgents: DelegatedAgent[];
  originalAgents: DelegatedAgent[];
  currentWallet: string | null;
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
  setDelegatedAgentsFromDB: (
    agents: DelegatedAgent[],
    walletAddress: string,
  ) => void;
  hasUnsavedChanges: () => boolean;
  clearStore: () => void;

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
      currentWallet: null,
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

          for (let i = 0; i < agents.length - 1; i++) {
            const normalizedPercentage =
              Math.round(
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                (agents[i]!.percentage / totalPercentage) * 100 * 100,
              ) / 100;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            agents[i]!.percentage = normalizedPercentage;
            remainingPercentage -= normalizedPercentage;
          }

          if (agents.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            agents[agents.length - 1]!.percentage =
              Math.round(remainingPercentage * 100) / 100;
          }

          return { delegatedAgents: agents };
        }),

      getTotalPercentage: () => {
        return get().delegatedAgents.reduce(
          (sum, agent) => sum + agent.percentage,
          0,
        );
      },
      setDelegatedAgentsFromDB: (agents, walletAddress) =>
        set((state) => {
          // If wallet changed, clear everything first
          if (state.currentWallet !== walletAddress) {
            return {
              delegatedAgents: agents,
              originalAgents: agents,
              currentWallet: walletAddress,
              hasPercentageChange: false,
            };
          }

          // Same wallet, preserve existing changes
          const existingAgents = state.delegatedAgents;
          const updatedAgents = agents.map((agent) => {
            const existingAgent = existingAgents.find(
              (ea) => ea.address === agent.address,
            );
            return existingAgent ?? agent;
          });

          return {
            delegatedAgents: updatedAgents,
            originalAgents: agents,
            currentWallet: walletAddress,
          };
        }),
      clearStore: () =>
        set({
          delegatedAgents: [],
          originalAgents: [],
          currentWallet: null,
          hasPercentageChange: false,
        }),

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
      removeZeroPercentageAgents: () =>
        set((state) => ({
          delegatedAgents: state.delegatedAgents.filter(
            (agent) => agent.percentage > 0,
          ),
        })),
    }),

    {
      name: "delegate-module-storage",
    },
  ),
);
