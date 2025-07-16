"use client";

import { useCallback, useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import type { SS58Address } from "@torus-network/sdk";

import { useNamespaceEntriesOf } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import {
  WalletConnectionWarning,
} from "@torus-ts/ui/components/wallet-connection-warning";
import { useIsMobile } from "@torus-ts/ui/hooks/use-mobile";
import { useToast } from "@torus-ts/ui/hooks/use-toast";

import PortalFormHeader from "~/app/_components/portal-form-header";
import { truncateMobileValue } from "~/utils/truncate-mobile-value";

import { DurationField } from "./create-capability-fields/duration-field";
import { RevocationField } from "./create-capability-fields/revocation-field";
import type {
  CreateCapabilityPermissionFormData,
} from "./create-capability-permission-form-schema";
import {
  createCapabilityPermissionSchema,
} from "./create-capability-permission-form-schema";
import {
  transformFormDataToSDK,
} from "./create-capability-permission-form-utils";

interface CreateCapabilityPermissionFormProps {
  onSuccess?: () => void;
}

export function CreateCapabilityPermissionForm({
  onSuccess,
}: CreateCapabilityPermissionFormProps) {
  const {
    grantNamespacePermissionTransaction,
    isAccountConnected,
    selectedAccount,
    api,
    isInitialized,
  } = useTorus();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const form = useForm<CreateCapabilityPermissionFormData>({
    resolver: zodResolver(createCapabilityPermissionSchema),
    defaultValues: {
      grantee: "",
      namespacePath: "",
      duration: {
        type: "Indefinite",
      },
      revocation: {
        type: "RevocableByGrantor",
      },
    },
  });

  // Get user's namespaces for the dropdown
  const namespaceEntries = useNamespaceEntriesOf(
    api,
    selectedAccount?.address as SS58Address,
  );

  const namespaceOptions =
    namespaceEntries.data?.map((entry) => entry.path.join(".")) ?? [];

  // Clear namespacePath when account changes
  useEffect(() => {
    form.setValue("namespacePath", "");
  }, [selectedAccount?.address, form]);

  const handleSubmit = useCallback(
    async (data: CreateCapabilityPermissionFormData) => {
      try {
        setTransactionStatus("loading");
        const transformedData = transformFormDataToSDK(data);

        await grantNamespacePermissionTransaction({
          ...transformedData,
          callback: (result) => {
            if (result.status === "SUCCESS" && result.finalized) {
              setTransactionStatus("success");
              onSuccess?.();
              // Reset form
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
    [grantNamespacePermissionTransaction, toast, form, onSuccess],
  );

  return (
    <Form {...form}>
      <form
        id="namespace-permission-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-6"
      >
        <PortalFormHeader
          title="Grant Capability Permission"
          description="Delegate a capability permission to another account."
        />

        <WalletConnectionWarning
          isAccountConnected={isAccountConnected}
          isInitialized={isInitialized}
        />

        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="grantee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipient</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="5Dx...abc (SS58 address)"
                    disabled={!isAccountConnected}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="namespacePath"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capability Path</FormLabel>
                <FormControl>
                  {!isAccountConnected ? (
                    <Input {...field} placeholder="Connect wallet" disabled />
                  ) : namespaceEntries.isLoading ? (
                    <Input
                      {...field}
                      placeholder="Loading capabilitys..."
                      disabled
                    />
                  ) : namespaceOptions.length === 0 ? (
                    <Input
                      {...field}
                      placeholder="No capabilitys found"
                      disabled
                    />
                  ) : (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full max-w-[44rem]">
                        <SelectValue placeholder="e.g. agent.alice.api">
                          {truncateMobileValue(field.value, isMobile)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-w-[18.5rem] sm:max-w-full">
                        {namespaceOptions.map((path) => (
                          <SelectItem key={path} value={path}>
                            <span className="font-mono">{path}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DurationField form={form} isAccountConnected={isAccountConnected} />

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
              namespaceOptions.length === 0
            }
          >
            {transactionStatus === "loading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : !isAccountConnected ? (
              "Connect Wallet to Continue"
            ) : namespaceOptions.length === 0 ? (
              "Create a Capability Permission First"
            ) : (
              "Delegate Capability Permission"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
