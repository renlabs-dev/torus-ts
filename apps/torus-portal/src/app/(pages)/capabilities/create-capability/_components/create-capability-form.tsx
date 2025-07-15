"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";

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

import PortalFormHeader from "~/app/_components/portal-form-header";

import { CreateCapabilityMethodField } from "./create-capability-method-field";
import { CreateCapabilityPathPreview } from "./create-capability-path-preview";
import { CreateCapabilityPrefixField } from "./create-capability-prefix-field";
import { CREATE_CAPABILITY_SCHEMA } from "./create-capability-schema";

export function CreateCapabilityForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { toast } = useToast();
  const { isAccountConnected, isInitialized, api, selectedAccount } =
    useTorus();
  const [selectedPrefix, setSelectedPrefix] = useState("");

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

  async function onSubmit(data: z.infer<typeof CREATE_CAPABILITY_SCHEMA>) {
    const fullPath = generateFullPath(
      selectedPrefix,
      data.path,
      data.method,
      data.customMethod,
    );
  }

  const fullPathPreview = generateFullPath(
    selectedPrefix,
    watchedPath,
    watchedMethod,
    watchedCustomMethod,
  );

  return (
    <Form {...form}>
      <form
        {...props}
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("flex flex-col gap-6", className)}
      >
        <PortalFormHeader
          title="Delegate Capability Permission"
          description="Delegate permission to access a specific capability permission path."
        />

        <WalletConnectionWarning
          isAccountConnected={isAccountConnected}
          isInitialized={isInitialized}
        />

        <div className="grid gap-6">
          <CreateCapabilityPrefixField
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

          <CreateCapabilityPathPreview fullPath={fullPathPreview} />

          <Button
            variant="outline"
            className="w-full"
            type="submit"
            disabled={
              !isAccountConnected ||
              !selectedPrefix ||
              (watchedMethod === "custom" && !watchedCustomMethod?.trim()) ||
              (watchedMethod === "none" && !watchedPath.trim())
            }
          >
            Create Capability
          </Button>
        </div>
      </form>
    </Form>
  );
}
