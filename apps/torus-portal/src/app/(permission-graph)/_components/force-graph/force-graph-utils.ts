import { smallAddress } from "@torus-network/torus-utils/subspace";
import type {
  CustomGraphNode,
  CustomGraphLink,
  CustomGraphData,
  PermissionDetailsBase,
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

export type PermissionDetail = PermissionDetailsBase[number] & {
  remainingBlocks?: number;
};

export interface ComputedWeight {
  agentKey: string;
  percComputedWeight: number;
}

export function createNodes(
  uniqueAddresses: Set<string>,
  permissionDetails: PermissionDetail[] | undefined,
  agentWeightMap: Map<string, number>,
  allocatorAddress: string,
): CustomGraphNode[] {
  return Array.from(uniqueAddresses).map((address) => {
    const isGrantor =
      permissionDetails?.some((p) => p.grantor_key === address) ?? false;
    const isGrantee =
      permissionDetails?.some((p) => p.grantee_key === address) ?? false;
    const isAllocator = address === allocatorAddress;

    const hasWeight = agentWeightMap.has(address);
    const isAllocatedOnly =
      hasWeight && !isGrantor && !isGrantee && !isAllocator;
    const isConnectedToAllocator = hasWeight && !isAllocator;

    let color: string = GRAPH_CONSTANTS.COLORS.DEFAULT;
    let role = "";

    if (isAllocator) {
      color = GRAPH_CONSTANTS.COLORS.ALLOCATOR;
      role = "Allocator";
    } else if (isConnectedToAllocator) {
      color = GRAPH_CONSTANTS.COLORS.ALLOCATED_AGENT;

      if (isAllocatedOnly) {
        role = "Allocated Agent";
      } else if (isGrantor && isGrantee) {
        role = "Both";
      } else if (isGrantor) {
        role = "Grantor";
      } else if (isGrantee) {
        role = "Grantee";
      }
    } else {
      if (isGrantor && isGrantee) {
        color = GRAPH_CONSTANTS.COLORS.BOTH;
        role = "Both";
      } else if (isGrantor) {
        color = GRAPH_CONSTANTS.COLORS.GRANTOR;
        role = "Grantor";
      } else if (isGrantee) {
        color = GRAPH_CONSTANTS.COLORS.GRANTEE;
        role = "Grantee";
      }
    }

    const rawWeight = agentWeightMap.get(address) ?? 1;
    const weight = Number.isFinite(rawWeight) && rawWeight > 0 ? rawWeight : 1;
    const val = isAllocator
      ? GRAPH_CONSTANTS.ALLOCATOR_NODE_SIZE
      : Math.max(
          Math.pow(weight, GRAPH_CONSTANTS.WEIGHT_POWER) /
            GRAPH_CONSTANTS.SCALE_FACTOR,
          GRAPH_CONSTANTS.MIN_NODE_SIZE,
        );

    const node: CustomGraphNode = {
      id: address,
      name: smallAddress(address),
      color,
      val,
      fullAddress: address,
      role,
    };

    if (isAllocator) {
      node.fx = 0;
      node.fy = 0;
      node.fz = 0;
    }

    return node;
  });
}

export function createPermissionLinks(
  permissionDetails: PermissionDetail[] | undefined,
): CustomGraphLink[] {
  if (!permissionDetails || permissionDetails.length === 0) {
    return [];
  }

  return permissionDetails.map((permission) => ({
    linkType: "permission",
    source: permission.grantor_key,
    target: permission.grantee_key,
    id: permission.permission_id,
    scope: permission.scope,
    duration: permission.duration,
    parentId: permission.parent_id ?? "",
    enforcement: "default_enforcement",
    linkDirectionalArrowLength:
      GRAPH_CONSTANTS.PERMISSION_LINK.directionalArrowLength,
    linkDirectionalArrowRelPos:
      GRAPH_CONSTANTS.PERMISSION_LINK.directionalArrowRelPos,
    linkDirectionalParticles: GRAPH_CONSTANTS.MIN_PARTICLES,
    linkDirectionalParticleSpeed: getRandomParticleSpeed(),
    linkDirectionalParticleResolution: GRAPH_CONSTANTS.PARTICLE_RESOLUTION,
    linkWidth: GRAPH_CONSTANTS.PERMISSION_LINK.width,
    linkColor: GRAPH_CONSTANTS.COLORS.PERMISSION_LINK,
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
): CustomGraphData | null {
  if (
    (!permissionDetails || permissionDetails.length === 0) &&
    (!computedWeights || computedWeights.length === 0)
  ) {
    return null;
  }

  const agentWeightMap = createAgentWeightMap(computedWeights);
  const uniqueAddresses = new Set<string>();

  if (permissionDetails && permissionDetails.length > 0) {
    permissionDetails.forEach((permission) => {
      uniqueAddresses.add(permission.grantor_key);
      uniqueAddresses.add(permission.grantee_key);
    });
  }

  if (computedWeights && computedWeights.length > 0) {
    uniqueAddresses.add(allocatorAddress);
    computedWeights.forEach((agent) => {
      uniqueAddresses.add(agent.agentKey);
    });
  }

  const nodes = createNodes(
    uniqueAddresses,
    permissionDetails,
    agentWeightMap,
    allocatorAddress,
  );
  const permissionLinks = createPermissionLinks(permissionDetails);
  const allocationLinks = createAllocationLinks(
    computedWeights,
    allocatorAddress,
    permissionLinks,
  );

  return {
    nodes,
    links: [...permissionLinks, ...allocationLinks],
  };
}
