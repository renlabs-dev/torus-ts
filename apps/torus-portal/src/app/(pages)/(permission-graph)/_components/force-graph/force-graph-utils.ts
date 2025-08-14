import type { inferProcedureOutput } from "@trpc/server";

import { smallAddress } from "@torus-network/torus-utils/torus/address";

import type { AppRouter } from "@torus-ts/api";

import type {
  allPermissions,
  CustomGraphLink,
  CustomGraphNode,
  SignalsList,
} from "../permission-graph-types";
import { graphConstants } from "./force-graph-constants";

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
      grantorAccountId: string;
      granteeAccountId: string;
      scope: string;
      duration: string | null;
    }[];
    emission: {
      id: string;
      grantorAccountId: string;
      granteeAccountId: string;
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

export function createSimplifiedGraphData(
  agents: Agent[],
  allPermissions: AllPermission[],
  allocatorAddress: string,
  signals?: SignalsList,
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

  // 1. ADD ROOT NODE (center)
  const rootNode: CustomGraphNode = {
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
  nodesMap.set(allocatorAddress, rootNode);

  // Create a map to track all agent nodes (from agents list + permissions)
  const allAgentNodes = new Map<string, CustomGraphNode>();
  const allAgentData = new Map<string, Agent>();

  // First, map all existing agents
  agents.forEach((agent) => {
    allAgentData.set(agent.key, agent);
  });

  // Helper function to create or get agent node
  const getOrCreateAgentNode = (agentKey: string): CustomGraphNode => {
    const existingNode = allAgentNodes.get(agentKey);
    if (existingNode) {
      return existingNode;
    }

    const existingAgent = allAgentData.get(agentKey);
    const agentNode: CustomGraphNode = {
      id: agentKey,
      name: existingAgent?.name ?? smallAddress(agentKey),
      color: existingAgent
        ? graphConstants.nodeConfig.nodeColors.rootNode
        : graphConstants.nodeConfig.nodeColors.targetNode,
      fullAddress: agentKey,
      role: existingAgent ? "Root Agent" : "Target Agent",
      nodeType: existingAgent ? "root_agent" : "target_agent",
      agentData: {
        accountId: agentKey,
        isWhitelisted: existingAgent?.isWhitelisted ?? undefined,
      },
    };

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

    const existingAgent = allAgentData.get(agentKey);
    extractedAgents.push({
      accountId: agentKey,
      name: existingAgent?.name ?? smallAddress(agentKey),
      role: existingAgent ? "Root Agent" : "Target Agent",
      isWhitelisted: existingAgent?.isWhitelisted ?? undefined,
    });
  });

  // 2.5. ADD ALLOCATOR EDGES TO ALL WHITELISTED AGENTS
  agents.forEach((agent) => {
    if (agent.isWhitelisted) {
      links.push({
        linkType: "allocation",
        source: allocatorAddress,
        target: agent.key,
        id: `allocation-${agent.key}`,
        linkColor: graphConstants.linkConfig.linkColors.allocatorLink,
        linkWidth: graphConstants.linkConfig.linkWidth,
        linkDirectionalArrowLength:
          graphConstants.linkConfig.arrowConfig.defaultArrowLength,
        linkDirectionalArrowRelPos:
          graphConstants.linkConfig.arrowConfig.defaultArrowRelPos,
        linkDirectionalParticles: graphConstants.linkConfig.particleConfig.particles,
        linkDirectionalParticleSpeed: getDeterministicParticleSpeed(agent.key),
        linkDirectionalParticleResolution:
          graphConstants.linkConfig.particleAnimation.resolution,
      });
    }
  });

  // 3. ITERATE THROUGH PERMISSIONS AND ADD EDGES
  // Track created permission nodes to prevent duplicates
  const createdPermissionNodes = new Set<string>();

  allPermissions.forEach((permission) => {
    const permissionId = permission.permissions.permissionId;
    const grantorId = permission.permissions.grantorAccountId;
    const granteeId = permission.permissions.granteeAccountId;

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
        grantorAccountId: grantorId || "",
        granteeAccountId: granteeId || "",
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
        grantorAccountId: grantorId || "",
        granteeAccountId: granteeId || "",
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
      grantorId &&
      granteeId &&
      grantorId !== granteeId
    ) {
      // For namespace permissions: require different grantor and grantee
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
            grantorAccountId: grantorId,
            granteeAccountId: granteeId,
            scope: "CAPABILITY",
            duration:
              permission.permissions.durationType === "indefinite"
                ? null
                : (permission.permissions.durationBlockNumber?.toString() ??
                  null),
            namespacePaths: permission.namespace_permission_paths
              ? [permission.namespace_permission_paths.namespacePath]
              : [],
          },
        };
        nodesMap.set(permissionNodeId, permissionNode);
      }

      // Ensure grantor and grantee nodes exist
      if (!nodesMap.has(grantorId)) {
        const grantorNode = getOrCreateAgentNode(grantorId);
        nodesMap.set(grantorId, grantorNode);
      }
      if (!nodesMap.has(granteeId)) {
        const granteeNode = getOrCreateAgentNode(granteeId);
        nodesMap.set(granteeId, granteeNode);
      }

      // Edge: grantor -> permission node
      links.push({
        linkType: "permission_grant",
        source: grantorId,
        target: permissionNodeId,
        id: `grant-${permissionId}`,
        linkColor: graphConstants.linkConfig.linkColors.namespacePermissionLink,
        linkWidth: graphConstants.linkConfig.linkWidth,
        linkDirectionalArrowLength:
          graphConstants.linkConfig.arrowConfig.defaultArrowLength,
        linkDirectionalArrowRelPos:
          graphConstants.linkConfig.arrowConfig.defaultArrowRelPos,
        linkDirectionalParticles: graphConstants.linkConfig.particleConfig.particles,
        linkDirectionalParticleSpeed:
          getDeterministicParticleSpeed(permissionId),
        linkDirectionalParticleResolution:
          graphConstants.linkConfig.particleAnimation.resolution,
      });

      // Edge: permission node -> grantee
      links.push({
        linkType: "permission_receive",
        source: permissionNodeId,
        target: granteeId,
        id: `receive-${permissionId}`,
        linkColor: graphConstants.linkConfig.linkColors.namespacePermissionLink,
        linkWidth: graphConstants.linkConfig.linkWidth,
        linkDirectionalArrowLength:
          graphConstants.linkConfig.arrowConfig.defaultArrowLength,
        linkDirectionalArrowRelPos:
          graphConstants.linkConfig.arrowConfig.defaultArrowRelPos,
        linkDirectionalParticles: graphConstants.linkConfig.particleConfig.particles,
        linkDirectionalParticleSpeed:
          getDeterministicParticleSpeed(permissionId),
        linkDirectionalParticleResolution:
          graphConstants.linkConfig.particleAnimation.resolution,
      });
    }

    // For emission permissions: create permission node regardless of grantor/grantee relationship
    if (permissionType === "emission" && grantorId) {
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
            grantorAccountId: grantorId,
            granteeAccountId: granteeId || "",
            scope: "EMISSION",
            duration:
              permission.permissions.durationType === "indefinite"
                ? null
                : (permission.permissions.durationBlockNumber?.toString() ??
                  null),
          },
        };
        nodesMap.set(permissionNodeId, permissionNode);
      }

      // Ensure grantor node exists
      if (!nodesMap.has(grantorId)) {
        const grantorNode = getOrCreateAgentNode(grantorId);
        nodesMap.set(grantorId, grantorNode);
      }

      // Edge: grantor -> permission node
      links.push({
        linkType: "permission_grant",
        source: grantorId,
        target: permissionNodeId,
        id: `grant-${permissionId}`,
        linkColor: graphConstants.linkConfig.linkColors.emissionPermissionLink,
        linkWidth: graphConstants.linkConfig.linkWidth,
        linkDirectionalArrowLength:
          graphConstants.linkConfig.arrowConfig.defaultArrowLength,
        linkDirectionalArrowRelPos:
          graphConstants.linkConfig.arrowConfig.defaultArrowRelPos,
        linkDirectionalParticles: graphConstants.linkConfig.particleConfig.particles,
        linkDirectionalParticleSpeed:
          getDeterministicParticleSpeed(permissionId),
        linkDirectionalParticleResolution:
          graphConstants.linkConfig.particleAnimation.resolution,
      });

      // Edge: permission node -> recipient (only if no distribution targets and grantee exists and is different)
      if (
        !permission.emission_distribution_targets?.targetAccountId &&
        granteeId &&
        granteeId !== grantorId
      ) {
        // Ensure grantee node exists
        if (!nodesMap.has(granteeId)) {
          const granteeNode = getOrCreateAgentNode(granteeId);
          nodesMap.set(granteeId, granteeNode);
        }

        links.push({
          linkType: "permission_receive",
          source: permissionNodeId,
          target: granteeId,
          id: `receive-${permissionId}`,
          linkColor:
            graphConstants.linkConfig.linkColors.emissionPermissionLink,
          linkWidth: graphConstants.linkConfig.linkWidth,
          linkDirectionalArrowLength:
            graphConstants.linkConfig.arrowConfig.defaultArrowLength,
          linkDirectionalArrowRelPos:
            graphConstants.linkConfig.arrowConfig.defaultArrowRelPos,
          linkDirectionalParticles: graphConstants.linkConfig.particleConfig.particles,
          linkDirectionalParticleSpeed:
            getDeterministicParticleSpeed(permissionId),
          linkDirectionalParticleResolution:
            graphConstants.linkConfig.particleAnimation.resolution,
        });
      }
    }

    // Add distribution target edges for emission permissions
    if (
      permission.emission_distribution_targets?.targetAccountId &&
      permissionId &&
      permissionType === "emission" &&
      grantorId // Only create edge if permission node was created (which requires grantorId)
    ) {
      const targetId = permission.emission_distribution_targets.targetAccountId;
      const permissionNodeId = `permission-${permissionId}`;

      // Ensure target node exists
      if (!nodesMap.has(targetId)) {
        const targetNode = getOrCreateAgentNode(targetId);
        nodesMap.set(targetId, targetNode);
      }

      // Edge: permission node -> target
      links.push({
        linkType: "permission_target",
        source: permissionNodeId,
        target: targetId,
        id: `distribution-${permissionId}-${targetId}`,
        linkColor: graphConstants.linkConfig.linkColors.emissionPermissionLink,
        linkWidth: graphConstants.linkConfig.linkWidth * 0.7,
        linkDirectionalArrowLength:
          graphConstants.linkConfig.arrowConfig.defaultArrowLength,
        linkDirectionalArrowRelPos:
          graphConstants.linkConfig.arrowConfig.defaultArrowRelPos,
        linkDirectionalParticles: Math.max(
          1,
          Math.ceil(
            (permission.emission_distribution_targets.weight / 65535) * 3,
          ),
        ),
        linkDirectionalParticleSpeed: getDeterministicParticleSpeed(targetId),
        linkDirectionalParticleResolution:
          graphConstants.linkConfig.particleAnimation.resolution,
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
          linkDirectionalParticles: 0,
          linkColor: graphConstants.linkConfig.linkColors.signalLink,
          linkWidth: graphConstants.linkConfig.linkWidth,
          linkDirectionalArrowLength:
            graphConstants.linkConfig.arrowConfig.defaultArrowLength,
          linkDirectionalArrowRelPos:
            graphConstants.linkConfig.arrowConfig.defaultArrowRelPos,
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
          linkDirectionalParticles: 0,
          linkColor: graphConstants.linkConfig.linkColors.signalLink,
          linkWidth: graphConstants.linkConfig.linkWidth,
          linkDirectionalArrowLength:
            graphConstants.linkConfig.arrowConfig.defaultArrowLength,
          linkDirectionalArrowRelPos:
            graphConstants.linkConfig.arrowConfig.defaultArrowRelPos,
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
