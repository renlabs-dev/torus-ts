"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
import { Form } from "@torus-ts/ui/components/form";
import { WalletConnectionWarning } from "@torus-ts/ui/components/wallet-connection-warning";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { cn } from "@torus-ts/ui/lib/utils";

import { PermissionSelector } from "~/app/_components/permission-selector";
import PortalFormHeader from "~/app/_components/portal-form-header";
import { PortalFormSeparator } from "~/app/_components/portal-form-separator";
import { tryCatch } from "~/utils/try-catch";

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
import type { PermissionWithDetails } from "./revoke-permission-button";
import { RevokePermissionButton } from "./revoke-permission-button";

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
    updateEmissionPermissionTransaction,
  } = useTorus();
  const [selectedPermissionId, setSelectedPermissionId] = useState<string>("");
  const [hasLoadedPermission, setHasLoadedPermission] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
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
    if (!api) {
      toast.error("API not initialized");
      return;
    }

    setTransactionStatus("loading");

    const sdkData = prepareFormDataForSDK(data);

    const { error } = await tryCatch(
      updateEmissionPermissionTransaction({
        ...sdkData,
        callback: (result) => {
          if (result.status === "SUCCESS" && result.finalized) {
            setTransactionStatus("success");
            form.reset();
            setSelectedPermissionId("");
            setHasLoadedPermission(false);
          }

          if (result.status === "ERROR") {
            setTransactionStatus("error");
            toast.error(result.message ?? "Failed to update permission");
          }
        },
        refetchHandler: async () => {
          // No-op for now, could be used to refetch data after transaction
        },
      }),
    );

    if (error) {
      console.error("Error updating permission:", error);
      setTransactionStatus("error");
      toast.error("Failed to update permission");
      return;
    }
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
                      transactionStatus === "loading"
                    }
                  >
                    {transactionStatus === "loading"
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
