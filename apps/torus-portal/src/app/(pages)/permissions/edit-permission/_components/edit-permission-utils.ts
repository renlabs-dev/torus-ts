import type { EditPermissionFormData } from "./edit-permission-schema";

// Transform form data to SDK format for updating permissions
export function transformFormDataToUpdateSDK(data: EditPermissionFormData) {
  const { selectedPermission, newTargets, newStreams, newDistributionControl } =
    data;

  // Convert targets to Map format
  const targetsMap = newTargets?.length
    ? new Map(newTargets.map((target) => [target.agent, BigInt(target.weight)]))
    : undefined;

  // Convert streams to Map format
  const streamsMap = newStreams?.length
    ? new Map(
        newStreams.map((stream) => [stream.agent, BigInt(stream.percentage)]),
      )
    : undefined;

  // Convert distribution control
  let distributionControl = undefined;
  if (newDistributionControl) {
    switch (newDistributionControl.type) {
      case "Manual":
        distributionControl = { Manual: null };
        break;
      case "Automatic":
        distributionControl = { Automatic: null };
        break;
      case "AtBlock":
        distributionControl = {
          AtBlock: BigInt(newDistributionControl.blockNumber),
        };
        break;
      case "Interval":
        distributionControl = {
          Interval: {
            blockNumber: BigInt(newDistributionControl.blockNumber),
            blockInterval: BigInt(newDistributionControl.blockInterval),
          },
        };
        break;
    }
  }

  return {
    permissionId: selectedPermission.permissionId,
    newTargets: targetsMap,
    newStreams: streamsMap,
    newDistributionControl: distributionControl,
  };
}
