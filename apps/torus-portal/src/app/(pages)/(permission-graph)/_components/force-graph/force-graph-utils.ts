import type { inferProcedureOutput } from "@trpc/server";
import * as THREE from "three";

import { smallAddress } from "@torus-network/torus-utils/torus/address";

import type { AppRouter } from "@torus-ts/api";

import { getCapabilityPaths } from "~/utils/capability-path";

import type {
  allPermissions,
  CustomGraphLink,
  CustomGraphNode,
  SignalsList,
} from "../permission-graph-types";
import { graphConstants } from "./force-graph-constants";

const precomputedGeometries = {
  allocator: new THREE.SphereGeometry(
    graphConstants.nodeConfig.nodeGeometry.allocator.radius,
    graphConstants.nodeConfig.nodeGeometry.allocator.widthSegments,
    graphConstants.nodeConfig.nodeGeometry.allocator.heightSegments,
  ),
  rootNode: new THREE.SphereGeometry(
    graphConstants.nodeConfig.nodeGeometry.rootNode.radius,
    graphConstants.nodeConfig.nodeGeometry.rootNode.widthSegments,
    graphConstants.nodeConfig.nodeGeometry.rootNode.heightSegments,
  ),
  permissionNode: new THREE.IcosahedronGeometry(
    graphConstants.nodeConfig.nodeGeometry.permissionNode.radius,
    graphConstants.nodeConfig.nodeGeometry.permissionNode.detail,
  ),
  targetNode: new THREE.SphereGeometry(
    graphConstants.nodeConfig.nodeGeometry.targetNode.radius,
    graphConstants.nodeConfig.nodeGeometry.targetNode.widthSegments,
    graphConstants.nodeConfig.nodeGeometry.targetNode.heightSegments,
  ),
  userNode: new THREE.SphereGeometry(
    graphConstants.nodeConfig.nodeGeometry.userNode.radius,
    graphConstants.nodeConfig.nodeGeometry.userNode.widthSegments,
    graphConstants.nodeConfig.nodeGeometry.userNode.heightSegments,
  ),
  signalNode: new THREE.TetrahedronGeometry(
    graphConstants.nodeConfig.nodeGeometry.signalNode.radius,
    graphConstants.nodeConfig.nodeGeometry.signalNode.detail,
  ),
};

const materialCache = new Set<THREE.Material>();

export function disposePrecomputedGeometries() {
  Object.values(precomputedGeometries).forEach((geometry) => {
    geometry.dispose();
  });
}

/**
 * Dispose cached materials to release GPU memory.
 */
export function disposePrecomputedMaterials() {
  materialCache.forEach((material) => {
    material.dispose();
  });
  materialCache.clear();
}

function createPrecomputedMaterial(color: string) {
  const material = new THREE.MeshLambertMaterial({
    color: color,
  });
  materialCache.add(material);
  return material;
}

function assignPrecomputedObjects(node: CustomGraphNode) {
  const nodeType = node.nodeType;
  const color = node.color ?? graphConstants.nodeConfig.nodeColors.default;

  switch (nodeType) {
    case "allocator":
      node.precomputedGeometry = precomputedGeometries.allocator;
      node.precomputedMaterial = createPrecomputedMaterial(color);
      break;
    case "root_agent":
      node.precomputedGeometry = precomputedGeometries.rootNode;
      node.precomputedMaterial = createPrecomputedMaterial(color);
      break;
    case "permission":
      node.precomputedGeometry = precomputedGeometries.permissionNode;
      node.precomputedMaterial = createPrecomputedMaterial(color);
      break;
    case "target_agent":
      node.precomputedGeometry = precomputedGeometries.targetNode;
      node.precomputedMaterial = createPrecomputedMaterial(color);
      break;
    case "signal":
      node.precomputedGeometry = precomputedGeometries.signalNode;
      node.precomputedMaterial = createPrecomputedMaterial(color);
      break;
    default:
      node.precomputedGeometry = precomputedGeometries.targetNode;
      node.precomputedMaterial = createPrecomputedMaterial(color);
      break;
  }
}

