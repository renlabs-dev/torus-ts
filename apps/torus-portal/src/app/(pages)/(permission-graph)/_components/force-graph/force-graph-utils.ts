import { smallAddress } from "@torus-network/torus-utils/subspace";

import type {
  allPermissions,
  CustomGraphData,
  CustomGraphLink,
  CustomGraphNode,
  SignalsList,
} from "../permission-graph-types";
import { graphConstants } from "./force-graph-constants";

function getLinkColorFromSource(sourceId: string, linkType: string, permissionType?: string): string {
  // Exception: signals keep their own color
  if (linkType === "signal") {
    return graphConstants.linkConfig.linkColors.signalLink;
  }
  
  // Determine source node type and return matching link color
  if (sourceId.includes("allocator") || linkType === "allocation") {
    return graphConstants.linkConfig.linkColors.allocatorLink;
  }
  
  if (sourceId.startsWith("permission-")) {
    // For permission nodes, use the permission type to determine color
    if (permissionType === "namespace") {
      return graphConstants.linkConfig.linkColors.namespacePermissionLink;
    }
    return graphConstants.linkConfig.linkColors.emissionPermissionLink;
  }
  
  if (sourceId.startsWith("signal-")) {
    return graphConstants.linkConfig.linkColors.signalLink;
  }
  
  // For root nodes and other agent nodes, use blue (root node color)
  return graphConstants.linkConfig.linkColors.rootNodeLink;
}

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
    graphConstants.particleAnimation.speedMin,
    graphConstants.particleAnimation.speedMax,
  );
}

function getDeterministicZ(seed: string, range: number): number {
  return getDeterministicValue(seed + "_z", -range / 2, range / 2);
}

export interface ComputedWeight {
  agentKey: string;
  percComputedWeight: number;
}

// Type for allWithCompletePermissions data
export type AllPermission = allPermissions[number];

