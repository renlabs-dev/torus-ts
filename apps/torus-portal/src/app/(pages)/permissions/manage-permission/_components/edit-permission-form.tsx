"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { PermissionContract } from "@torus-network/sdk/chain";
import { updateStreamPermission } from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";
import type { InferSelectModel } from "@torus-ts/db";
import type {
  emissionPermissionsSchema,
  namespacePermissionsSchema,
  permissionsSchema,
} from "@torus-ts/db/schema";
import { useTorus } from "@torus-ts/torus-provider";
import { useSendTransaction } from "@torus-ts/torus-provider/use-send-transaction";
import { Button } from "@torus-ts/ui/components/button";
import { Form } from "@torus-ts/ui/components/form";
import { WalletConnectionWarning } from "@torus-ts/ui/components/wallet-connection-warning";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { cn } from "@torus-ts/ui/lib/utils";
import { PermissionSelector } from "~/app/_components/permission-selector/permission-selector";
import { getPrimaryRoleBadge } from "~/app/_components/permission-selector/permission-selector.utils";
import PortalFormHeader from "~/app/_components/portal-form-header";
import { PortalFormSeparator } from "~/app/_components/portal-form-separator";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { DistributionControlField } from "./edit-permission-fields/distribution-control-field";
import { RecipientManagerField } from "./edit-permission-fields/recipient-manager-field";
import { RecipientsField } from "./edit-permission-fields/recipients-field";
import { StreamsField } from "./edit-permission-fields/streams-field";
import { WeightSetterField } from "./edit-permission-fields/weight-setter-field";
import type { EditPermissionFormData } from "./edit-permission-schema";
import { EDIT_PERMISSION_SCHEMA } from "./edit-permission-schema";
import { SubmitConfirmationDialog, type ChangeDetail } from "./submit-confirmation-dialog";
import {
  canEditPermissionFromContract,
  canUserEditField,
  canUserRevokePermission,
  getPermissionTypeFromContract,
  isWeightSetterOnly,
  prepareFormDataForSDK,
  transformPermissionToFormData,
} from "./edit-permission-utils";
import { PermissionTypeInfo } from "./permission-type-info";
import { RevokePermissionButton } from "./revoke-permission-button";

type PermissionData = InferSelectModel<typeof permissionsSchema>;
type EmissionPermissionData = InferSelectModel<
  typeof emissionPermissionsSchema
>;
type NamespacePermissionData = InferSelectModel<
  typeof namespacePermissionsSchema
>;

export interface PermissionWithDetails {
  permissions: PermissionData;
  emission_permissions: EmissionPermissionData | null;
  namespace_permissions: NamespacePermissionData | null;
}