// Infer Agent type from tRPC router
export type Agent = NonNullable<
  inferProcedureOutput<AppRouter["agent"]["all"]>
>[number];

function getDeterministicValue(seed: string, min: number, max: number): number {
  // Simple hash function to generate deterministic "random" values
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Normalize to 0-1 range
  const normalized = Math.abs(hash) / 2147483647;

  return normalized * (max - min) + min;
}

function getDeterministicParticleSpeed(seed: string): number {
  return getDeterministicValue(
    seed,
    graphConstants.linkConfig.particleAnimation.speedMin,
    graphConstants.linkConfig.particleAnimation.speedMax,
  );
}

function createParticleProperties(seed: string, particleCount?: number) {
  return {
    linkDirectionalParticles:
      particleCount ?? graphConstants.linkConfig.particleConfig.particles,
    linkDirectionalParticleSpeed: getDeterministicParticleSpeed(seed),
    linkDirectionalParticleResolution:
      graphConstants.linkConfig.particleAnimation.resolution,
  };
}

function getDeterministicZ(seed: string, range: number): number {
  return getDeterministicValue(seed + "_z", -range / 2, range / 2);
}

export interface ComputedWeight {
  agentKey: string;
  agentName: string;
  percComputedWeight: number;
}

// Type for allWithCompletePermissions data
export type AllPermission = allPermissions[number];

export interface ExtractedGraphData {
  nodes: CustomGraphNode[];
  links: CustomGraphLink[];
  permissions: {
    namespace: {
      id: string;
      delegatorAccountId: string;
      recipientAccountId: string;
      scope: string;
      duration: string | null;
    }[];
    emission: {
      id: string;
      delegatorAccountId: string;
      recipientAccountId: string;
      scope: string;
      duration: string | null;
      distributionTargets?: {
        targetAccountId: string;
        weight: number;
      }[];
    }[];
  };
  agents: {
    accountId: string;
    name: string;
    role: "Allocator" | "Root Agent" | "Target Agent";
    isWhitelisted?: boolean;
    isAllocated?: boolean;
  }[];
  signals: {
    id: number;
    title: string;
    description: string;
    agentKey: string;
    proposedAllocation: number;
  }[];
}

export function getHypergraphFlowNodes(
  selectedNodeId: string,
  nodes: CustomGraphNode[],
  links: CustomGraphLink[],
  allocatorAddress: string,
): Set<string> {
  const flowNodes = new Set<string>();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) return flowNodes;

  // Always include the selected node
  flowNodes.add(selectedNodeId);

  // Helper function to get link IDs safely
  const getLinkIds = (link: CustomGraphLink) => {
    const sourceId =
      typeof link.source === "string"
        ? link.source
        : typeof link.source === "object"
          ? String(link.source.id)
          : "";
    const targetId =
      typeof link.target === "string"
        ? link.target
        : typeof link.target === "object"
          ? String(link.target.id)
          : "";
    return { sourceId, targetId };
  };

  // Helper function to traverse connections recursively, excluding allocator connections
  const traverseConnections = (nodeId: string, visited: Set<string>) => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    flowNodes.add(nodeId);

    // Find all links connected to this node, but skip allocator connections unless it's the selected node
    const connectedLinks = links.filter((link) => {
      const { sourceId, targetId } = getLinkIds(link);
      const isNodeInvolved = sourceId === nodeId || targetId === nodeId;

      if (!isNodeInvolved) return false;

      // If this node is the allocator and it's not the selected node, skip its connections
      if (nodeId === allocatorAddress && nodeId !== selectedNodeId) {
        return false;
      }

      // Skip allocation links (allocator -> root agents) unless allocator is selected
      if (
        link.linkType === "allocation" &&
        selectedNodeId !== allocatorAddress
      ) {
        return false;
      }

      return true;
    });

    // Traverse to connected nodes
    connectedLinks.forEach((link) => {
      const { sourceId, targetId } = getLinkIds(link);

      if (sourceId !== nodeId) {
        traverseConnections(sourceId, visited);
      }
      if (targetId !== nodeId) {
        traverseConnections(targetId, visited);
      }
    });
  };

  // Special handling for allocator selection
  if (selectedNodeId === allocatorAddress) {
    // If allocator is selected, show everything
    nodes.forEach((node) => flowNodes.add(node.id));
  } else {
    // For any other node, traverse connections but exclude allocator's direct connections
    const visited = new Set<string>();
    traverseConnections(selectedNodeId, visited);

    // Always include the allocator in the flow as it's the root of all flows
    flowNodes.add(allocatorAddress);
  }

  return flowNodes;
}

