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
import { Button } from "@torus-ts/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import { Loader2 } from "lucide-react";
import { queryPermissionsByGrantor, queryPermission } from "@torus-network/sdk";
import { checkSS58 } from "@torus-network/sdk";
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
  hasEditablePermissions,
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

  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [availablePermissions, setAvailablePermissions] = useState<
    { permissionId: string; grantor: string; grantee: string }[]
  >([]);
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

  const loadAvailablePermissions = useCallback(async () => {
    if (!api || !selectedAccount?.address) return;

    setIsLoadingPermissions(true);
    try {
      const userAddress = checkSS58(selectedAccount.address);
      if (!userAddress) {
        toast({
          title: "Error",
          description: "Invalid wallet address",
          variant: "destructive",
        });
        return;
      }

      // Query permissions where user is grantor
      const grantorResult = await queryPermissionsByGrantor(api, userAddress);

      if (grantorResult[0] !== undefined) {
        toast({
          title: "Error",
          description: "Failed to load permissions",
          variant: "destructive",
        });
        return;
      }

      const grantorPerms = grantorResult[1];

      if (!hasEditablePermissions(grantorPerms)) {
        setAvailablePermissions([]);
        return;
      }

      // Get detailed permission info to filter emission permissions
      const permissionPromises = grantorPerms.map(async (permId) => {
        const permissionResult = await queryPermission(api, permId);
        if (permissionResult[0] !== undefined || !permissionResult[1])
          return null;

        const permission = permissionResult[1];

        // Only include emission permissions
        if (!("Emission" in permission.scope)) return null;

        return {
          permissionId: permId,
          grantor: permission.grantor,
          grantee: permission.grantee,
        };
      });

      const [error, results] = await tryAsync(Promise.all(permissionPromises));
      if (error !== undefined) {
        toast({
          title: "Error",
          description: "Failed to load permission details",
          variant: "destructive",
        });
        return;
      }

      const validPermissions = results.filter(Boolean) as {
        permissionId: string;
        grantor: string;
        grantee: string;
      }[];

      setAvailablePermissions(validPermissions);
    } catch (error) {
      console.error("Error loading permissions:", error);
      toast({
        title: "Error",
        description: "Failed to load permissions",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPermissions(false);
    }
  }, [api, selectedAccount?.address, toast]);

  // Load available permissions when component mounts or account changes
  useEffect(() => {
    if (!api || !selectedAccount?.address) {
      setAvailablePermissions([]);
      return;
    }

    void loadAvailablePermissions();
  }, [api, selectedAccount?.address, loadAvailablePermissions]);

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
            // Reload permissions after update
            await loadAvailablePermissions();
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
      loadAvailablePermissions,
    ],
  );

  const mutation = {
    isPending: transactionStatus === "loading",
    mutate: handleSubmit,
  };

  if (!selectedAccount?.address) {
    return (
      <Card className="border-none w-full">
        <CardHeader>
          <CardTitle>Connect Wallet</CardTitle>
          <CardDescription>
            Please connect your wallet to edit permissions.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoadingPermissions) {
    return (
      <Card className="border-none w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Permissions
          </CardTitle>
          <CardDescription>
            Searching for permissions you can edit...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (availablePermissions.length === 0) {
    return (
      <Card className="border-none w-full">
        <CardHeader>
          <CardTitle>No Editable Permissions</CardTitle>
          <CardDescription>
            You don't have any emission permissions that you can edit. You need
            to be the grantor of a permission with appropriate revocation terms.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => void loadAvailablePermissions()}
          >
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* Permission Selection */}
      <Card className="border-none w-full">
        <CardHeader>
          <CardTitle>Select Permission to Edit</CardTitle>
          <CardDescription>
            Choose from permissions where you are the grantor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...selectionForm}>
            <FormField
              control={selectionForm.control}
              name="permissionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Available Permissions</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      void handlePermissionSelect(value);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a permission to edit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availablePermissions.map((perm) => (
                        <SelectItem
                          key={perm.permissionId}
                          value={perm.permissionId}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">
                              {perm.permissionId.substring(0, 10)}...
                            </span>
                            <span className="text-muted-foreground text-sm">
                              → {perm.grantee.substring(0, 8)}...
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
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
