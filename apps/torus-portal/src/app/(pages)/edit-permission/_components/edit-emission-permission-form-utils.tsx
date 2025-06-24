import type {
  SS58Address,
  DistributionControl,
  PermissionContract,
} from "@torus-network/sdk";
import { match, if_let } from "rustie";
import type {
  EditEmissionPermissionFormData,
  PermissionInfo,
} from "./edit-emission-permission-form-schema";

// Transform permission contract to form data
export function transformPermissionToFormData(
  permission: PermissionContract,
  currentBlock: bigint,
  userAddress: SS58Address,
): PermissionInfo {
  // Determine edit permissions based on role and revocation terms
  const isGrantor = permission.grantor === userAddress;

  // Based on SDK comments at lines 726-738 in permission0.ts:
  // If you call as a grantee: you can only provide the new_targets,
  // whenever you want, no limits. if the grantee sends
  // new_streams/new_distribution_control, the extrinsic fails.
  // If you call as a grantor: you can send all the values,
  // but only if the revocation term: is RevocableByGrantor
  // is RevocableAfter(N) and CurrentBlock > N
  const canEditStreams = isGrantor
    ? canGrantorEdit(permission, currentBlock)
    : false;
  const canEditDistribution = isGrantor
    ? canGrantorEdit(permission, currentBlock)
    : false;

  // Extract current emission scope data
  const emissionScope = if_let(permission.scope, "Emission")(
    (scope) => scope,
    () => null,
  );

  if (!emissionScope) {
    throw new Error("Permission is not an emission permission");
  }

  // Extract current targets
  const currentTargets = Array.from(emissionScope.targets.entries()).map(
    ([account, weight]) => ({
      account,
      weight: weight.toString(),
    }),
  );

  // Extract current streams if available
  const currentStreams = if_let(emissionScope.allocation, "Streams")(
    (streams) =>
      Array.from(streams.entries()).map(([streamId, percentage]) => ({
        streamId,
        percentage: percentage.toString(),
      })),
    () => null,
  );

  // Extract current distribution
  const currentDistribution = transformDistributionToFormData(
    emissionScope.distribution,
  );

  return {
    permissionId: "", // Will be set by caller
    grantor: permission.grantor,
    grantee: permission.grantee,
    userRole: isGrantor ? "grantor" : "grantee",
    canEditStreams,
    canEditDistribution,
    currentTargets,
    currentStreams,
    currentDistribution,
  };
}

// Check if grantor can edit based on revocation terms
function canGrantorEdit(
  permission: PermissionContract,
  currentBlock: bigint,
): boolean {
  return match(permission.revocation)({
    RevocableByGrantor() {
      return true;
    },
    RevocableAfter(blockNumber) {
      return currentBlock > BigInt(blockNumber);
    },
    Irrevocable() {
      return false;
    },
    RevocableByArbiters() {
      return false;
    },
  });
}

// Transform distribution control to form data
function transformDistributionToFormData(
  distribution: DistributionControl,
):
  | { type: "Manual" }
  | { type: "Automatic"; threshold: string }
  | { type: "AtBlock"; blockNumber: string }
  | { type: "Interval"; blocks: string } {
  if ("Manual" in distribution) {
    return { type: "Manual" };
  } else if ("Automatic" in distribution) {
    return {
      type: "Automatic",
      threshold: (Number(distribution.Automatic) / 1e6).toString(), // Convert from micro units
    };
  } else if ("AtBlock" in distribution) {
    return {
      type: "AtBlock",
      blockNumber: distribution.AtBlock.toString(),
    };
  } else if ("Interval" in distribution) {
    return {
      type: "Interval",
      blocks: distribution.Interval.toString(),
    };
  }
  // Default fallback
  return { type: "Manual" };
}

// Transform form data to SDK format for update
export function transformFormDataToUpdateSDK(
  data: EditEmissionPermissionFormData,
) {
  const { selectedPermission, newTargets, newStreams, newDistributionControl } =
    data;

  // Transform targets (always provided)
  const targets: [SS58Address, number][] = newTargets.map((target) => [
    target.account as SS58Address,
    parseInt(target.weight),
  ]);

  // Transform streams (optional)
  const streams = newStreams?.length
    ? new Map(
        newStreams.map((stream) => [
          stream.streamId as `0x${string}`,
          parseFloat(stream.percentage),
        ]),
      )
    : undefined;

  // Transform distribution control (optional)
  let distribution: DistributionControl | undefined;
  if (newDistributionControl) {
    switch (newDistributionControl.type) {
      case "Manual":
        distribution = { Manual: null };
        break;
      case "Automatic":
        distribution = {
          Automatic: BigInt(parseFloat(newDistributionControl.threshold) * 1e6),
        };
        break;
      case "AtBlock":
        distribution = {
          AtBlock: parseInt(newDistributionControl.blockNumber),
        };
        break;
      case "Interval":
        distribution = { Interval: parseInt(newDistributionControl.blocks) };
        break;
    }
  }

  return {
    permissionId: selectedPermission.permissionId as `0x${string}`,
    newTargets: targets,
    newStreams: streams,
    newDistributionControl: distribution,
  };
}

// Helper to check if user has any editable permissions
export function hasEditablePermissions(
  grantorPermissions: readonly string[],
): boolean {
  // Only grantors can edit permissions
  return grantorPermissions.length > 0;
}