export function createSimplifiedGraphData(
  agents: Agent[],
  allPermissions: AllPermission[],
  allocatorAddress: string,
  signals?: SignalsList,
  allAgentsData?: Agent[],
): ExtractedGraphData | null {
  // Don't render anything if there's no data
  if (agents.length === 0 || allPermissions.length === 0) {
    return null;
  }

  // Use a Map to track all nodes and prevent duplicates
  const nodesMap = new Map<string, CustomGraphNode>();
  const links: CustomGraphLink[] = [];

  // Initialize data collectors for search component
  const extractedAgents: ExtractedGraphData["agents"] = [];
  const extractedNamespacePermissions: ExtractedGraphData["permissions"]["namespace"] =
    [];
  const extractedEmissionPermissions: ExtractedGraphData["permissions"]["emission"] =
    [];
  const extractedSignals: ExtractedGraphData["signals"] = [];

  // 1. ADD ALLOCATOR NODE (center)
  const allocatorNode: CustomGraphNode = {
    id: allocatorAddress,
    name: "Allocator",
    color: graphConstants.nodeConfig.nodeColors.allocator,
    fullAddress: allocatorAddress,
    role: "Allocator",
    nodeType: "allocator",
    fx: 0,
    fy: 0,
    fz: 0,
    x: 0,
    y: 0,
    z: 0,
    agentData: {
      accountId: allocatorAddress,
      isWhitelisted: true,
    },
  };
  assignPrecomputedObjects(allocatorNode);
  nodesMap.set(allocatorAddress, allocatorNode);

  // Create a map to track all agent nodes (from agents list + permissions)
  const allAgentNodes = new Map<string, CustomGraphNode>();
  const allAgentDataMap = new Map<string, Agent>();
  const whitelistedAgentKeys = new Set<string>();

  // First, map ALL agents for name lookups (if provided)
  (allAgentsData ?? agents).forEach((agent) => {
    allAgentDataMap.set(agent.key, agent);
  });

  // Track which agents are whitelisted (for root vs target distinction)
  agents.forEach((agent) => {
    whitelistedAgentKeys.add(agent.key);
  });

  // Helper function to create or get agent node
  const getOrCreateAgentNode = (agentKey: string): CustomGraphNode => {
    const existingNode = allAgentNodes.get(agentKey);
    if (existingNode) {
      return existingNode;
    }

    const existingAgent = allAgentDataMap.get(agentKey);
    const isWhitelistedAgent = whitelistedAgentKeys.has(agentKey);
    const agentNode: CustomGraphNode = {
      id: agentKey,
      name: existingAgent?.name ?? smallAddress(agentKey),
      color: isWhitelistedAgent
        ? graphConstants.nodeConfig.nodeColors.rootNode
        : graphConstants.nodeConfig.nodeColors.targetNode,
      fullAddress: agentKey,
      role: isWhitelistedAgent ? "Root Agent" : "Target Agent",
      nodeType: isWhitelistedAgent ? "root_agent" : "target_agent",
      agentData: {
        accountId: agentKey,
        isWhitelisted: existingAgent?.isWhitelisted ?? undefined,
      },
    };

    assignPrecomputedObjects(agentNode);
    allAgentNodes.set(agentKey, agentNode);
    return agentNode;
  };

  // 2. ADD ALL AGENTS (both from agents list AND permissions)
  const allAgentIds = new Set<string>();

  // Add all agents from the agents list first
  agents.forEach((agent) => {
    allAgentIds.add(agent.key);
  });

  // Also collect agent IDs referenced in permissions (for inactive agents)
  allPermissions.forEach((permission) => {
    if (permission.permissions.grantorAccountId) {
      allAgentIds.add(permission.permissions.grantorAccountId);
    }
    if (permission.permissions.granteeAccountId) {
      allAgentIds.add(permission.permissions.granteeAccountId);
    }
    if (permission.emission_distribution_targets?.targetAccountId) {
      allAgentIds.add(permission.emission_distribution_targets.targetAccountId);
    }
  });

  // Create nodes for ALL agents (active + referenced)
  const agentArray = Array.from(allAgentIds);
  agentArray.forEach((agentKey, index) => {
    const angle = (index * 2 * Math.PI) / agentArray.length;
    const radius = 300;

    // Skip if this node already exists (e.g., allocator)
    if (!nodesMap.has(agentKey)) {
      const agentNode = getOrCreateAgentNode(agentKey);
      agentNode.x = Math.cos(angle) * radius;
      agentNode.y = Math.sin(angle) * radius;
      agentNode.z = getDeterministicZ(agentKey, 100);

      nodesMap.set(agentKey, agentNode);
    }

    const existingAgent = allAgentDataMap.get(agentKey);
    const isWhitelistedAgent = whitelistedAgentKeys.has(agentKey);
    extractedAgents.push({
      accountId: agentKey,
      name: existingAgent?.name ?? smallAddress(agentKey),
      role: isWhitelistedAgent ? "Root Agent" : "Target Agent",
      isWhitelisted: existingAgent?.isWhitelisted ?? undefined,
    });
  });

  // 2.5. ADD ALLOCATION LINKS TO ALL ROOT_AGENTS (whitelisted agents)
  agents.forEach((agent) => {
    if (agent.isWhitelisted) {
      links.push({
        linkType: "allocation",
        source: allocatorAddress,
        target: agent.key,
        id: `allocation-${agent.key}`,
        linkColor: graphConstants.linkConfig.linkColors.allocatorLink,
        ...createParticleProperties(agent.key),
      });
    }
  });

  // 3. ITERATE THROUGH PERMISSIONS AND ADD EDGES
  // Track created permission nodes to prevent duplicates
  const createdPermissionNodes = new Set<string>();

  allPermissions.forEach((permission) => {
    const permissionId = permission.permissions.permissionId;
    const delegatorId = permission.permissions.grantorAccountId;
    const recipientId = permission.permissions.granteeAccountId;

    // Determine permission type
    const permissionType = permission.emission_permissions
      ? "emission"
      : permission.namespace_permissions
        ? "capability"
        : "emission";

    // Extract permission data for search
    if (permissionType === "capability") {
      extractedNamespacePermissions.push({
        id: permissionId,
        delegatorAccountId: delegatorId || "",
        recipientAccountId: recipientId || "",
        scope: permissionType.toUpperCase(),
        duration:
          permission.permissions.durationType === "indefinite"
            ? null
            : (permission.permissions.durationBlockNumber?.toString() ?? null),
      });
    } else {
      const distributionTargets = permission.emission_distribution_targets
        ? [
            {
              targetAccountId:
                permission.emission_distribution_targets.targetAccountId,
              weight: permission.emission_distribution_targets.weight,
            },
          ]
        : undefined;

      extractedEmissionPermissions.push({
        id: permissionId,
        delegatorAccountId: delegatorId || "",
        recipientAccountId: recipientId || "",
        scope: permissionType.toUpperCase(),
        duration:
          permission.permissions.durationType === "indefinite"
            ? null
            : (permission.permissions.durationBlockNumber?.toString() ?? null),
        distributionTargets,
      });
    }

    // Create edges based on permission relationships
    if (
      permissionType === "capability" &&
      delegatorId &&
      recipientId &&
      delegatorId !== recipientId
    ) {
      // For namespace permissions: delegator (root_agent) creates permission for recipient (target_agent)
      const permissionNodeId = `permission-${permissionId}`;

      // Only create permission node if it doesn't already exist
      if (!createdPermissionNodes.has(permissionNodeId)) {
        createdPermissionNodes.add(permissionNodeId);

        // Create permission node
        const permissionNode: CustomGraphNode = {
          id: permissionNodeId,
          name: `Permission ${smallAddress(permissionId)}`,
          color: graphConstants.nodeConfig.nodeColors.namespacePermissionNode,
          fullAddress: permissionId,
          role: "Namespace Permission",
          nodeType: "permission",
          x: 0,
          y: 0,
          z: getDeterministicZ(permissionId, 50),
          permissionData: {
            permissionId,
            permissionType: "capability",
            delegatorAccountId: delegatorId,
            recipientAccountId: recipientId,
            scope: "CAPABILITY",
            duration:
              permission.permissions.durationType === "indefinite"
                ? null
                : (permission.permissions.durationBlockNumber?.toString() ??
                  null),
            namespacePaths: permission.namespace_permission_paths
              ? getCapabilityPaths(
                  permission.namespace_permission_paths.namespacePath,
                ).paths
              : [],
          },
        };
        assignPrecomputedObjects(permissionNode);
        nodesMap.set(permissionNodeId, permissionNode);
      }

      // Ensure delegator (root_agent) and recipient (target_agent) nodes exist
      if (!nodesMap.has(delegatorId)) {
        const delegatorNode = getOrCreateAgentNode(delegatorId);
        nodesMap.set(delegatorId, delegatorNode);
      }
      if (!nodesMap.has(recipientId)) {
        const recipientNode = getOrCreateAgentNode(recipientId);
        nodesMap.set(recipientId, recipientNode);
      }

      // Edge: delegator (root_agent) -> permission node
      links.push({
        linkType: "permission_grant",
        source: delegatorId,
        target: permissionNodeId,
        id: `grant-${permissionId}`,
        linkColor: graphConstants.linkConfig.linkColors.namespacePermissionLink,
        ...createParticleProperties(permissionId),
      });

      // Edge: permission node -> recipient (target_agent)
      links.push({
        linkType: "permission_receive",
        source: permissionNodeId,
        target: recipientId,
        id: `receive-${permissionId}`,
        linkColor: graphConstants.linkConfig.linkColors.namespacePermissionLink,
        ...createParticleProperties(permissionId),
      });
    }

    // For emission permissions: delegator (root_agent) creates emission permission with targets
    if (permissionType === "emission" && delegatorId) {
      const permissionNodeId = `permission-${permissionId}`;

      // Only create permission node if it doesn't already exist
      if (!createdPermissionNodes.has(permissionNodeId)) {
        createdPermissionNodes.add(permissionNodeId);

        // Create emission permission node
        const permissionNode: CustomGraphNode = {
          id: permissionNodeId,
          name: `Stream ${smallAddress(permissionId)}`,
          color: graphConstants.nodeConfig.nodeColors.emissionPermissionNode,
          fullAddress: permissionId,
          role: "Emission Permission",
          nodeType: "permission",
          x: 0,
          y: 0,
          z: getDeterministicZ(permissionId, 50),
          permissionData: {
            permissionId,
            permissionType: "emission",
            delegatorAccountId: delegatorId,
            recipientAccountId: recipientId || "",
            scope: "EMISSION",
            duration:
              permission.permissions.durationType === "indefinite"
                ? null
                : (permission.permissions.durationBlockNumber?.toString() ??
                  null),
          },
        };
        assignPrecomputedObjects(permissionNode);
        nodesMap.set(permissionNodeId, permissionNode);
      }

      // Ensure delegator (root_agent) node exists
      if (!nodesMap.has(delegatorId)) {
        const delegatorNode = getOrCreateAgentNode(delegatorId);
        nodesMap.set(delegatorId, delegatorNode);
      }

      // Edge: delegator -> permission node
      links.push({
        linkType: "permission_grant",
        source: delegatorId,
        target: permissionNodeId,
        id: `grant-${permissionId}`,
        linkColor: graphConstants.linkConfig.linkColors.emissionPermissionLink,
        ...createParticleProperties(permissionId),
      });

      // Edge: permission node -> recipient (target_agent) (only if no distribution targets and recipient exists and is different)
      if (
        !permission.emission_distribution_targets?.targetAccountId &&
        recipientId &&
        recipientId !== delegatorId
      ) {
        // Ensure recipient node exists
        if (!nodesMap.has(recipientId)) {
          const recipientNode = getOrCreateAgentNode(recipientId);
          nodesMap.set(recipientId, recipientNode);
        }

        links.push({
          linkType: "permission_receive",
          source: permissionNodeId,
          target: recipientId,
          id: `receive-${permissionId}`,
          linkColor:
            graphConstants.linkConfig.linkColors.emissionPermissionLink,
          ...createParticleProperties(permissionId),
        });
      }
    }

    // Add distribution target edges for emission permissions
    if (
      permission.emission_distribution_targets?.targetAccountId &&
      permissionId &&
      permissionType === "emission" &&
      delegatorId // Only create edge if permission node was created (which requires delegatorId)
    ) {
      const targetId = permission.emission_distribution_targets.targetAccountId;
      const permissionNodeId = `permission-${permissionId}`;

      // Ensure target node exists
      if (!nodesMap.has(targetId)) {
        const targetNode = getOrCreateAgentNode(targetId);
        nodesMap.set(targetId, targetNode);
      }

      // Edge: permission node -> target
      const particleCount = Math.max(
        1,
        Math.ceil(
          (permission.emission_distribution_targets.weight / 65535) * 3,
        ),
      );

      links.push({
        linkType: "permission_target",
        source: permissionNodeId,
        target: targetId,
        id: `distribution-${permissionId}-${targetId}`,
        linkColor: graphConstants.linkConfig.linkColors.emissionPermissionLink,
        linkWidth: graphConstants.linkConfig.linkWidth * 0.7,
        ...createParticleProperties(targetId, particleCount),
      });
    }
  });

  // 4. ADD SIGNAL NODES & LINKS (if any)
  if (signals && signals.length > 0) {
    signals.forEach((signal) => {
      const signalNode: CustomGraphNode = {
        id: `signal-${signal.id}`,
        name: signal.title,
        color: graphConstants.nodeConfig.nodeColors.signalNode,
        role: "Signal",
        nodeType: "signal",
        signalData: signal,
      };
      assignPrecomputedObjects(signalNode);
      nodesMap.set(signalNode.id, signalNode);

      // Extract signal data
      extractedSignals.push({
        id: signal.id,
        title: signal.title,
        description: signal.description,
        agentKey: signal.agentKey,
        proposedAllocation: signal.proposedAllocation,
      });

      // Create edge from agent to signal
      const agentNodeExists = nodesMap.has(signal.agentKey);
      if (agentNodeExists) {
        links.push({
          linkType: "signal",
          source: signal.agentKey,
          target: `signal-${signal.id}`,
          id: `signal-link-${signal.id}`,
          linkColor: graphConstants.linkConfig.linkColors.signalLink,
          ...createParticleProperties(signal.agentKey),
        });
      } else {
        // Create agent node if it doesn't exist
        const agentNode = getOrCreateAgentNode(signal.agentKey);
        nodesMap.set(signal.agentKey, agentNode);

        // Now create the edge
        links.push({
          linkType: "signal",
          source: signal.agentKey,
          target: `signal-${signal.id}`,
          id: `signal-link-${signal.id}`,
          linkColor: graphConstants.linkConfig.linkColors.signalLink,
          ...createParticleProperties(signal.agentKey),
        });
      }
    });
  }

  // Convert the Map to an array for the return value
  const nodes = Array.from(nodesMap.values());

  return {
    nodes,
    links,
    permissions: {
      namespace: extractedNamespacePermissions,
      emission: extractedEmissionPermissions,
    },
    agents: extractedAgents,
    signals: extractedSignals,
  };
}