export function createGraphData(
  computedWeights: ComputedWeight[] | undefined,
  allocatorAddress: string,
  signals?: SignalsList,
  allPermissions?: AllPermission[],
): CustomGraphData | null {
  if (
    (!allPermissions || allPermissions.length === 0) &&
    (!computedWeights || computedWeights.length === 0)
  ) {
    return null;
  }

  const nodes: CustomGraphNode[] = [];
  const links: CustomGraphLink[] = [];

  // 1. ALLOCATOR NODE (center)
  const allocatorNode: CustomGraphNode = {
    id: allocatorAddress,
    name: "Allocator",
    color: graphConstants.nodeConfig.nodeColors.allocator,
    val: graphConstants.nodeConfig.nodeSizes.allocator,
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
      const radius = 200;

      const rootNode: CustomGraphNode = {
        id: agent.agentKey,
        name: smallAddress(agent.agentKey),
        color: graphConstants.nodeConfig.nodeColors.rootNode,
        val: graphConstants.nodeConfig.nodeSizes.rootNode,
        fullAddress: agent.agentKey,
        role: "Root Agent",
        nodeType: "root_agent",
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: getDeterministicZ(agent.agentKey, 100),
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
        linkColor: getLinkColorFromSource(allocatorAddress, "allocation"),
        linkWidth: graphConstants.linkConfig.linkWidths.allocationLink,
        linkDirectionalArrowLength: graphConstants.linkConfig.arrowConfig.defaultArrowLength,
        linkDirectionalArrowRelPos: graphConstants.linkConfig.arrowConfig.defaultArrowRelPos,
        linkDirectionalParticles: 2,
        linkDirectionalParticleSpeed: getDeterministicParticleSpeed(
          agent.agentKey,
        ),
        linkDirectionalParticleResolution: graphConstants.particleAnimation.resolution,
      });
    });
  }

  // 3. PERMISSION NODES & 4. TARGET AGENT NODES
  const targetAgentIds = new Set<string>();
  const createdPermissionIds = new Set<string>();

  // If no computed weights, create root nodes from permission grantors as fallback
  if (rootNodeIds.size === 0 && allPermissions && allPermissions.length > 0) {
    const grantorKeys = new Set<string>();
    allPermissions.forEach((permission) => {
      if (permission.permissions.grantorAccountId) {
        grantorKeys.add(permission.permissions.grantorAccountId);
      }
    });

    Array.from(grantorKeys).forEach((agentKey, index) => {
      const angle = (index * 2 * Math.PI) / grantorKeys.size;
      const radius = 200;

      const rootNode: CustomGraphNode = {
        id: agentKey,
        name: smallAddress(agentKey),
        color: graphConstants.nodeConfig.nodeColors.rootNode,
        val: graphConstants.nodeConfig.nodeSizes.rootNode,
        fullAddress: agentKey,
        role: "Root Agent",
        nodeType: "root_agent",
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: getDeterministicZ(agentKey, 100),
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
        linkColor: getLinkColorFromSource(allocatorAddress, "allocation"),
        linkWidth: graphConstants.linkConfig.linkWidths.allocationLink,
        linkDirectionalArrowLength: graphConstants.linkConfig.arrowConfig.defaultArrowLength,
        linkDirectionalArrowRelPos: graphConstants.linkConfig.arrowConfig.defaultArrowRelPos,
        linkDirectionalParticles: 1,
        linkDirectionalParticleSpeed: getDeterministicParticleSpeed(agentKey),
        linkDirectionalParticleResolution: graphConstants.particleAnimation.resolution,
      });
    });
  }

  if (allPermissions && allPermissions.length > 0) {
    // Group permissions by permission ID to handle multiple distribution targets
    const permissionMap = new Map<string, AllPermission[]>();
    const permissionTypes = new Map<string, string>(); // Store permission types

    allPermissions.forEach((permission) => {
      const permissionId = permission.permissions.permissionId;

      if (!permissionMap.has(permissionId)) {
        permissionMap.set(permissionId, []);
        // Store permission type when first encountering this permission ID
        const permissionType = permission.emission_permissions
          ? "emission"
          : permission.namespace_permissions
            ? "namespace"
            : "emission"; // default to emission
        permissionTypes.set(permissionId, permissionType);
      }
      permissionMap.get(permissionId)?.push(permission);
    });

    // First pass: create permission nodes and collect target agents
    Array.from(permissionMap.entries()).forEach(
      ([permissionId, permissions], index) => {
        const permission = permissions[0]; // Use first entry for permission data
        if (!permission) return;

        // Determine permission type based on the presence of emission or namespace data
        const permissionType = permission.emission_permissions
          ? "emission"
          : permission.namespace_permissions
            ? "namespace"
            : "emission"; // default to emission

        if (
          permission.permissions.grantorAccountId &&
          rootNodeIds.has(permission.permissions.grantorAccountId)
        ) {
          // Check for duplicate permission node creation
          const permissionNodeId = `permission-${permissionId}`;
          if (createdPermissionIds.has(permissionNodeId)) {
            return;
          }
          createdPermissionIds.add(permissionNodeId);
          const angle = (index * 2 * Math.PI) / permissionMap.size;
          const radius = 400;

          const permissionNode: CustomGraphNode = {
            id: `permission-${permissionId}`,
            name: permissionType.toUpperCase(),
            color: permissionType === "namespace" 
              ? graphConstants.nodeConfig.nodeColors.namespacePermissionNode
              : graphConstants.nodeConfig.nodeColors.emissionPermissionNode,
            val: graphConstants.nodeConfig.nodeSizes.permissionNode,
            fullAddress: permissionId,
            role: `${permissionType} Permission`,
            nodeType: "permission",
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            z: getDeterministicZ(permissionId, 60),
            permissionData: {
              permissionId,
              permissionType,
              grantorAccountId: permission.permissions.grantorAccountId,
              granteeAccountId: permission.permissions.granteeAccountId,
              scope: permissionType.toUpperCase(),
              duration:
                permission.permissions.durationType === "indefinite"
                  ? null
                  : permission.permissions.durationBlockNumber?.toString(),
            },
          };
          nodes.push(permissionNode);

          // Create permission ownership link: Root Node → Permission
          links.push({
            linkType: "permission_ownership",
            source: permission.permissions.grantorAccountId,
            target: `permission-${permissionId}`,
            id: `ownership-${permissionId}`,
            linkColor: getLinkColorFromSource(permission.permissions.grantorAccountId, "permission_ownership"),
            linkWidth: graphConstants.linkConfig.linkWidths.permissionLink,
            linkDirectionalArrowLength: graphConstants.linkConfig.arrowConfig.defaultArrowLength,
            linkDirectionalArrowRelPos: graphConstants.linkConfig.arrowConfig.defaultArrowRelPos,
            linkDirectionalParticles: 1,
            linkDirectionalParticleSpeed:
              getDeterministicParticleSpeed(permissionId),
            linkDirectionalParticleResolution:
              graphConstants.particleAnimation.resolution,
          });

          // Collect distribution targets from emissionDistributionTargetsSchema
          // Use Set to ensure we only collect unique targets
          const uniqueTargetsForThisPermission = new Set<string>();
          permissions.forEach((perm) => {
            if (perm.emission_distribution_targets?.targetAccountId) {
              const targetId =
                perm.emission_distribution_targets.targetAccountId;
              uniqueTargetsForThisPermission.add(targetId);

              if (!rootNodeIds.has(targetId)) {
                targetAgentIds.add(targetId);
              }
            }
          });

          // Fallback: if no distribution targets, use granteeAccountId
          if (
            permissions.every((p) => !p.emission_distribution_targets) &&
            permission.permissions.granteeAccountId &&
            !rootNodeIds.has(permission.permissions.granteeAccountId)
          ) {
            targetAgentIds.add(permission.permissions.granteeAccountId);
          }
        }
      },
    );

    // Second pass: create target agent nodes
    const targetAgents = Array.from(targetAgentIds);
    targetAgents.forEach((agentId, index) => {
      const angle = (index * 2 * Math.PI) / targetAgents.length;
      const radius = 600;

      const targetNode: CustomGraphNode = {
        id: agentId,
        name: smallAddress(agentId),
        color: graphConstants.nodeConfig.nodeColors.targetNode,
        val: graphConstants.nodeConfig.nodeSizes.targetNode,
        fullAddress: agentId,
        role: "Target Agent",
        nodeType: "target_agent",
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: getDeterministicZ(agentId, 80),
        agentData: { accountId: agentId },
      };
      nodes.push(targetNode);
    });

    // Third pass: create permission target links
    Array.from(permissionMap.entries()).forEach(
      ([permissionId, permissions]) => {
        const permission = permissions[0];
        if (!permission) return;

        if (
          permission.permissions.grantorAccountId &&
          rootNodeIds.has(permission.permissions.grantorAccountId)
        ) {
          // Create links to distribution targets (deduplicated)
          const uniqueTargetLinks = new Map<
            string,
            { targetId: string; weight: number }
          >();
          permissions.forEach((perm) => {
            if (perm.emission_distribution_targets?.targetAccountId) {
              const targetId =
                perm.emission_distribution_targets.targetAccountId;
              const weight = perm.emission_distribution_targets.weight;

              // Use the highest weight if there are duplicates
              const existing = uniqueTargetLinks.get(targetId);
              if (!existing || weight > existing.weight) {
                uniqueTargetLinks.set(targetId, { targetId, weight });
              }
            }
          });

          uniqueTargetLinks.forEach(({ targetId, weight }) => {
            links.push({
              linkType: "permission_target",
              source: `permission-${permissionId}`,
              target: targetId,
              id: `target-${permissionId}-${targetId}`,
              linkColor: getLinkColorFromSource(`permission-${permissionId}`, "permission_target", permissionTypes.get(permissionId)),
              linkWidth: graphConstants.linkConfig.linkWidths.permissionLink,
              linkDirectionalArrowLength: graphConstants.linkConfig.arrowConfig.defaultArrowLength,
              linkDirectionalArrowRelPos: graphConstants.linkConfig.arrowConfig.defaultArrowRelPos,
              linkDirectionalParticles: Math.max(
                1,
                Math.ceil((weight / 65535) * 3),
              ),
              linkDirectionalParticleSpeed:
                getDeterministicParticleSpeed(targetId),
              linkDirectionalParticleResolution:
                graphConstants.particleAnimation.resolution,
            });
          });

          // Fallback: if no distribution targets, link to granteeAccountId
          if (
            uniqueTargetLinks.size === 0 &&
            permission.permissions.granteeAccountId
          ) {
            links.push({
              linkType: "permission_target",
              source: `permission-${permissionId}`,
              target: permission.permissions.granteeAccountId,
              id: `target-${permissionId}`,
              linkColor: getLinkColorFromSource(`permission-${permissionId}`, "permission_target", permissionTypes.get(permissionId)),
              linkWidth: graphConstants.linkConfig.linkWidths.permissionLink,
              linkDirectionalArrowLength: graphConstants.linkConfig.arrowConfig.defaultArrowLength,
              linkDirectionalArrowRelPos: graphConstants.linkConfig.arrowConfig.defaultArrowRelPos,
              linkDirectionalParticles: 2,
              linkDirectionalParticleSpeed: getDeterministicParticleSpeed(
                permission.permissions.granteeAccountId,
              ),
              linkDirectionalParticleResolution:
                graphConstants.particleAnimation.resolution,
            });
          }
        }
      },
    );
  }

  // 5. SIGNAL NODES & LINKS (if any)
  if (signals && signals.length > 0) {
    signals.forEach((signal) => {
      const signalNode: CustomGraphNode = {
        id: `signal-${signal.id}`,
        name: signal.title,
        color: graphConstants.nodeConfig.nodeColors.signalNode,
        val: graphConstants.nodeConfig.nodeSizes.signalNode,
        role: "Signal",
        nodeType: "signal",
        signalData: signal,
      };
      nodes.push(signalNode);

      const nodeExists = nodes.some((node) => node.id === signal.agentKey);
      if (nodeExists) {
        links.push({
          linkType: "signal",
          source: signal.agentKey,
          target: `signal-${signal.id}`,
          id: `signal-link-${signal.id}`,
          linkDirectionalParticles: 0,
          linkColor: getLinkColorFromSource(signal.agentKey, "signal"),
          linkWidth: graphConstants.linkConfig.linkWidths.signalLink,
        });
      }
    });
  }

  return { nodes, links };
}
