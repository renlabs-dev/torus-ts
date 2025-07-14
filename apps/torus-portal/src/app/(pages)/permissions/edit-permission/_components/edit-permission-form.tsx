"use client";

import { useCallback, useRef, useState } from "react";

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

import { DistributionControlField } from "./edit-permission-fields/distribution-control-field";
import { StreamsField } from "./edit-permission-fields/streams-field";
import { TargetsField } from "./edit-permission-fields/targets-field";
import type { EditPermissionFormData } from "./edit-permission-schema";
import { EDIT_PERMISSION_SCHEMA } from "./edit-permission-schema";
import {
  handlePermissionDataChange,
  prepareFormDataForSDK,
} from "./edit-permission-utils";
import type { PermissionWithDetails } from "./revoke-permission-button";
import { RevokePermissionButton } from "./revoke-permission-button";

export function EditPermissionForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { toast } = useToast();
  const { api, isAccountConnected, isInitialized } = useTorus();
  const [selectedPermissionId, setSelectedPermissionId] = useState<string>("");
  const [hasLoadedPermission, setHasLoadedPermission] = useState(false);
  const currentPermissionDataRef = useRef<PermissionWithDetails | null>(null);

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

  const handlePermissionLoad = useCallback(
    async (permissionData: PermissionWithDetails) => {
      if (!api) return;

      await handlePermissionDataChange({
        permissionData,
        api,
        form,
        onError: toast.error,
      });
    },
    [api, form, toast.error],
  );

  // eslint-disable-next-line @typescript-eslint/require-await
  async function onSubmit(data: z.infer<typeof EDIT_PERMISSION_SCHEMA>) {
    if (!api) {
      toast.error("API not initialized");
      return;
    }

    const sdkData = prepareFormDataForSDK(data);

    console.log(sdkData);

    form.reset();
    toast.success(
      "Success! Submit functionality is disabled but the form behaves as expected",
    );
  }

  return (
    <Form {...form}>
      <form
        {...props}
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("flex flex-col gap-6", className)}
      >
        <PortalFormHeader
          title="Edit Permission"
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
                setHasLoadedPermission(false); // Reset flag when permission changes
              }}
              onPermissionDataChange={(permissionData) => {
                // Only load data if we haven't loaded this permission yet
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

          <PortalFormSeparator title="Edit Permission Details" />

          <DistributionControlField control={form.control} />

          <TargetsField control={form.control} />

          <StreamsField control={form.control} />

          <Button
            type="submit"
            variant="outline"
            className="w-full"
            disabled={!isAccountConnected || !selectedPermissionId}
          >
            Update Permission
          </Button>
        </div>
      </form>
    </Form>
  );
}
