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

export type FieldType =
  | "recipients"
  | "weights"
  | "streams"
  | "distributionControl"
  | "recipientManager"
  | "weightSetter";

export function getPermissionTypeFromContract(
  contract: PermissionContract | null,
): "stream" | "capability" | "curator" | "unknown" {
  if (!contract) return "unknown";

  if ("Stream" in contract.scope) return "stream";
  if ("Namespace" in contract.scope) return "capability";
  if ("Curator" in contract.scope) return "curator";

  return "unknown";
}

/**
 * Check if user can edit a specific field based on their role
 * Based on new-fields.md specification:
 * - Delegators can update all fields
 * - Recipient managers can update recipients (add/remove)
 * - Weight setters can only update recipient weights (not add/remove)
 */
export function canUserEditField(
  contract: PermissionContract | null,
  userAddress: string | undefined,
  fieldType: FieldType,
): boolean {
  if (!contract || !userAddress) return false;

  // Only stream permissions can be edited
  if (!("Stream" in contract.scope)) return false;

  const stream = contract.scope.Stream;
  const isDelegator = contract.delegator === userAddress;
  const isRecipientManager = stream.recipientManagers.includes(
    userAddress as SS58Address,
  );
  const isWeightSetter = stream.weightSetters.includes(
    userAddress as SS58Address,
  );

  switch (fieldType) {
    case "recipients":
      return isDelegator || isRecipientManager;

    case "weights":
      return isDelegator || isRecipientManager || isWeightSetter;

    case "streams":
      return isDelegator;

    case "distributionControl":
      return isDelegator;

    case "recipientManager":
      return isDelegator;

    case "weightSetter":
      return isDelegator;

    default:
      return false;
  }
}

/**
 * Check if user can only edit weights (not add/remove recipients)
 * Weight setters can only modify existing recipient weights
 */
export function isWeightSetterOnly(
  contract: PermissionContract | null,
  userAddress: string | undefined,
): boolean {
  if (!contract || !userAddress) return false;

  if (!("Stream" in contract.scope)) return false;

  const stream = contract.scope.Stream;
  const isDelegator = contract.delegator === userAddress;
  const isRecipientManager = stream.recipientManagers.includes(
    userAddress as SS58Address,
  );
  const isWeightSetter = stream.weightSetters.includes(
    userAddress as SS58Address,
  );

  return isWeightSetter && !isDelegator && !isRecipientManager;
}

export function canUserRevokePermission(
  contract: PermissionContract | null,
  userAddress: string | undefined,
): boolean {
  if (!contract || !userAddress) return false;

  return match(contract.revocation)({
    RevocableByDelegator: () => contract.delegator === userAddress,
    RevocableByArbiters: (arbiters) =>
      arbiters.accounts.includes(userAddress as SS58Address) ||
      contract.delegator === userAddress,
    RevocableAfter: () => contract.delegator === userAddress,
    Irrevocable: () => false,
  });
}

/**
 * Check if user can edit any field of the permission
 * Returns true if user can edit at least one field (weights, recipients, streams, etc.)
 */
export function canEditPermissionFromContract(
  contract: PermissionContract | null,
  userAddress: string | undefined,
): boolean {
  return canUserEditField(contract, userAddress, "weights");
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
            percentage: Number(weight),
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
    Wallet: () => {
      // Wallet permissions don't have stream data
    },
  });

  return formData;
}

export function prepareFormDataForSDK(
  data: EditPermissionFormData,
  contract: PermissionContract | null,
  userAddress: string | undefined,
) {
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

  if (!contract || !userAddress) {
    return {
      permissionId: permissionId as PermissionId,
    };
  }

  if (!("Stream" in contract.scope)) {
    return {
      permissionId: permissionId as PermissionId,
    };
  }

  const stream = contract.scope.Stream;
  const isDelegator = contract.delegator === userAddress;
  const isWeightSetter = stream.weightSetters.includes(
    userAddress as SS58Address,
  );
  const isRecipientManager = stream.recipientManagers.includes(
    userAddress as SS58Address,
  );

  if (isWeightSetter && !isDelegator && !isRecipientManager) {
    return {
      permissionId: permissionId as PermissionId,
      newRecipients: sdkTargets,
    };
  }

  // For delegators and recipient managers, include all authorized fields
  const result: {
    permissionId: PermissionId;
    newRecipients?: [SS58Address, number][];
    newStreams?: Map<StreamId, number>;
    newDistributionControl?: typeof newDistributionControl;
    recipientManager?: SS58Address;
    weightSetter?: SS58Address;
  } = {
    permissionId: permissionId as PermissionId,
  };

  // Include recipients if user can edit them
  if (canUserEditField(contract, userAddress, "recipients") && sdkTargets) {
    result.newRecipients = sdkTargets;
  }

  // Include streams if user can edit them
  if (canUserEditField(contract, userAddress, "streams") && sdkStreams) {
    result.newStreams = sdkStreams;
  }

  // Include distribution control if user can edit it
  if (canUserEditField(contract, userAddress, "distributionControl")) {
    result.newDistributionControl = newDistributionControl;
  }

  // Include recipient manager if user can edit it
  if (canUserEditField(contract, userAddress, "recipientManager")) {
    result.recipientManager = recipientManager;
  }

  // Include weight setter if user can edit it
  if (canUserEditField(contract, userAddress, "weightSetter")) {
    result.weightSetter = weightSetter;
  }

  return result;
}
