"use client";

import { useTorus } from "@torus-ts/torus-provider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useCallback, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import {
  Form,
} from "@torus-ts/ui/components/form";
import { queryPermission } from "@torus-network/sdk";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import PermissionSelector from "../../_components/permission-selector";
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


  // Handle permission selection
  const handlePermissionSelect = async (permissionId: string) => {
    if (!api || !selectedAccount?.address) return;

    const permissionResult = await queryPermission(api, permissionId);
    if (permissionResult[0] !== undefined || !permissionResult[1]) {
      toast({
        title: "Error",
        description: "Failed to load permission details",
        variant: "destructive",
      });
      return;
    }

    const permission = permissionResult[1];

    try {
      // Get current block number for grantor edit permission checks
      const [blockError, blockInfo] = await tryAsync(api.query.system.number());
      const currentBlock = blockError ? 0n : blockInfo.toBigInt();

      const permissionInfo = transformPermissionToFormData(
        permission,
        currentBlock,
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
          <CardTitle>Edit Emission Permission</CardTitle>
          <CardDescription>
            Modify the selected emission permission. Available fields depend on
            the permission's revocation terms.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...selectionForm}>
            <PermissionSelector
              control={selectionForm.control}
              name="permissionId"
              selectedPermissionId={selectionForm.watch("permissionId")}
              onPermissionIdChange={(value) => {
                selectionForm.setValue("permissionId", value);
                void handlePermissionSelect(value);
              }}
            />
          </Form>
        </CardContent>
      </Card>

      {/* Edit Form */}
      {selectedPermissionInfo && (
        <EditEmissionPermissionFormComponent
          form={editForm}
          mutation={mutation}
          permissionInfo={selectedPermissionInfo}
        />
      )}
    </div>
  );
}
