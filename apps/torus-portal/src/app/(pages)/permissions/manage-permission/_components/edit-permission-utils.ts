import type {
  PermissionContract,
  PermissionId,
  StreamId,
} from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";
import { match } from "rustie";
import type {
  DistributionControlFormData,
  EditPermissionFormData,
} from "./edit-permission-schema";

export function getPermissionTypeFromContract(
  contract: PermissionContract | null,
): "stream" | "capability" | "unknown" {
  if (!contract) return "unknown";

  if ("Stream" in contract.scope) return "stream";
  if ("Namespace" in contract.scope) return "capability";

  return "unknown";
}

export function canEditPermissionFromContract(
  contract: PermissionContract | null,
  userAddress: string | undefined,
): boolean {
  if (!contract || !userAddress) return false;

  // Only stream permissions can be edited
  if (!("Stream" in contract.scope)) return false;

  // Only the grantor (delegator) can edit permissions
  return contract.delegator === userAddress;
}

export function transformPermissionToFormData(
  permission: PermissionContract,
): Partial<EditPermissionFormData> {
  const formData: Partial<EditPermissionFormData> = {};

  // Extract stream permission data
  match(permission.scope)({
    Stream: (streamScope) => {
      if (streamScope.recipients.size > 0) {
        formData.newTargets = Array.from(streamScope.recipients.entries()).map(
          ([address, weight]) => ({
            address,
            percentage: Number(weight), // SDK uses weight, but we display as percentage
          }),
        );
      }

      match(streamScope.allocation)({
        Streams: (streamsMap) => {
          if (streamsMap.size > 0) {
            formData.newStreams = Array.from(streamsMap.entries()).map(
              ([streamId, percentage]) => ({
                streamId,
                percentage,
              }),
            );
          }
        },
        FixedAmount: () => {
          // Fixed amount allocations don't have streams
        },
      });

      const distribution = streamScope.distribution;
      formData.newDistributionControl = match(distribution)({
        Manual: () => ({ Manual: null }),
        Automatic: (threshold) =>
          ({ Automatic: threshold }) as DistributionControlFormData,
        AtBlock: (blockNumber) =>
          ({ AtBlock: blockNumber }) as DistributionControlFormData,
        Interval: (blockInterval) =>
          ({ Interval: blockInterval }) as DistributionControlFormData,
      });

      // Extract recipient manager and weight setter
      // Note: These are arrays in the chain data, but the form only supports single values
      // We'll use the first value if available
      if (streamScope.recipientManagers.length > 0) {
        formData.recipientManager = streamScope.recipientManagers[0];
      }

      if (streamScope.weightSetters.length > 0) {
        formData.weightSetter = streamScope.weightSetters[0];
      }
    },
    Curator: () => {
      // Curator permissions don't have stream data
    },
    Namespace: () => {
      // Namespace permissions don't have stream data
    },
  });

  return formData;
}

export function prepareFormDataForSDK(data: EditPermissionFormData) {
  const {
    permissionId,
    newTargets,
    newStreams,
    newDistributionControl,
    recipientManager,
    weightSetter,
  } = data;

  const sdkTargets = newTargets?.map(
    ({ address, percentage }): [SS58Address, number] => [
      address as SS58Address,
      percentage, // SDK expects weight, but we use percentage (they're the same value)
    ],
  );

  const sdkStreams = newStreams?.length
    ? new Map(
        newStreams.map(({ streamId, percentage }): [StreamId, number] => [
          streamId as StreamId,
          percentage,
        ]),
      )
    : undefined;

  return {
    permissionId: permissionId as PermissionId,
    newRecipients: sdkTargets,
    newStreams: sdkStreams,
    newDistributionControl,
    recipientManager,
    weightSetter,
  };
}
