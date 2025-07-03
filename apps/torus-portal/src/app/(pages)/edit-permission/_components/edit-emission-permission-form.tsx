"use client";

import { useTorus } from "@torus-ts/torus-provider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useCallback, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import { Form } from "@torus-ts/ui/components/form";
import { queryPermission } from "@torus-network/sdk";
import type { SS58Address, PermissionContract } from "@torus-network/sdk";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { EditEmissionPermissionFormComponent } from "./edit-emission-permission-form-content";
import {
  editEmissionPermissionSchema,
  permissionSelectionSchema,
} from "./edit-emission-permission-form-schema";
import type {
  EditEmissionPermissionFormData,
  PermissionSelectionFormData,
  PermissionInfo,
} from "./edit-emission-permission-form-schema";
import {
  transformFormDataToUpdateSDK,
  transformPermissionToFormData,
} from "./edit-emission-permission-form-utils";
import { PermissionSelector } from "~/app/_components/permission-selector";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import {
  PermissionWithDetails,
  RevokePermissionButton,
} from "./revoke-permission-button";

interface EditEmissionPermissionFormProps {
  onSuccess?: () => void;
}

export default function EditEmissionPermissionForm({
  onSuccess,
}: EditEmissionPermissionFormProps) {
  const { updateEmissionPermissionTransaction, api, selectedAccount } =
    useTorus();
  const { toast } = useToast();

  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const [selectedPermissionInfo, setSelectedPermissionInfo] =
    useState<PermissionInfo | null>(null);
  const [selectedPermission, setSelectedPermission] =
    useState<PermissionContract | null>(null);
  const [selectedPermissionData, setSelectedPermissionData] =
    useState<PermissionWithDetails | null>(null);
  const [currentBlock, setCurrentBlock] = useState<bigint>(0n);

  // Form for permission selection
  const selectionForm = useForm<PermissionSelectionFormData>({
    resolver: zodResolver(permissionSelectionSchema),
    defaultValues: {
      permissionId: "",
    },
  });

  // Main edit form
  const editForm = useForm<EditEmissionPermissionFormData>({
    resolver: zodResolver(editEmissionPermissionSchema),
  });

  // Reset all state when wallet changes
  useEffect(() => {
    if (selectedAccount?.address) {
      // Clear all state when wallet switches
      selectionForm.reset({ permissionId: "" });
      editForm.reset();
      setSelectedPermissionInfo(null);
      setSelectedPermission(null);
      setSelectedPermissionData(null);
      setCurrentBlock(0n);
      setTransactionStatus("idle");
    }
  }, [selectedAccount?.address, selectionForm, editForm]);

  // Handle permission selection
  const handlePermissionSelect = async (permissionId: string) => {
    if (!api || !selectedAccount?.address || !permissionId) return;

    const permissionResult = await queryPermission(api, permissionId);
    if (permissionResult[0] !== undefined || !permissionResult[1]) {
      // Silently fail for wallet switching scenarios to avoid unnecessary error toasts
      // Clear any existing state when permission query fails
      setSelectedPermissionInfo(null);
      setSelectedPermission(null);
      setSelectedPermissionData(null);
      setCurrentBlock(0n);
      editForm.reset();
      return;
    }

    const permission = permissionResult[1];

    try {
      // Get current block number for grantor edit permission checks
      const [blockError, blockInfo] = await tryAsync(api.query.system.number());
      const currentBlockNumber = blockError ? 0n : blockInfo.toBigInt();

      // Always set the permission and block for revoke functionality
      setSelectedPermission(permission);
      setCurrentBlock(currentBlockNumber);

      // Only process emission permission details for edit functionality
      const isEmissionPermission =
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        permission.scope && "Emission" in permission.scope;

      if (isEmissionPermission) {
        const permissionInfo = transformPermissionToFormData(
          permission,
          currentBlockNumber,
          selectedAccount.address as SS58Address,
        );
        permissionInfo.permissionId = permissionId;

        setSelectedPermissionInfo(permissionInfo);

        // Pre-populate the edit form with current data
        editForm.reset({
          selectedPermission: {
            permissionId,
          },
          newTargets: permissionInfo.currentTargets,
          newStreams: permissionInfo.currentStreams ?? [],
          newDistributionControl: permissionInfo.currentDistribution ?? {
            type: "Manual",
          },
        });
      } else {
        // For namespace permissions, clear the edit form info since we can't edit them
        setSelectedPermissionInfo(null);
        editForm.reset();
      }
    } catch (error) {
      console.error("Error processing permission:", error);
      toast({
        title: "Error",
        description: "Failed to process permission data",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = useCallback(
    async (data: EditEmissionPermissionFormData) => {
      try {
        setTransactionStatus("loading");
        const transformedData = transformFormDataToUpdateSDK(data);

        await updateEmissionPermissionTransaction({
          ...transformedData,
          callback: (result) => {
            if (result.status === "SUCCESS" && result.finalized) {
              setTransactionStatus("success");
              onSuccess?.();
              toast({
                title: "Success",
                description: "Permission updated successfully",
              });
              // Reset forms
              selectionForm.reset();
              editForm.reset();
              setSelectedPermissionInfo(null);
            } else if (result.status === "ERROR") {
              setTransactionStatus("error");
              toast({
                title: "Error",
                description: result.message ?? "Failed to update permission",
                variant: "destructive",
              });
            }
          },
          refetchHandler: async () => {
            // Permission list will be automatically updated by the PermissionSelector
          },
        });
      } catch (error) {
        console.error("Error updating permission:", error);
        setTransactionStatus("error");
        toast({
          title: "Error",
          description: "Failed to update emission permission",
          variant: "destructive",
        });
      }
    },
    [
      updateEmissionPermissionTransaction,
      toast,
      selectionForm,
      editForm,
      onSuccess,
    ],
  );

  const mutation = {
    isPending: transactionStatus === "loading",
    mutate: handleSubmit,
  };

  return (
    <div className="w-full">
      {/* Permission Selection */}
      <Card className="border-none w-full">
        <CardHeader>
          <CardTitle>Edit Permission</CardTitle>
          <CardDescription>
            Modify the selected permission. Available fields depend on the
            permission's type and revocation terms.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...selectionForm}>
            <PermissionSelector
              control={selectionForm.control}
              selectedPermissionId={selectionForm.watch("permissionId")}
              onPermissionIdChange={(value) => {
                selectionForm.setValue("permissionId", value);
                void handlePermissionSelect(value);
              }}
              onPermissionDataChange={(data) => {
                setSelectedPermissionData(data);
              }}
            />
          </Form>

          {/* Revoke Permission Button */}
          {selectedAccount && (
            <div className="mt-4 flex justify-end items-center">
              <RevokePermissionButton
                permissionId={selectionForm.watch("permissionId") || null}
                permissionData={selectedPermissionData}
                permission={selectedPermission}
                currentBlock={currentBlock}
                userAddress={selectedAccount.address}
                onSuccess={() => {
                  // Reset forms and state on successful revocation
                  selectionForm.reset();
                  editForm.reset();
                  setSelectedPermissionInfo(null);
                  setSelectedPermission(null);
                  setSelectedPermissionData(null);
                  setCurrentBlock(0n);
                  onSuccess?.();
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Form - Only show for emission permissions */}
      {selectedPermissionInfo &&
        selectedPermissionData?.emission_permissions && (
          <EditEmissionPermissionFormComponent
            form={editForm}
            mutation={mutation}
            permissionInfo={selectedPermissionInfo}
          />
        )}

      {/* Info message for namespace permissions */}
      {selectedPermissionData?.namespace_permissions && (
        <Card className="border-none w-full mt-4">
          <CardHeader>
            <CardTitle>Namespace Permission</CardTitle>
            <CardDescription>
              Namespace permissions can only be revoked. Edit functionality is
              not available for namespace permissions.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