export function EditPermissionForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const {
    api,
    isAccountConnected,
    isInitialized,
    selectedAccount,
    torusApi,
    wsEndpoint,
  } = useTorus();

  const { sendTx, isPending, isSigning } = useSendTransaction({
    api,
    selectedAccount,
    wsEndpoint,
    wallet: torusApi,
    transactionType: "Update Stream Permission",
  });
  // Initialize selectedPermissionId from URL parameter if available
  const permissionIdFromUrl = searchParams.get("id");
  const [selectedPermissionId, setSelectedPermissionId] = useState<string>(
    permissionIdFromUrl || "",
  );
  const [selectedPermissionContract, setSelectedPermissionContract] =
    useState<PermissionContract | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<EditPermissionFormData | null>(null);
  const [originalFormData, setOriginalFormData] = useState<EditPermissionFormData | null>(null);

  const permissionType = getPermissionTypeFromContract(
    selectedPermissionContract,
  );
  const canEdit = canEditPermissionFromContract(
    selectedPermissionContract,
    selectedAccount?.address,
  );
  const isGrantor =
    selectedPermissionContract?.delegator === selectedAccount?.address;
  const canRevoke = canUserRevokePermission(
    selectedPermissionContract,
    selectedAccount?.address,
  );
  const userRole =
    selectedPermissionContract && selectedAccount?.address
      ? getPrimaryRoleBadge(
          selectedPermissionContract,
          selectedAccount.address as SS58Address,
        )
      : null;
  const isWeightsOnlyUser = isWeightSetterOnly(
    selectedPermissionContract,
    selectedAccount?.address,
  );

  const form = useForm<EditPermissionFormData>({
    disabled: !isAccountConnected,
    resolver: zodResolver(EDIT_PERMISSION_SCHEMA),
    mode: "onChange",
    defaultValues: {
      permissionId: "",
      newTargets: [],
      newStreams: [],
      newDistributionControl: { Manual: null },
      recipientManager: undefined,
      weightSetter: undefined,
    },
  });

  const { isDirty } = form.formState;

  // Set form value when URL parameter is available on initial render
  useEffect(() => {
    if (permissionIdFromUrl && !selectedPermissionId) {
      form.setValue("permissionId", permissionIdFromUrl);
    }
  }, [permissionIdFromUrl, form, selectedPermissionId]);

  const handlePermissionLoad = useCallback(
    (permissionId: string, contract: PermissionContract) => {
      setSelectedPermissionContract(contract);

      // Check if it's a stream permission and load form data
      if ("Stream" in contract.scope) {
        const formData = transformPermissionToFormData(contract);

        const initialData = {
          permissionId,
          newTargets: formData.newTargets ?? [],
          newStreams: formData.newStreams ?? [],
          newDistributionControl: formData.newDistributionControl ?? {
            Manual: null,
          },
          recipientManager: formData.recipientManager,
          weightSetter: formData.weightSetter,
        };

        // Store original data for comparison
        setOriginalFormData(initialData);
        
        form.reset(initialData);
      }
    },
    [form],
  );

  // Helper function to get detailed change information by comparing with original data
  function getChangeDetails(currentData: EditPermissionFormData): ChangeDetail[] {
    const changes: ChangeDetail[] = [];
    const unchanged: ChangeDetail[] = [];
    
    if (!originalFormData) return changes;
    
    // Compare recipients
    const originalTargets = originalFormData.newTargets || [];
    const currentTargets = currentData.newTargets || [];
    
    // Check for added recipients
    currentTargets.forEach((target) => {
      if (target.address && target.percentage !== undefined) {
        const existsInOriginal = originalTargets.some(orig => orig.address === target.address);
        if (!existsInOriginal) {
          const shortAddress = `${target.address.slice(0, 6)}...${target.address.slice(-4)}`;
          changes.push({
            type: 'added',
            field: 'Recipients',
            description: `Recipient added: ${shortAddress}`
          });
          changes.push({
            type: 'added',
            field: 'Recipients',
            description: `Weight set for ${shortAddress}: ${target.percentage}%`
          });
        }
      }
    });
    
    // Check for modified recipients (weight changes)
    currentTargets.forEach((target) => {
      if (target.address && target.percentage !== undefined) {
        const original = originalTargets.find(orig => orig.address === target.address);
        if (original && original.percentage !== target.percentage) {
          const shortAddress = `${target.address.slice(0, 6)}...${target.address.slice(-4)}`;
          changes.push({
            type: 'modified',
            field: 'Recipients',
            description: `Weight changed for: ${shortAddress}`,
            oldValue: `${original.percentage}%`,
            newValue: `${target.percentage}%`
          });
        }
      }
    });
    
    // Check for removed recipients
    originalTargets.forEach((original) => {
      if (original.address && original.percentage !== undefined) {
        const existsInCurrent = currentTargets.some(curr => curr.address === original.address);
        if (!existsInCurrent) {
          const shortAddress = `${original.address.slice(0, 6)}...${original.address.slice(-4)}`;
          changes.push({
            type: 'removed',
            field: 'Recipients',
            description: `Recipient removed: ${shortAddress}`,
            oldValue: `${original.percentage}%`
          });
        }
      }
    });
    
    // Compare streams
    const originalStreams = originalFormData.newStreams || [];
    const currentStreams = currentData.newStreams || [];
    
    currentStreams.forEach((stream) => {
      if (stream.streamId && stream.percentage !== undefined) {
        const existsInOriginal = originalStreams.some(orig => orig.streamId === stream.streamId);
        if (!existsInOriginal) {
          const shortStreamId = `${stream.streamId.slice(0, 10)}...${stream.streamId.slice(-6)}`;
          changes.push({
            type: 'added',
            field: 'Streams',
            description: `Stream added: ${shortStreamId}`,
            newValue: `${stream.percentage}%`
          });
        }
      }
    });
    
    // Compare distribution control
    const originalControl = originalFormData.newDistributionControl;
    const currentControl = currentData.newDistributionControl;
    const originalIsManual = originalControl && "Manual" in originalControl;
    const currentIsManual = currentControl && "Manual" in currentControl;
    
    if (originalIsManual && !currentIsManual && currentControl) {
      const controlType = Object.keys(currentControl)[0];
      const controlValue = Object.values(currentControl)[0];
      changes.push({
        type: 'modified',
        field: 'Distribution Control',
        description: `Distribution control changed to: ${controlType}`,
        oldValue: 'Manual',
        newValue: controlValue ? `${controlType}: ${controlValue}` : controlType
      });
    }
    
    // Compare recipient manager
    if (originalFormData.recipientManager !== currentData.recipientManager) {
      if (currentData.recipientManager && !originalFormData.recipientManager) {
        const shortAddress = `${currentData.recipientManager.slice(0, 6)}...${currentData.recipientManager.slice(-4)}`;
        changes.push({
          type: 'added',
          field: 'Recipient Manager',
          description: `Recipient manager set to: ${shortAddress}`
        });
      } else if (currentData.recipientManager && originalFormData.recipientManager) {
        const shortAddress = `${currentData.recipientManager.slice(0, 6)}...${currentData.recipientManager.slice(-4)}`;
        const oldShortAddress = `${originalFormData.recipientManager.slice(0, 6)}...${originalFormData.recipientManager.slice(-4)}`;
        changes.push({
          type: 'modified',
          field: 'Recipient Manager',
          description: `Recipient manager changed`,
          oldValue: oldShortAddress,
          newValue: shortAddress
        });
      }
    }
    
    // Compare weight setter
    if (originalFormData.weightSetter !== currentData.weightSetter) {
      if (currentData.weightSetter && !originalFormData.weightSetter) {
        const shortAddress = `${currentData.weightSetter.slice(0, 6)}...${currentData.weightSetter.slice(-4)}`;
        changes.push({
          type: 'added',
          field: 'Weight Setter',
          description: `Weight setter set to: ${shortAddress}`
        });
      } else if (currentData.weightSetter && originalFormData.weightSetter) {
        const shortAddress = `${currentData.weightSetter.slice(0, 6)}...${currentData.weightSetter.slice(-4)}`;
        const oldShortAddress = `${originalFormData.weightSetter.slice(0, 6)}...${originalFormData.weightSetter.slice(-4)}`;
        changes.push({
          type: 'modified',
          field: 'Weight Setter',
          description: `Weight setter changed`,
          oldValue: oldShortAddress,
          newValue: shortAddress
        });
      }
    }
    
    return changes;
  }

  function handleInitialSubmit(data: z.infer<typeof EDIT_PERMISSION_SCHEMA>) {
    const changes = getChangeDetails(data);
    
    if (changes.length === 0) {
      toast.error("No changes detected");
      return;
    }

    // Store the form data and show confirmation
    setPendingFormData(data);
    setShowConfirmation(true);
  }

  async function handleConfirmedSubmit() {
    if (!pendingFormData || !api || !sendTx) {
      toast.error("API not ready");
      return;
    }

    setShowConfirmation(false);

    const sdkData = prepareFormDataForSDK(
      pendingFormData,
      selectedPermissionContract,
      selectedAccount?.address,
    );

    const [sendErr, sendRes] = await sendTx(
      updateStreamPermission({
        api,
        ...sdkData,
      }),
    );

    if (sendErr !== undefined) {
      return; // Error already handled by sendTx
    }

    const { tracker } = sendRes;

    tracker.on("finalized", () => {
      form.reset();
      setSelectedPermissionId("");
      setSelectedPermissionContract(null);
      setPendingFormData(null);
    });
  }

  return (
    <Form {...form}>
      <form
        {...props}
        onSubmit={form.handleSubmit(handleInitialSubmit)}
        className={cn("flex flex-col gap-6", className)}
      >
        <PortalFormHeader
          title="Manage Permissions"
          description="Modify the selected permission. Available fields depend on the permission's type and revocation terms."
        />

        <WalletConnectionWarning
          isAccountConnected={isAccountConnected}
          isInitialized={isInitialized}
        />

        <div className="grid gap-6">
          <div className="grid gap-4">
            <PermissionSelector
              control={form.control}
              selectedPermissionId={selectedPermissionId}
              onPermissionSelection={(permissionId, contract) => {
                setSelectedPermissionId(permissionId);
                form.setValue("permissionId", permissionId);
                handlePermissionLoad(permissionId, contract);
              }}
            />

            <RevokePermissionButton
              permissionId={selectedPermissionId}
              canRevoke={canRevoke}
              onSuccess={() => {
                setSelectedPermissionId("");
                form.reset();
              }}
            />
          </div>

          {selectedPermissionId && (
            <>
              <PortalFormSeparator title="Permission Details" />

              <PermissionTypeInfo
                permissionType={permissionType}
                isGrantor={isGrantor}
                userRole={userRole}
              />

              {permissionType === "stream" && canEdit && (
                <>
                  <DistributionControlField
                    control={form.control}
                    disabled={
                      !canUserEditField(
                        selectedPermissionContract,
                        selectedAccount?.address,
                        "distributionControl",
                      )
                    }
                  />

                  <RecipientsField
                    control={form.control}
                    canEditRecipients={canUserEditField(
                      selectedPermissionContract,
                      selectedAccount?.address,
                      "recipients",
                    )}
                    isWeightsOnly={isWeightsOnlyUser}
                  />

                  <StreamsField
                    control={form.control}
                    disabled={
                      !canUserEditField(
                        selectedPermissionContract,
                        selectedAccount?.address,
                        "streams",
                      )
                    }
                  />

                  <RecipientManagerField
                    control={form.control}
                    isAccountConnected={isAccountConnected}
                    disabled={
                      !canUserEditField(
                        selectedPermissionContract,
                        selectedAccount?.address,
                        "recipientManager",
                      )
                    }
                  />

                  <WeightSetterField
                    control={form.control}
                    isAccountConnected={isAccountConnected}
                    disabled={
                      !canUserEditField(
                        selectedPermissionContract,
                        selectedAccount?.address,
                        "weightSetter",
                      )
                    }
                  />

                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full"
                    disabled={
                      !isAccountConnected ||
                      !selectedPermissionId ||
                      !isDirty ||
                      isPending ||
                      isSigning
                    }
                  >
                    {isPending || isSigning
                      ? "Updating..."
                      : "Update Permission"}
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </form>

      {/* Confirmation Dialog */}
      <SubmitConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmedSubmit}
        changes={pendingFormData ? getChangeDetails(pendingFormData) : []}
      />
    </Form>
  );
}
