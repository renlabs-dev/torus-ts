"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";

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
import { WalletConnectionWarning } from "@torus-ts/ui/components/wallet-connection-warning";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { cn } from "@torus-ts/ui/lib/utils";

import { FeeAlert } from "~/app/_components/fee-alert";
import PortalFormHeader from "~/app/_components/portal-form-header";
import { useNamespaceCreationFee } from "~/hooks/use-namespace-creation-fee";
import { tryCatch } from "~/utils/try-catch";

import { CreateCapabilityMethodField } from "./create-capability-method-field";
import { CreateCapabilityPathPreview } from "./create-capability-path-preview";
import { CreateCapabilityPrefixField } from "./create-capability-prefix-field";
import { CREATE_CAPABILITY_SCHEMA } from "./create-capability-schema";

export function CreateCapabilityForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { toast } = useToast();
  const {
    api,
    isAccountConnected,
    isInitialized,
    createNamespaceTransaction,
    selectedAccount,
  } = useTorus();
  const [selectedPrefix, setSelectedPrefix] = useState("");
  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const namespaceEntries = useNamespaceEntriesOf(
    api,
    selectedAccount?.address as SS58Address,
  );

  const form = useForm<z.infer<typeof CREATE_CAPABILITY_SCHEMA>>({
    resolver: zodResolver(CREATE_CAPABILITY_SCHEMA),
    defaultValues: {
      path: "",
      method: "get",
      customMethod: "",
    },
  });

  const watchedMethod = form.watch("method");
  const watchedPath = form.watch("path");
  const watchedCustomMethod = form.watch("customMethod");

  const generateFullPath = (
    prefix: string | undefined,
    path: string | undefined,
    method: string | undefined,
    customMethod: string | undefined,
  ) => {
    if (method === "none") {
      if (prefix) {
        return path ? `${prefix}.${path}` : prefix;
      }
      return path ?? "";
    }

    const finalMethod = method === "custom" ? customMethod : method;

    if (prefix) {
      const fullPath = path ? `${prefix}.${path}` : prefix;
      return `${fullPath}.${finalMethod ?? "[method]"}`;
    }

    if (!path) return "";
    return `${path}.${finalMethod ?? "[method]"}`;
  };

  const fullPath = generateFullPath(
    selectedPrefix,
    watchedPath,
    watchedMethod,
    watchedCustomMethod,
  );

  const namespaceFee = useNamespaceCreationFee(
    api,
    selectedAccount?.address as SS58Address,
    fullPath,
  );

  async function handleSubmit(_data: z.infer<typeof CREATE_CAPABILITY_SCHEMA>) {
    setTransactionStatus("loading");
    const { error } = await tryCatch(
      createNamespaceTransaction({
        path: fullPath,
        callback: (result) => {
          if (result.status === "SUCCESS" && result.finalized) {
            setTransactionStatus("success");
            form.reset();
            setSelectedPrefix("");
            void namespaceEntries.refetch();
          }

          if (result.status === "ERROR") {
            setTransactionStatus("error");
            toast.error(result.message ?? "Failed to create capability");
          }
        },
        refetchHandler: async () => {
          // No-op for now, could be used to refetch data after transaction
        },
      }),
    );

    if (error) {
      console.error("Error creating capability:", error);
      setTransactionStatus("error");
      toast.error("Failed to create capability");
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
          title="Create Capability"
          description="Create a new capability path for your agent."
        />

        <WalletConnectionWarning
          isAccountConnected={isAccountConnected}
          isInitialized={isInitialized}
        />

        <div className="grid gap-6">
          <CreateCapabilityPrefixField
            namespaceEntries={namespaceEntries}
            selectedPrefix={selectedPrefix}
            onValueChange={setSelectedPrefix}
            isAccountConnected={isAccountConnected}
          />

          <FormField
            control={form.control}
            name="path"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capability Path</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="eg. x.memory.get"
                    disabled={!isAccountConnected || !selectedPrefix}
                    maxLength={35}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <CreateCapabilityMethodField
            control={form.control}
            isDisabled={!isAccountConnected || !selectedPrefix}
            onMethodChange={(value) => {
              if (value !== "custom") {
                form.setValue("customMethod", "");
              }
            }}
          />

          {watchedMethod === "custom" && (
            <div className="grid gap-2 animate-fade-down">
              <FormField
                control={form.control}
                name="customMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Method</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="eg. custom-action"
                        disabled={!isAccountConnected || !selectedPrefix}
                        maxLength={35}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          <CreateCapabilityPathPreview fullPath={fullPath} />

          <FeeAlert
            title="Capability Creation Fee"
            isVisible={
              Boolean(isAccountConnected && 
              selectedPrefix && 
              fullPath.trim().length > 0 &&
              transactionStatus !== "loading")
            }
            isLoading={namespaceFee.isLoading}
            error={namespaceFee.error}
            feeItems={namespaceFee.feeItems}
            totalAmount={namespaceFee.totalAmount}
            note="The deposit will be reserved and can be reclaimed when the capability is deleted."
          />

          <Button
            variant="outline"
            className="w-full"
            type="submit"
            disabled={
              !isAccountConnected ||
              !selectedPrefix ||
              (watchedMethod === "custom" && !watchedCustomMethod?.trim()) ||
              (watchedMethod === "none" && !watchedPath.trim()) ||
              transactionStatus === "loading"
            }
          >
            {transactionStatus === "loading"
              ? "Creating..."
              : "Create Capability"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
