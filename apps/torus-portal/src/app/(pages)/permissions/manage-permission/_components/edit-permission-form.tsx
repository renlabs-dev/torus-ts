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
import { ExecuteWalletForm } from "./execute-wallet-fields/execute-wallet-form";
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

        form.reset({
          permissionId,
          newTargets: formData.newTargets ?? [],
          newStreams: formData.newStreams ?? [],
          newDistributionControl: formData.newDistributionControl ?? {
            Manual: null,
          },
          recipientManager: formData.recipientManager,
          weightSetter: formData.weightSetter,
        });
      }
    },
    [form],
  );

  async function handleSubmit(data: z.infer<typeof EDIT_PERMISSION_SCHEMA>) {
    if (!api || !sendTx) {
      toast.error("API not ready");
      return;
    }

    const sdkData = prepareFormDataForSDK(
      data,
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
    });
  }

  return (
    <Form {...form}>
      <form
        {...props}
        onSubmit={form.handleSubmit(handleSubmit)}
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

              {permissionType === "wallet" && (
                <>
                  <PortalFormSeparator title="Execute Wallet Operation" />

                  <ExecuteWalletForm
                    permissionId={selectedPermissionId}
                    onSuccess={() => {
                      setSelectedPermissionId("");
                      form.reset();
                    }}
                  />
                </>
              )}
            </>
          )}
        </div>
      </form>
    </Form>
  );
}
