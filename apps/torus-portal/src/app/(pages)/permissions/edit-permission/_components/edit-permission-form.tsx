"use client";

import { useState } from "react";

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

import { EditPermissionFields } from "./edit-permission-fields";
import type { EditPermissionFormData } from "./edit-permission-schema";
import { EDIT_PERMISSION_SCHEMA } from "./edit-permission-schema";
import { RevokePermissionButton } from "./revoke-permission-button";

export function EditPermissionForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { toast } = useToast();
  const { selectedAccount, isAccountConnected, isInitialized } = useTorus();
  const [selectedPermissionId, setSelectedPermissionId] = useState<string>("");

  const form = useForm<EditPermissionFormData>({
    disabled: !isAccountConnected,
    resolver: zodResolver(EDIT_PERMISSION_SCHEMA),
    mode: "onChange",
    defaultValues: {
      selectedPermission: {
        permissionId: "",
      },
      newTargets: [],
      newStreams: [],
      newDistributionControl: {
        type: "Manual",
      },
    },
  });

  // eslint-disable-next-line @typescript-eslint/require-await
  async function onSubmit(_data: z.infer<typeof EDIT_PERMISSION_SCHEMA>) {
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
                form.setValue("selectedPermission.permissionId", value);
              }}
              onPermissionDataChange={() => {
                // Handle permission data change
              }}
            />

            {selectedPermissionId && (
              <div className="flex justify-end">
                <RevokePermissionButton
                  permissionId={selectedPermissionId}
                  onSuccess={() => {
                    setSelectedPermissionId("");
                    form.reset();
                  }}
                />
              </div>
            )}
          </div>

          {selectedPermissionId && (
            <>
              <PortalFormSeparator title="Edit Permission Details" />

              <EditPermissionFields
                control={form.control}
                selectedAccount={selectedAccount}
              />
            </>
          )}

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
