import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DelegatedSubnet {
  id: number; // TODO: rename to `netuid`
  name: string;
  percentage: number;
  founderAddress: string;
}

interface DelegateState {
  delegatedSubnets: DelegatedSubnet[];
  originalSubnets: DelegatedSubnet[];
  addSubnet: (Subnet: Omit<DelegatedSubnet, "percentage">) => void;
  removeSubnet: (id: number) => void;
  updatePercentage: (id: number, percentage: number) => void;
  getTotalPercentage: () => number;
  setDelegatedSubnetsFromDB: (Subnets: DelegatedSubnet[]) => void;
  hasUnsavedChanges: () => boolean;
  updateOriginalSubnets: () => void;
}

export const useDelegateSubnetStore = create<DelegateState>()(
  persist(
    (set, get) => ({
      delegatedSubnets: [],
      originalSubnets: [],
      addSubnet: (Subnet) =>
        set((state) => ({
          delegatedSubnets: [
            ...state.delegatedSubnets,
            { ...Subnet, percentage: 1 },
          ],
        })),
      removeSubnet: (id) =>
        set((state) => ({
          delegatedSubnets: state.delegatedSubnets.filter((s) => s.id !== id),
        })),
      updatePercentage: (id, percentage) =>
        set((state) => ({
          delegatedSubnets: state.delegatedSubnets.map((s) =>
            s.id === id ? { ...s, percentage } : s,
          ),
        })),
      getTotalPercentage: () => {
        return get().delegatedSubnets.reduce((sum, m) => sum + m.percentage, 0);
      },
      setDelegatedSubnetsFromDB: (subnets) =>
        set(() => ({ delegatedSubnets: subnets, originalSubnets: subnets })),
      updateOriginalSubnets: () =>
        set((state) => ({ originalSubnets: [...state.delegatedSubnets] })),
      hasUnsavedChanges: () => {
        const state = get();
        if (state.delegatedSubnets.length !== state.originalSubnets.length) {
          return true;
        }
        return state.delegatedSubnets.some((subnet, index) => {
          const originalSubnet = state.originalSubnets[index];
          return (
            subnet.id !== originalSubnet?.id ||
            subnet.percentage !== originalSubnet.percentage
          );
        });
      },
    }),
    {
      name: "delegate-subnet-storage",
    },
  ),
);
