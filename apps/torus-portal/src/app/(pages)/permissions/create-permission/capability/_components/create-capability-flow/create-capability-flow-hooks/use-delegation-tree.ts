import { useQuery } from "@tanstack/react-query";
import { DelegationTreeManager } from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";
import { useTorus } from "@torus-ts/torus-provider";
import type { Edge, Node } from "@xyflow/react";
import type {
  NamespacePathNodeData,
  PermissionInfo,
} from "../create-capability-flow-types";

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
        throw new Error(`Failed to create delegation tree`);
      }

      const nodes: Node<NamespacePathNodeData>[] = treeManager
        .getNodes()
        .map((node, index) => {
          const nodePermissions = treeManager.getNodePermissions(node.id);
          const permissions: PermissionInfo[] = Array.from(
            nodePermissions.entries(),
          ).map(([permissionId, count]) => ({
            permissionId,
            count,
          }));

          return {
            id: node.id,
            type: "namespacePath",
            position: { x: (index % 3) * 200, y: Math.floor(index / 3) * 100 },
            data: {
              label: node.id,
              accessible: node.accessible,
              permissions,
              selectedPermission: null,
            },
          };
        });

      const edges: Edge[] = treeManager.getEdges().map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      }));

      return { nodes, edges, treeManager };
    },
    enabled: isInitialized && !!api && !!targetAddress,
  });
}
