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
 * Generates a random particle speed between min and max values for asynchronous animation.
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

export function createAllocatorNode(allocatorAddress: string): CustomGraphNode {
  return {
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
    agentData: {
      accountId: allocatorAddress,
      isWhitelisted: true,
    },
  };
}


export function createPermissionNodes(
  permissionDetails: PermissionDetail[] | undefined,
): CustomGraphNode[] {
  if (!permissionDetails || permissionDetails.length === 0) {
    return [];
  }

  return permissionDetails.map((permission, index) => {
    const permissionId = permission.permissionId ?? `perm-${Math.random()}`;
    const permissionType = permission.permissionType ?? "emission";
    
    // Position permission nodes in a middle ring
    const angle = (index * 2 * Math.PI) / permissionDetails.length;
    const radius = 250;
    
    return {
      id: `permission-${permissionId}`,
      name: `${permissionType.toUpperCase()}`,
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
        grantorKey: permission.grantorKey ?? "",
        granteeKey: permission.granteeKey ?? "",
        scope: permission.scope,
        duration: permission.duration,
      },
    };
  });
}

export function createAgentNodes(
  permissionDetails: PermissionDetail[] | undefined,
  computedWeights: ComputedWeight[] | undefined,
  allocatorAddress: string,
): { rootNodes: CustomGraphNode[], otherAgentNodes: CustomGraphNode[] } {
  const allAgentKeys = new Set<string>();
  const rootAgentKeys = new Set<string>();
  
  // Add allocator
  allAgentKeys.add(allocatorAddress);
  
  // Add all agents with computed weights as root nodes
  if (computedWeights) {
    computedWeights.forEach(agent => {
      allAgentKeys.add(agent.agentKey);
      rootAgentKeys.add(agent.agentKey);
    });
  }
  
  // Add all grantors and grantees from permissions
  if (permissionDetails) {
    permissionDetails.forEach(permission => {
      if (permission.grantorKey) allAgentKeys.add(permission.grantorKey);
      if (permission.granteeKey) allAgentKeys.add(permission.granteeKey);
    });
  }
  
  const allAgentKeysArray = Array.from(allAgentKeys).filter(key => key !== allocatorAddress);
  const rootNodes: CustomGraphNode[] = [];
  const otherAgentNodes: CustomGraphNode[] = [];
  
  allAgentKeysArray.forEach((agentKey, index) => {
    const isRootAgent = rootAgentKeys.has(agentKey);
    const angle = (index * 2 * Math.PI) / allAgentKeysArray.length;
    
    if (isRootAgent) {
      // Create root node with weight-based sizing
      const agentWeight = computedWeights?.find(w => w.agentKey === agentKey);
      const rawWeight = agentWeight?.percComputedWeight ?? 1;
      const weight = Number.isFinite(rawWeight) && rawWeight > 0 ? rawWeight : 1;
      const val = Math.max(
        Math.pow(weight, GRAPH_CONSTANTS.WEIGHT_POWER) / GRAPH_CONSTANTS.SCALE_FACTOR,
        GRAPH_CONSTANTS.ROOT_NODE_SIZE,
      );
      
      rootNodes.push({
        id: agentKey,
        name: smallAddress(agentKey),
        color: GRAPH_CONSTANTS.COLORS.ROOT_NODE,
        val,
        fullAddress: agentKey,
        role: "Root Agent",
        nodeType: "root_agent",
        x: Math.cos(angle) * 150,
        y: Math.sin(angle) * 150,
        z: (Math.random() - 0.5) * 50,
        agentData: {
          accountId: agentKey,
          isWhitelisted: true,
          isAllocated: true,
        },
      });
    } else {
      // Create regular agent node
      otherAgentNodes.push({
        id: agentKey,
        name: smallAddress(agentKey),
        color: GRAPH_CONSTANTS.COLORS.TARGET_NODE,
        val: GRAPH_CONSTANTS.TARGET_NODE_SIZE,
        fullAddress: agentKey,
        role: "Agent",
        nodeType: "target_agent",
        x: Math.cos(angle) * 350,
        y: Math.sin(angle) * 350,
        z: (Math.random() - 0.5) * 40,
        agentData: {
          accountId: agentKey,
        },
      });
    }
  });
  
  return { rootNodes, otherAgentNodes };
}

export function createPermissionOwnershipLinks(
  permissionDetails: PermissionDetail[] | undefined,
  nodeIds: Set<string>,
): CustomGraphLink[] {
  if (!permissionDetails || permissionDetails.length === 0) {
    return [];
  }

  return permissionDetails
    .filter((permission) => 
      permission.grantorKey && 
      permission.permissionId &&
      nodeIds.has(permission.grantorKey) &&
      nodeIds.has(`permission-${permission.permissionId}`)
    )
    .map((permission) => ({
      linkType: "permission_ownership",
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      source: permission.grantorKey!,
      target: `permission-${permission.permissionId}`,
      id: `ownership-${permission.permissionId}`,
      linkDirectionalArrowLength: 4,
      linkDirectionalArrowRelPos: 1,
      linkDirectionalParticles: 1,
      linkDirectionalParticleSpeed: getRandomParticleSpeed(),
      linkDirectionalParticleResolution: GRAPH_CONSTANTS.PARTICLE_RESOLUTION,
      linkWidth: 1,
      linkColor: GRAPH_CONSTANTS.COLORS.PERMISSION_LINK,
    }));
}

