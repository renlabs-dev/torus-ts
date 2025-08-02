"use client";

import { useCallback, useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

// import type { SS58Address } from "@torus-network/sdk/types";
import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";
import { WalletConnectionWarning } from "@torus-ts/ui/components/wallet-connection-warning";
import { useToast } from "@torus-ts/ui/hooks/use-toast";

import { FormAddressField } from "~/app/_components/address-field";

import { DurationField } from "./create-capability-fields/duration-field";
import { RevocationField } from "./create-capability-fields/revocation-field";
import type { CreateCapabilityPermissionFormData } from "./create-capability-permission-form-schema";
import { createCapabilityPermissionSchema } from "./create-capability-permission-form-schema";
import { transformFormDataToSDK } from "./create-capability-permission-form-utils";
import { SelectedPathsDisplay } from "./selected-paths-display";

interface CreateCapabilityPermissionFormProps {
  selectedPaths?: string[];
  onSuccess?: () => void;
}

export function CreateCapabilityPermissionForm({
  selectedPaths = [],
  onSuccess,
}: CreateCapabilityPermissionFormProps) {
  const {
    delegateNamespacePermissionTransaction,
    isAccountConnected,
    // selectedAccount,
    // api,
    isInitialized,
  } = useTorus();
  const { toast } = useToast();
  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const form = useForm<CreateCapabilityPermissionFormData>({
    resolver: zodResolver(createCapabilityPermissionSchema),
    defaultValues: {
      recipient: "",
      namespacePaths: selectedPaths,
      duration: {
        type: "Indefinite",
      },
      revocation: {
        type: "RevocableByDelegator",
      },
      instances: "1",
    },
  });

  // Update form when selectedPaths change
  useEffect(() => {
    form.setValue("namespacePaths", selectedPaths);
  }, [selectedPaths, form]);

  const handleSubmit = useCallback(
    async (data: CreateCapabilityPermissionFormData) => {
      if (data.namespacePaths.length === 0) {
        toast.error("No capability paths selected");
        return;
      }

      try {
        setTransactionStatus("loading");
        const transformedData = transformFormDataToSDK(data);

        await delegateNamespacePermissionTransaction({
          ...transformedData,
          callback: (result) => {
            if (result.status === "SUCCESS" && result.finalized) {
              setTransactionStatus("success");
              toast.success(
                `Successfully created capability permission for ${data.namespacePaths.length} path${data.namespacePaths.length > 1 ? "s" : ""}`,
              );
              onSuccess?.();
              form.reset();
            } else if (result.status === "ERROR") {
              setTransactionStatus("error");
              toast.error(
                result.message ?? "Failed to grant capability permission",
              );
            }
          },
          refetchHandler: async () => {
            // No-op for now, could be used to refetch data after transaction
          },
        });
      } catch (error) {
        console.error("Error granting permission:", error);
        setTransactionStatus("error");
        toast.error("Failed to grant capability permission");
      }
    },
    [delegateNamespacePermissionTransaction, toast, form, onSuccess],
  );

  return (
    <Form {...form}>
      <form
        id="namespace-permission-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-6"
      >
        <WalletConnectionWarning
          isAccountConnected={isAccountConnected}
          isInitialized={isInitialized}
        />

        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="recipient"
            render={({ field }) => (
              <FormAddressField
                field={field}
                label="Recipient"
                disabled={!isAccountConnected}
              />
            )}
          />

          {selectedPaths.length > 0 && (
            <SelectedPathsDisplay paths={selectedPaths} />
          )}

          <DurationField form={form} isAccountConnected={isAccountConnected} />

          <FormField
            control={form.control}
            name="instances"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Instances</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min="1"
                    placeholder="1"
                    disabled={!isAccountConnected}
                  />
                </FormControl>
                <FormDescription>
                  The maximum number of instances that can be created under this
                  permission.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <RevocationField
            form={form}
            isAccountConnected={isAccountConnected}
          />

          <Button
            type="submit"
            form="namespace-permission-form"
            className="w-full"
            variant="outline"
            disabled={
              !isAccountConnected ||
              transactionStatus === "loading" ||
              selectedPaths.length === 0
            }
          >
            {transactionStatus === "loading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating permission...
              </>
            ) : !isAccountConnected ? (
              "Connect Wallet to Continue"
            ) : selectedPaths.length === 0 ? (
              "No Capability Paths Selected"
            ) : (
              `Create Capability Permission (${selectedPaths.length} path${selectedPaths.length > 1 ? "s" : ""})`
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
