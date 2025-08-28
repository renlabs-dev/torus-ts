"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { updateStreamPermission } from "@torus-network/sdk/chain";
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
import { PermissionSelector } from "~/app/_components/permission-selector";
import PortalFormHeader from "~/app/_components/portal-form-header";
import { PortalFormSeparator } from "~/app/_components/portal-form-separator";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { DistributionControlField } from "./edit-permission-fields/distribution-control-field";
import { StreamsField } from "./edit-permission-fields/streams-field";
import { TargetsField } from "./edit-permission-fields/targets-field";
import type { EditPermissionFormData } from "./edit-permission-schema";
import { EDIT_PERMISSION_SCHEMA } from "./edit-permission-schema";
import {
  canEditPermission,
  getPermissionType,
  handlePermissionDataChange,
  prepareFormDataForSDK,
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
  const [selectedPermissionId, setSelectedPermissionId] = useState<string>("");
  const [hasLoadedPermission, setHasLoadedPermission] = useState(false);
  const currentPermissionDataRef = useRef<PermissionWithDetails | null>(null);

  const permissionType = getPermissionType(currentPermissionDataRef.current);
  const canEdit = canEditPermission(
    currentPermissionDataRef.current,
    selectedAccount?.address,
  );
  const isGrantor =
    currentPermissionDataRef.current?.permissions.grantorAccountId ===
    selectedAccount?.address;

  const form = useForm<EditPermissionFormData>({
    disabled: !isAccountConnected,
    resolver: zodResolver(EDIT_PERMISSION_SCHEMA),
    mode: "onChange",
    defaultValues: {
      permissionId: "",
      newTargets: [],
      newStreams: [],
      newDistributionControl: { Manual: null },
    },
  });

  // Handle URL parameter population
  useEffect(() => {
    const permissionIdFromUrl = searchParams.get("id");
    if (permissionIdFromUrl && !selectedPermissionId) {
      setSelectedPermissionId(permissionIdFromUrl);
      form.setValue("permissionId", permissionIdFromUrl);
    }
  }, [searchParams, selectedPermissionId, form]);

  const handlePermissionLoad = useCallback(
    async (permissionData: PermissionWithDetails) => {
      if (!api) return;

      if (permissionData.emission_permissions) {
        await handlePermissionDataChange({
          permissionData,
          api,
          form,
          onError: toast.error,
        });
      }
    },
    [api, form, toast.error],
  );

  async function handleSubmit(data: z.infer<typeof EDIT_PERMISSION_SCHEMA>) {
    if (!api || !sendTx) {
      toast.error("API not ready");
      return;
    }

    const sdkData = prepareFormDataForSDK(data);

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
      setHasLoadedPermission(false);
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
              onPermissionIdChange={(value) => {
                setSelectedPermissionId(value);
                form.setValue("permissionId", value);
                setHasLoadedPermission(false);
              }}
              onPermissionDataChange={(permissionData) => {
                if (
                  permissionData &&
                  !hasLoadedPermission &&
                  currentPermissionDataRef.current?.permissions.permissionId !==
                    permissionData.permissions.permissionId
                ) {
                  currentPermissionDataRef.current = permissionData;
                  setHasLoadedPermission(true);
                  void handlePermissionLoad(permissionData);
                }
              }}
            />

            <RevokePermissionButton
              permissionId={selectedPermissionId}
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
              />

              {permissionType === "emission" && canEdit && (
                <>
                  <DistributionControlField control={form.control} />

                  <TargetsField control={form.control} />

                  <StreamsField control={form.control} />

                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full"
                    disabled={
                      !isAccountConnected ||
                      !selectedPermissionId ||
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
    </Form>
  );
}
