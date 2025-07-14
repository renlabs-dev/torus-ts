import type { UseFormReset } from "react-hook-form";
import { match } from "rustie";

import type {
  Api,
  PermissionContract,
  PermissionId,
  SS58Address,
  StreamId,
} from "@torus-network/sdk";
import { queryPermission } from "@torus-network/sdk";

import type { PermissionWithDetails } from "../../../edit-permission/_components/revoke-permission-button";
import type {
  DistributionControlFormData,
  EditPermissionFormData,
} from "./edit-permission-schema";

export function transformPermissionToFormData(
  permission: PermissionContract,
): Partial<EditPermissionFormData> {
  const formData: Partial<EditPermissionFormData> = {};

  // Extract emission permission data
  match(permission.scope)({
    Emission: (emissionScope) => {
      if (emissionScope.targets.size > 0) {
        formData.newTargets = Array.from(emissionScope.targets.entries()).map(
          ([address, weight]) => ({
            address,
            weight: Number(weight),
          }),
        );
      }

      match(emissionScope.allocation)({
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

      const distribution = emissionScope.distribution;
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
      // Curator permissions don't have emission data
    },
    Namespace: () => {
      // Namespace permissions don't have emission data
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
}) {
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

    form.reset({
      permissionId: permissionData.permissions.permissionId,
      newTargets: formData.newTargets ?? [],
      newStreams: formData.newStreams ?? [],
      newDistributionControl: formData.newDistributionControl ?? {
        Manual: null,
      },
    });
  } catch (err) {
    console.error("Error loading permission data:", err);
    onError("Failed to load permission details");
  }
}

export function prepareFormDataForSDK(data: EditPermissionFormData) {
  const { permissionId, newTargets, newStreams, newDistributionControl } = data;

  const sdkTargets = newTargets?.map(
    ({ address, weight }): [SS58Address, number] => [
      address as SS58Address,
      weight,
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
    newTargets: sdkTargets,
    newStreams: sdkStreams,
    newDistributionControl,
  };
}
