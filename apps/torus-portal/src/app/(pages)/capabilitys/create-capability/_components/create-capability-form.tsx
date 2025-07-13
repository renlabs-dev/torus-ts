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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@torus-ts/ui/components/toggle-group";
import {
  WalletConnectionWarning,
} from "@torus-ts/ui/components/wallet-connection-warning";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { cn } from "@torus-ts/ui/lib/utils";

import PortalFormHeader from "~/app/_components/portal-form-header";

import { CreateCapabilityPathPreview } from "./create-capability-path-preview";
import { CreateCapabilityPrefixField } from "./create-capability-prefix-field";
import {
  CREATE_CAPABILITY_SCHEMA,
  HTTP_METHODS,
} from "./create-capability-schema";

export function CreateCapabilityForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { toast } = useToast();
  const { isAccountConnected, isInitialized } = useTorus();
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

  // Generate full path preview
  const generateFullPath = () => {
    const method =
      watchedMethod === "custom" ? watchedCustomMethod : watchedMethod;

    if (selectedPrefix) {
      const fullPath = watchedPath
        ? `${selectedPrefix}.${watchedPath}`
        : selectedPrefix;
      return `${fullPath}.${method ?? "[method]"}`;
    }

    if (!watchedPath) return "";
    return `${watchedPath}.${method ?? "[method]"}`;
  };

  const fullPath = generateFullPath();

  // eslint-disable-next-line @typescript-eslint/require-await
  async function onSubmit(_data: z.infer<typeof CREATE_CAPABILITY_SCHEMA>) {
    form.reset();
    toast.success("Capability permission created successfully!");
  }

  return (
    <Form {...form}>
      <form
        {...props}
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("flex flex-col gap-6", className)}
      >
        <PortalFormHeader
          title="Create Capability"
          description="Define a namespace path to create a new capability permission for your agent on Torus."
        />

        <WalletConnectionWarning
          isAccountConnected={isAccountConnected}
          isInitialized={isInitialized}
        />

        <div className="grid gap-6">
          {/* Namespace Prefix Selector */}
          <CreateCapabilityPrefixField
            selectedPrefix={selectedPrefix}
            onValueChange={setSelectedPrefix}
            isAccountConnected={isAccountConnected}
          />

          {/* Path Input with Character Counter */}
          <FormField
            control={form.control}
            name="path"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capability Path</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="namespace path"
                    disabled={!isAccountConnected || !selectedPrefix}
                    maxLength={35}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          {/* REST Method Toggle */}
          <FormField
            control={form.control}
            name="method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>REST Method</FormLabel>
                <FormControl>
                  <ToggleGroup
                    type="single"
                    value={field.value}
                    onValueChange={(value) => {
                      if (value) {
                        field.onChange(value);
                        if (value !== "custom") {
                          form.setValue("customMethod", "");
                        }
                      }
                    }}
                    className="justify-start flex-wrap gap-2"
                    disabled={!isAccountConnected || !selectedPrefix}
                  >
                    {HTTP_METHODS.map((method) => (
                      <ToggleGroupItem
                        key={method}
                        value={method}
                        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                      >
                        {method}
                      </ToggleGroupItem>
                    ))}
                    <ToggleGroupItem
                      value="custom"
                      className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      CUSTOM
                    </ToggleGroupItem>
                  </ToggleGroup>
                </FormControl>
                <FormDescription>
                  Select the REST method that this capability will handle
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Custom Method Input (Conditional) */}
          {watchedMethod === "custom" && (
            <FormField
              control={form.control}
              name="customMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Method</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder="custom-action"
                        disabled={!isAccountConnected || !selectedPrefix}
                        maxLength={35}
                        className="pr-12"
                      />
                      <div
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground
                          bg-background px-1 rounded"
                      >
                        {(field.value ?? "").length}/35
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Enter a custom method name (max 35 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <CreateCapabilityPathPreview fullPath={fullPath} />

          <Button
            variant="outline"
            className="w-full"
            type="submit"
            disabled={!isAccountConnected || !selectedPrefix}
          >
            Create Capability Permission
          </Button>
        </div>
      </form>
    </Form>
  );
}
