import { smallAddress } from "@torus-network/torus-utils/subspace";
import type {
  CustomGraphNode,
  CustomGraphLink,
  CustomGraphData,
  PermissionDetails,
  SignalsList,
} from "../permission-graph-types";
import { GRAPH_CONSTANTS } from "./force-graph-constants";

/**
 * Generates a random particle speed between min and max values.
 */
function getRandomParticleSpeed(): number {
  return (
    Math.random() *
      (GRAPH_CONSTANTS.PARTICLE_SPEED_MAX -
        GRAPH_CONSTANTS.PARTICLE_SPEED_MIN) +
    GRAPH_CONSTANTS.PARTICLE_SPEED_MIN
  );
}

export type PermissionDetail = PermissionDetails[number];

export interface ComputedWeight {
  agentKey: string;
  percComputedWeight: number;
}

/**
 * Creates the complete graph data with the simple hierarchy:
 * ALLOCATOR → ROOT_NODES → PERMISSIONS → TARGET_AGENTS
 */
export function createGraphData(
  permissionDetails: PermissionDetail[] | undefined,
  computedWeights: ComputedWeight[] | undefined,
  allocatorAddress: string,
  signals?: SignalsList,
): CustomGraphData | null {
  console.log("🔍 Graph Debug - Input Data:");
  console.log("  permissionDetails:", permissionDetails?.length ?? 0, permissionDetails);
  console.log("  computedWeights:", computedWeights?.length ?? 0, computedWeights);
  console.log("  allocatorAddress:", allocatorAddress);

  if (
    (!permissionDetails || permissionDetails.length === 0) &&
    (!computedWeights || computedWeights.length === 0)
  ) {
    console.log("❌ No data available for graph creation");
    return null;
  }

  const nodes: CustomGraphNode[] = [];
  const links: CustomGraphLink[] = [];

  // 1. ALLOCATOR NODE (center)
  const allocatorNode: CustomGraphNode = {
    id: allocatorAddress,
    name: "Allocator",
    color: GRAPH_CONSTANTS.COLORS.ALLOCATOR,
    val: GRAPH_CONSTANTS.ALLOCATOR_NODE_SIZE,
    fullAddress: allocatorAddress,
    role: "Allocator",
    nodeType: "allocator",
    fx: 0,
    fy: 0,
    fz: 0,
    x: 0,
    y: 0,
    z: 0,
    agentData: { accountId: allocatorAddress, isWhitelisted: true },
  };
  nodes.push(allocatorNode);

  // 2. ROOT NODES (agents with computed weights, connected to allocator)
  const rootNodeIds = new Set<string>();

  if (computedWeights && computedWeights.length > 0) {
    computedWeights.forEach((agent, index) => {
      const angle = (index * 2 * Math.PI) / computedWeights.length;
      const radius = 150;

      const rootNode: CustomGraphNode = {
        id: agent.agentKey,
        name: smallAddress(agent.agentKey),
        color: GRAPH_CONSTANTS.COLORS.ROOT_NODE,
        val: GRAPH_CONSTANTS.ROOT_NODE_SIZE,
        fullAddress: agent.agentKey,
        role: "Root Agent",
        nodeType: "root_agent",
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: (Math.random() - 0.5) * 50,
        agentData: {
          accountId: agent.agentKey,
          isWhitelisted: true,
          isAllocated: true,
        },
      };
      nodes.push(rootNode);
      rootNodeIds.add(agent.agentKey);

      // Create allocation link: Allocator → Root Node
      links.push({
        linkType: "allocation",
        source: allocatorAddress,
        target: agent.agentKey,
        id: `allocation-${agent.agentKey}`,
        linkColor: GRAPH_CONSTANTS.COLORS.ALLOCATION_LINK,
        linkWidth: 2,
        linkDirectionalParticles: 2,
        linkDirectionalParticleSpeed: getRandomParticleSpeed(),
        linkDirectionalParticleResolution: GRAPH_CONSTANTS.PARTICLE_RESOLUTION,
      });
    });
  } else {
    console.error("❌ No computedWeights data - no root nodes created");
  }

  // 3. PERMISSION NODES & 4. TARGET AGENT NODES
  const targetAgentIds = new Set<string>();

  // If no computed weights, create root nodes from permission grantors as fallback
  if (
    rootNodeIds.size === 0 &&
    permissionDetails &&
    permissionDetails.length > 0
  ) {
    const grantorKeys = new Set<string>();
    permissionDetails.forEach((permission) => {
      if (permission.grantorKey) {
        grantorKeys.add(permission.grantorKey);
      }
    });

    Array.from(grantorKeys).forEach((agentKey, index) => {
      const angle = (index * 2 * Math.PI) / grantorKeys.size;
      const radius = 150;

      const rootNode: CustomGraphNode = {
        id: agentKey,
        name: smallAddress(agentKey),
        color: GRAPH_CONSTANTS.COLORS.ROOT_NODE,
        val: GRAPH_CONSTANTS.ROOT_NODE_SIZE,
        fullAddress: agentKey,
        role: "Root Agent",
        nodeType: "root_agent",
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: (Math.random() - 0.5) * 50,
        agentData: {
          accountId: agentKey,
          isWhitelisted: true,
          isAllocated: false,
        },
      };
      nodes.push(rootNode);
      rootNodeIds.add(agentKey);

      // Create allocation link: Allocator → Root Node
      links.push({
        linkType: "allocation",
        source: allocatorAddress,
        target: agentKey,
        id: `allocation-${agentKey}`,
        linkColor: GRAPH_CONSTANTS.COLORS.ALLOCATION_LINK,
        linkWidth: 2,
        linkDirectionalParticles: 1,
        linkDirectionalParticleSpeed: getRandomParticleSpeed(),
        linkDirectionalParticleResolution: GRAPH_CONSTANTS.PARTICLE_RESOLUTION,
      });
    });
  }

  if (permissionDetails && permissionDetails.length > 0) {
    // Group permissions by permission ID to handle multiple distribution targets
    const permissionMap = new Map<string, PermissionDetail[]>();
    
    permissionDetails.forEach((permission) => {
      const permissionId = permission.permissionId ?? `perm-${Math.random()}`;
      if (!permissionMap.has(permissionId)) {
        permissionMap.set(permissionId, []);
      }
      permissionMap.get(permissionId)?.push(permission);
    });

    // First pass: create permission nodes and collect target agents
    Array.from(permissionMap.entries()).forEach(([permissionId, permissions], index) => {
      const permission = permissions[0]; // Use first entry for permission data
      if (!permission) return;
      
      const permissionType = permission.permissionType ?? "emission";

      if (permission.grantorKey && rootNodeIds.has(permission.grantorKey)) {
        const angle = (index * 2 * Math.PI) / permissionMap.size;
        const radius = 250;

        const permissionNode: CustomGraphNode = {
          id: `permission-${permissionId}`,
          name: permissionType.toUpperCase(),
          color: GRAPH_CONSTANTS.COLORS.PERMISSION_NODE,
          val: GRAPH_CONSTANTS.PERMISSION_NODE_SIZE,
          fullAddress: permissionId,
          role: `${permissionType} Permission`,
          nodeType: "permission",
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          z: (Math.random() - 0.5) * 30,
          permissionData: {
            permissionId,
            permissionType,
            grantorKey: permission.grantorKey,
            granteeKey: permission.granteeKey ?? "",
            scope: permission.scope,
            duration: permission.duration,
          },
        };
        nodes.push(permissionNode);

        // Create permission ownership link: Root Node → Permission
        links.push({
          linkType: "permission_ownership",
          source: permission.grantorKey,
          target: `permission-${permissionId}`,
          id: `ownership-${permissionId}`,
          linkColor: GRAPH_CONSTANTS.COLORS.PERMISSION_LINK,
          linkWidth: 1,
          linkDirectionalArrowLength: 4,
          linkDirectionalArrowRelPos: 1,
          linkDirectionalParticles: 1,
          linkDirectionalParticleSpeed: getRandomParticleSpeed(),
          linkDirectionalParticleResolution:
            GRAPH_CONSTANTS.PARTICLE_RESOLUTION,
        });

        // Collect distribution targets from emissionDistributionTargetsSchema
        permissions.forEach((perm) => {
          if (perm.emission_distribution_targets?.targetAccountId) {
            const targetId = perm.emission_distribution_targets.targetAccountId;
            if (!rootNodeIds.has(targetId)) {
              targetAgentIds.add(targetId);
            }
          }
        });

        // Fallback: if no distribution targets, use granteeKey
        if (permissions.every(p => !p.emission_distribution_targets) && 
            permission.granteeKey && 
            !rootNodeIds.has(permission.granteeKey)) {
          targetAgentIds.add(permission.granteeKey);
        }
      } else {
        console.error(
          `❌ Skipped permission ${index}: grantor not a root node`,
        );
      }
    });

    // Second pass: create target agent nodes
    const targetAgents = Array.from(targetAgentIds);
    targetAgents.forEach((agentId, index) => {
      const angle = (index * 2 * Math.PI) / targetAgents.length;
      const radius = 350;

      const targetNode: CustomGraphNode = {
        id: agentId,
        name: smallAddress(agentId),
        color: GRAPH_CONSTANTS.COLORS.TARGET_NODE,
        val: GRAPH_CONSTANTS.TARGET_NODE_SIZE,
        fullAddress: agentId,
        role: "Target Agent",
        nodeType: "target_agent",
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: (Math.random() - 0.5) * 40,
        agentData: { accountId: agentId },
      };
      nodes.push(targetNode);
    });

    // Third pass: create permission target links
    Array.from(permissionMap.entries()).forEach(([permissionId, permissions]) => {
      const permission = permissions[0];
      if (!permission) return;

      if (permission.grantorKey && rootNodeIds.has(permission.grantorKey)) {
        // Create links to distribution targets
        permissions.forEach((perm) => {
          if (perm.emission_distribution_targets?.targetAccountId) {
            const targetId = perm.emission_distribution_targets.targetAccountId;
            const weight = perm.emission_distribution_targets.weight;
            
            links.push({
              linkType: "permission_target",
              source: `permission-${permissionId}`,
              target: targetId,
              id: `target-${permissionId}-${targetId}`,
              linkColor: GRAPH_CONSTANTS.COLORS.PERMISSION_TO_TARGET_LINK,
              linkWidth: Math.max(1, Math.ceil((weight / 65535) * 4)), // Scale width by weight
              linkDirectionalArrowLength: 6,
              linkDirectionalArrowRelPos: 1,
              linkDirectionalParticles: Math.max(1, Math.ceil((weight / 65535) * 3)),
              linkDirectionalParticleSpeed: getRandomParticleSpeed(),
              linkDirectionalParticleResolution:
                GRAPH_CONSTANTS.PARTICLE_RESOLUTION,
            });
          }
        });

        // Fallback: if no distribution targets, link to granteeKey
        if (permissions.every(p => !p.emission_distribution_targets) && permission.granteeKey) {
          links.push({
            linkType: "permission_target",
            source: `permission-${permissionId}`,
            target: permission.granteeKey,
            id: `target-${permissionId}`,
            linkColor: GRAPH_CONSTANTS.COLORS.PERMISSION_TO_TARGET_LINK,
            linkWidth: 2,
            linkDirectionalArrowLength: 6,
            linkDirectionalArrowRelPos: 1,
            linkDirectionalParticles: 2,
            linkDirectionalParticleSpeed: getRandomParticleSpeed(),
            linkDirectionalParticleResolution:
              GRAPH_CONSTANTS.PARTICLE_RESOLUTION,
          });
        }
      }
    });
  }

  // 5. SIGNAL NODES & LINKS (if any)
  if (signals && signals.length > 0) {
    signals.forEach((signal) => {
      const signalNode: CustomGraphNode = {
        id: `signal-${signal.id}`,
        name: signal.title,
        color: GRAPH_CONSTANTS.COLORS.SIGNAL,
        val: GRAPH_CONSTANTS.SIGNAL_NODE_SIZE,
        role: "Signal",
        nodeType: "signal",
        signalData: signal,
      };
      nodes.push(signalNode);

      // Only create signal link if the agent exists in our graph
      const nodeExists = nodes.some((node) => node.id === signal.agentKey);
      if (nodeExists) {
        links.push({
          linkType: "signal",
          source: signal.agentKey,
          target: `signal-${signal.id}`,
          id: `signal-link-${signal.id}`,
          linkDirectionalParticles: 0,
          linkColor: GRAPH_CONSTANTS.COLORS.SIGNAL_LINK,
          linkWidth: GRAPH_CONSTANTS.SIGNAL_LINK.width,
        });
      }
    });
  }

  console.log("✅ Graph Debug - Final Result:");
  console.log("  nodes:", nodes.length, nodes);
  console.log("  links:", links.length, links);
  
  return { nodes, links };
}
