"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { createNamespace } from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";

import { useNamespaceEntriesOf } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { useSendTransaction } from "@torus-ts/torus-provider/use-send-transaction";
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

import { FeeTooltip } from "~/app/_components/fee-tooltip";
import PortalFormHeader from "~/app/_components/portal-form-header";
import { useNamespaceCreationFee } from "~/hooks/use-namespace-creation-fee";

import { RegisterCapabilityMethodField } from "./create-capability-method-field";
import { RegisterCapabilityPathPreview } from "./create-capability-path-preview";
import { RegisterCapabilityPrefixField } from "./create-capability-prefix-field";
import { REGISTER_CAPABILITY_SCHEMA } from "./create-capability-schema";

export function RegisterCapabilityForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { toast } = useToast();
  const {
    api,
    isAccountConnected,
    isInitialized,
    selectedAccount,
    torusApi,
    wsEndpoint,
  } = useTorus();
  const { web3FromAddress } = torusApi;
  const [selectedPrefix, setSelectedPrefix] = useState("");

  const { sendTx, isPending } = useSendTransaction({
    api,
    selectedAccount,
    wsEndpoint,
    web3FromAddress,
    transactionType: "Create Namespace",
  });

  const namespaceEntries = useNamespaceEntriesOf(
    api,
    selectedAccount?.address as SS58Address,
  );

  const form = useForm<z.infer<typeof REGISTER_CAPABILITY_SCHEMA>>({
    resolver: zodResolver(REGISTER_CAPABILITY_SCHEMA),
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

  async function handleSubmit(
    _data: z.infer<typeof REGISTER_CAPABILITY_SCHEMA>,
  ) {
    if (!api || !sendTx) {
      toast.error("API not ready");
      return;
    }

    await sendTx(createNamespace(api, fullPath));

    // todo refetch handler
    const todoRefetcher = true;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (todoRefetcher) {
      form.reset();
      setSelectedPrefix("");
      await namespaceEntries.refetch();
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
          title="Register Capability"
          description="Register a new capability path for your agent."
        />

        <WalletConnectionWarning
          isAccountConnected={isAccountConnected}
          isInitialized={isInitialized}
        />

        <div className="grid gap-6">
          <RegisterCapabilityPrefixField
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

          <RegisterCapabilityMethodField
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

          <RegisterCapabilityPathPreview fullPath={fullPath} />

          <FeeTooltip
            title="Capability Creation Fee"
            isVisible={Boolean(
              isAccountConnected &&
                selectedPrefix &&
                fullPath.trim().length > 0 &&
                !isPending,
            )}
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
              isPending
            }
          >
            {isPending ? "Registering..." : "Register Capability"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
