"use client";

import { useTorus } from "@torus-ts/torus-provider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useCallback, useState, useEffect } from "react";
import { usePermissionsByGrantor } from "@torus-ts/query-provider/hooks";
import type { SS58Address } from "@torus-network/sdk";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import { Label } from "@torus-ts/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import { Search } from "lucide-react";

import { PermissionFormShared } from "./permission-form-shared";
import { grantEmissionPermissionSchema } from "./grant-emission-permission-form-schema";
import type { GrantEmissionPermissionFormData } from "./grant-emission-permission-form-schema";
import { transformFormDataToSDK } from "./grant-emission-permission-form-utils";

interface EditPermissionFormProps {
  onSuccess?: () => void;
}

export default function EditPermissionForm({
  onSuccess,
}: EditPermissionFormProps) {
  const { grantEmissionPermissionTransaction, api, selectedAccount } =
    useTorus();
  const { toast } = useToast();
  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [selectedPermissionId, setSelectedPermissionId] = useState<string>("");

  const { data: permissionsByGrantor, isLoading: isLoadingPermissions } =
    usePermissionsByGrantor(api, selectedAccount?.address as SS58Address);

  const [permissionError, permissions] = permissionsByGrantor ?? [
    undefined,
    undefined,
  ];

  const form = useForm<GrantEmissionPermissionFormData>({
    resolver: zodResolver(grantEmissionPermissionSchema),
    defaultValues: {
      grantee: "",
      allocation: {
        type: "Streams",
        streams: [],
      },
      targets: [{ account: "", weight: "" }],
      distribution: {
        type: "Interval",
        blocks: "",
      },
      duration: {
        type: "Indefinite",
      },
      revocation: {
        type: "Irrevocable",
      },
      enforcement: {
        type: "ControlledBy",
        controllers: ["5DoVVgN7R6vHw4mvPX8s4EkkR8fgN1UJ5TDfKzab8eW9z89b"],
        requiredVotes: "1",
      },
    },
  });

  const hasPermissions = permissions && permissions.length > 0;
  const isWalletConnected = selectedAccount?.address != null;
  const shouldDisablePermissionSelect =
    !isWalletConnected || !hasPermissions || isLoadingPermissions;

  // TODO: Add usePermissionDetails hook to fetch permission details by ID
  // This is a placeholder for when that hook is implemented
  const loadPermissionDetails = useCallback(
    (permissionId: string) => {
      try {
        // TODO: Replace with actual API call to get permission details
        // const permissionDetails = await api.getPermissionDetails(permissionId);

        // For now, we'll populate with mock data to demonstrate the functionality
        console.log("Loading permission details for:", permissionId);

        // Mock data - this should come from the API
        const mockPermissionData: GrantEmissionPermissionFormData = {
          grantee: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
          allocation: {
            type: "Streams",
            streams: [
              {
                streamId:
                  "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
                percentage: "50",
              },
            ],
          },
          targets: [
            {
              account: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
              weight: "100",
            },
          ],
          distribution: {
            type: "Interval",
            blocks: "14400",
          },
          duration: {
            type: "Indefinite",
          },
          revocation: {
            type: "Irrevocable",
          },
          enforcement: {
            type: "ControlledBy",
            controllers: ["5DoVVgN7R6vHw4mvPX8s4EkkR8fgN1UJ5TDfKzab8eW9z89b"],
            requiredVotes: "1",
          },
        };

        // Reset and populate form with the permission data
        form.reset(mockPermissionData);

        toast({
          title: "Permission Loaded",
          description: "Permission details have been loaded into the form",
        });
      } catch (error) {
        console.error("Error loading permission details:", error);
        toast({
          title: "Error",
          description: "Failed to load permission details",
          variant: "destructive",
        });
      }
    },
    [form, toast],
  );

  // Load permission details when a permission is selected
  useEffect(() => {
    if (selectedPermissionId) {
      void loadPermissionDetails(selectedPermissionId);
    }
  }, [selectedPermissionId, loadPermissionDetails]);

  const handleSubmit = useCallback(
    async (data: GrantEmissionPermissionFormData) => {
      try {
        setTransactionStatus("loading");
        const transformedData = transformFormDataToSDK(data);

        await grantEmissionPermissionTransaction({
          ...transformedData,
          callback: (result) => {
            if (result.status === "SUCCESS" && result.finalized) {
              setTransactionStatus("success");
              onSuccess?.();
              // Reset form
              form.reset();
              setSelectedPermissionId("");
            } else if (result.status === "ERROR") {
              setTransactionStatus("error");
              toast({
                title: "Error",
                description:
                  result.message ?? "Failed to update emission permission",
                variant: "destructive",
              });
            }
          },
          refetchHandler: async () => {
            // No-op for now, could be used to refetch data after transaction
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
    [grantEmissionPermissionTransaction, toast, form, onSuccess],
  );

  const mutation = {
    isPending: transactionStatus === "loading",
    mutate: handleSubmit,
  };

  return (
    <div>
      {/* Permission Selection */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Select Permission to Edit
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Choose an existing permission that you have granted to edit its
            configuration.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="permission-select">Permission ID</Label>
            <Select
              value={selectedPermissionId}
              onValueChange={setSelectedPermissionId}
              disabled={shouldDisablePermissionSelect}
            >
              <SelectTrigger id="permission-select">
                <SelectValue
                  placeholder={
                    !isWalletConnected
                      ? "Connect wallet to view permissions"
                      : isLoadingPermissions
                        ? "Loading permissions..."
                        : permissionError
                          ? "Error loading permissions"
                          : !hasPermissions
                            ? "No permissions available"
                            : "Select permission to edit..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {permissions?.map((permissionId) => (
                  <SelectItem key={permissionId} value={permissionId}>
                    {permissionId.slice(0, 16)}...{permissionId.slice(-8)}
                  </SelectItem>
                )) ?? []}
              </SelectContent>
            </Select>
            {!isWalletConnected && (
              <p className="text-sm text-muted-foreground">
                Please connect your wallet to view and edit your permissions.
              </p>
            )}
            {permissionError && (
              <p className="text-sm text-destructive">
                Error loading permissions: {permissionError.message}
              </p>
            )}
            {hasPermissions && (
              <p className="text-sm text-muted-foreground">
                Found {permissions.length} permission(s) that you have granted.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form - only show if a permission is selected */}
      {selectedPermissionId && (
        <PermissionFormShared
          form={form}
          mutation={mutation}
          isEdit={true}
          submitButtonText="Update Permission"
        />
      )}

      {/* Helper text when no permission is selected */}
      {!selectedPermissionId && isWalletConnected && hasPermissions && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a permission above to edit its configuration.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
