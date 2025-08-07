import { useQuery } from "@tanstack/react-query";
import type { Edge, Node } from "@xyflow/react";

import { DelegationTreeManager } from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";

import { useTorus } from "@torus-ts/torus-provider";

import { adaptDelegationTreeToReactFlow } from "../delegation-tree-adapter";
import type { NamespacePathNodeData } from "../types";

interface DelegationTreeData {
  nodes: Node<NamespacePathNodeData>[];
  edges: Edge[];
  treeManager: DelegationTreeManager;
}

/**
 * Hook to fetch and manage delegation tree data from the blockchain.
 * Uses DelegationTreeManager to build the tree and adapts it for React Flow.
 */
export function useDelegationTree() {
  const { api, isInitialized, selectedAccount } = useTorus();

  // Use the selected account address if no specific address provided
  const targetAddress = selectedAccount?.address as SS58Address;

  return useQuery<DelegationTreeData, Error>({
    queryKey: ["delegationTree", targetAddress, selectedAccount?.address],
    queryFn: async () => {
      // Create delegation tree manager from blockchain data
      const [managerError, treeManager] = await DelegationTreeManager.create(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        api!,
        targetAddress,
      );

      if (managerError) {
        const errorMessage =
          managerError instanceof Error
            ? managerError.message
            : String(managerError);
        throw new Error(`Failed to create delegation tree: ${errorMessage}`);
      }

      // Transform to React Flow format
      const { nodes, edges } = adaptDelegationTreeToReactFlow(treeManager);

      return {
        nodes,
        edges,
        treeManager,
      };
    },
    enabled: isInitialized && !!api && !!targetAddress,
  });
}