export function createPermissionTargetLinks(
  permissionDetails: PermissionDetail[] | undefined,
  nodeIds: Set<string>,
): CustomGraphLink[] {
  if (!permissionDetails || permissionDetails.length === 0) {
    return [];
  }

  return permissionDetails
    .filter((permission) => 
      permission.granteeKey && 
      permission.permissionId &&
      nodeIds.has(`permission-${permission.permissionId}`) &&
      nodeIds.has(permission.granteeKey)
    )
    .map((permission) => ({
      linkType: "permission_target",
      source: `permission-${permission.permissionId}`,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      target: permission.granteeKey!,
      id: `target-${permission.permissionId}`,
      linkDirectionalArrowLength: 6,
      linkDirectionalArrowRelPos: 1,
      linkDirectionalParticles: 2,
      linkDirectionalParticleSpeed: getRandomParticleSpeed(),
      linkDirectionalParticleResolution: GRAPH_CONSTANTS.PARTICLE_RESOLUTION,
      linkWidth: 2,
      linkColor: GRAPH_CONSTANTS.COLORS.PERMISSION_TO_TARGET_LINK,
    }));
}

export function createAllocationLinks(
  computedWeights: ComputedWeight[] | undefined,
  allocatorAddress: string,
  existingLinks: CustomGraphLink[],
): CustomGraphLink[] {
  if (!computedWeights || computedWeights.length === 0) {
    return [];
  }

  const allocationLinks: CustomGraphLink[] = [];

  computedWeights.forEach((agent) => {
    const agentKey = agent.agentKey;
    const computedAgentWeight = agent.percComputedWeight;

    const linkExists = existingLinks.some(
      (link) =>
        link.source === allocatorAddress &&
        link.target === agentKey &&
        link.scope === "allocation",
    );

    if (!linkExists && allocatorAddress !== agentKey) {
      allocationLinks.push({
        linkType: "allocation",
        source: allocatorAddress,
        target: agentKey,
        id: `allocation-${agentKey}`,
        linkDirectionalParticles: Math.max(
          GRAPH_CONSTANTS.MIN_PARTICLES,
          computedAgentWeight,
        ),
        linkDirectionalParticleWidth:
          GRAPH_CONSTANTS.ALLOCATION_LINK.particleWidth,
        linkDirectionalParticleSpeed: getRandomParticleSpeed(),
        linkDirectionalParticleResolution: GRAPH_CONSTANTS.PARTICLE_RESOLUTION,
        linkColor: GRAPH_CONSTANTS.COLORS.ALLOCATION_LINK,
        linkWidth: GRAPH_CONSTANTS.ALLOCATION_LINK.width,
      });
    }
  });

  return allocationLinks;
}

export function createSignalNodes(
  signals: SignalsList | undefined,
): CustomGraphNode[] {
  if (!signals || signals.length === 0) {
    return [];
  }

  return signals.map((signal) => ({
    id: `signal-${signal.id}`,
    name: signal.title,
    color: GRAPH_CONSTANTS.COLORS.SIGNAL,
    val: GRAPH_CONSTANTS.SIGNAL_NODE_SIZE,
    role: "Signal",
    nodeType: "signal" as const,
    signalData: signal,
  }));
}

export function createSignalLinks(
  signals: SignalsList | undefined,
): CustomGraphLink[] {
  if (!signals || signals.length === 0) {
    return [];
  }

  return signals.map((signal) => ({
    linkType: "signal",
    source: signal.agentKey,
    target: `signal-${signal.id}`,
    id: `signal-link-${signal.id}`,
    linkDirectionalParticles: 0,
    linkColor: GRAPH_CONSTANTS.COLORS.SIGNAL_LINK,
    linkWidth: GRAPH_CONSTANTS.SIGNAL_LINK.width,
  }));
}

export function createAgentWeightMap(
  computedWeights: ComputedWeight[] | undefined,
): Map<string, number> {
  const agentWeightMap = new Map<string, number>();

  if (computedWeights) {
    computedWeights.forEach((agent) => {
      const weight = agent.percComputedWeight;
      if (Number.isFinite(weight) && weight >= 0) {
        agentWeightMap.set(agent.agentKey, weight);
      }
    });
  }

  return agentWeightMap;
}

export function createGraphData(
  permissionDetails: PermissionDetail[] | undefined,
  computedWeights: ComputedWeight[] | undefined,
  allocatorAddress: string,
  signals?: SignalsList,
): CustomGraphData | null {
  if (
    (!permissionDetails || permissionDetails.length === 0) &&
    (!computedWeights || computedWeights.length === 0)
  ) {
    return null;
  }


  // Create all nodes first
  const allocatorNode = createAllocatorNode(allocatorAddress);
  const { rootNodes, otherAgentNodes } = createAgentNodes(permissionDetails, computedWeights, allocatorAddress);
  const permissionNodes = createPermissionNodes(permissionDetails);
  const signalNodes = createSignalNodes(signals);

  // Create a map of all node IDs for validation
  const allNodes = [
    allocatorNode,
    ...rootNodes,
    ...otherAgentNodes,
    ...permissionNodes,
    ...signalNodes,
  ];
  const nodeIds = new Set(allNodes.map(node => node.id));

  // Create links and filter out any that reference non-existent nodes
  const allocationLinks = createAllocationLinks(
    computedWeights,
    allocatorAddress,
    [], // No existing links to check against
  ).filter(link => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    return sourceId && targetId && nodeIds.has(String(sourceId)) && nodeIds.has(String(targetId));
  });

  const permissionOwnershipLinks = createPermissionOwnershipLinks(permissionDetails, nodeIds);
  const permissionTargetLinks = createPermissionTargetLinks(permissionDetails, nodeIds);
  const signalLinks = createSignalLinks(signals).filter(link => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    return sourceId && targetId && nodeIds.has(String(sourceId)) && nodeIds.has(String(targetId));
  });

  return {
    nodes: allNodes,
    links: [
      ...allocationLinks,
      ...permissionOwnershipLinks,
      ...permissionTargetLinks,
      ...signalLinks,
    ],
  };
}
