import type {
  Api,
  PermissionContract,
  PermissionId,
  StreamId,
} from "@torus-network/sdk/chain";
import { queryPermission } from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";
import type { UseFormReset } from "react-hook-form";
import { match } from "rustie";
import type { PermissionWithDetails } from "./edit-permission-form";
import type {
  DistributionControlFormData,
  EditPermissionFormData,
} from "./edit-permission-schema";

export function getPermissionType(
  permissionData: PermissionWithDetails | null,
): "stream" | "capability" | "unknown" {
  if (!permissionData) return "unknown";

  if (permissionData.emission_permissions) return "stream";
  if (permissionData.namespace_permissions) return "capability";

  return "unknown";
}

export function canEditPermission(
  permissionData: PermissionWithDetails | null,
  userAddress: string | undefined,
): boolean {
  if (!permissionData || !userAddress) return false;

  // Only stream permissions can be edited
  if (!permissionData.emission_permissions) return false;

  // Only the grantor (delegator) can edit permissions
  return permissionData.permissions.grantorAccountId === userAddress;
}

function transformPermissionToFormData(
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

export async function handlePermissionDataChange({
  permissionData,
  api,
  form,
  onError,
}: {
  permissionData: PermissionWithDetails | null;
  api: Api | null;
  form: {
    reset: UseFormReset<EditPermissionFormData>;
  };
  onError: (message: string) => void;
}): Promise<{ originalDistributionControl: string } | undefined> {
  if (!api || !permissionData) return;

  try {
    const [error, permission] = await queryPermission(
      api,
      permissionData.permissions.permissionId as `0x${string}`,
    );

    if (error || !permission) {
      onError("Failed to load permission details");
      return;
    }

    const formData = transformPermissionToFormData(permission);

    // Get the original distribution control type as a string
    let originalDistributionControl = "Manual";
    if (formData.newDistributionControl) {
      originalDistributionControl = match(formData.newDistributionControl)({
        Manual: () => "Manual",
        Automatic: (threshold) => `Automatic (threshold: ${threshold})`,
        AtBlock: (block) => `At Block ${block}`,
        Interval: (interval) => `Every ${interval} blocks`,
      });
    }

    form.reset({
      permissionId: permissionData.permissions.permissionId,
      newTargets: formData.newTargets ?? [],
      newStreams: formData.newStreams ?? [],
      newDistributionControl: formData.newDistributionControl ?? {
        Manual: null,
      },
    });

    return { originalDistributionControl };
  } catch (err) {
    console.error("Error loading permission data:", err);
    onError("Failed to load permission details");
    return undefined;
  }
}

export function prepareFormDataForSDK(data: EditPermissionFormData) {
  const { permissionId, newTargets, newStreams, newDistributionControl } = data;

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
  };
}
