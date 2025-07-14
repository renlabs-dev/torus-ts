"use client";

import { useState, useRef } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
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
import {
  WalletConnectionWarning,
} from "@torus-ts/ui/components/wallet-connection-warning";
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
  const { isAccountConnected, isInitialized } = useTorus();
  const [selectedPrefix, setSelectedPrefix] = useState("");
  const isAppendingRef = useRef(false);

  const form = useForm<z.infer<typeof CREATE_CAPABILITY_SCHEMA>>({
    resolver: zodResolver(CREATE_CAPABILITY_SCHEMA),
    defaultValues: {
      path: "",
      method: "get",
      customMethod: "",
      targets: [],
      streams: [],
    },
  });

  const watchedMethod = form.watch("method");
  const watchedPath = form.watch("path");
  const watchedCustomMethod = form.watch("customMethod");

  const {
    fields: targetFields,
    append: appendTarget,
    remove: removeTarget,
  } = useFieldArray({
    control: form.control,
    name: "targets",
    keyName: "fieldId",
  });

  const {
    fields: streamFields,
    append: appendStream,
    remove: removeStream,
  } = useFieldArray({
    control: form.control,
    name: "streams",
    keyName: "fieldId",
  });

  const generateFullPath = () => {
    if (watchedMethod === "none") {
      if (selectedPrefix) {
        return watchedPath
          ? `${selectedPrefix}.${watchedPath}`
          : selectedPrefix;
      }
      return watchedPath || "";
    }

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
    toast.success(
      "Success! Submit functionality is disabled but the form behaves as expected",
    );
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
          description="Create a new capability path for your agent."
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

          <CreateCapabilityPathPreview fullPath={fullPath} />

          <div className="grid gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Targets</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isAppendingRef.current) return;
                  isAppendingRef.current = true;
                  appendTarget(["", 1]);
                  setTimeout(() => {
                    isAppendingRef.current = false;
                  }, 100);
                }}
                disabled={!isAccountConnected || !selectedPrefix}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Target
              </Button>
            </div>

            {targetFields.map((field, index) => (
              <div key={field.fieldId} className="flex gap-2">
                <FormField
                  control={form.control}
                  name={`targets.${index}.0`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Agent address"
                          disabled={!isAccountConnected || !selectedPrefix}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`targets.${index}.1`}
                  render={({ field }) => (
                    <FormItem className="w-32">
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="Weight"
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            field.onChange(isNaN(value) ? 1 : value);
                          }}
                          disabled={!isAccountConnected || !selectedPrefix}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeTarget(index)}
                  disabled={!isAccountConnected || !selectedPrefix}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="grid gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Streams</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isAppendingRef.current) return;
                  isAppendingRef.current = true;
                  appendStream(["", 0]);
                  setTimeout(() => {
                    isAppendingRef.current = false;
                  }, 100);
                }}
                disabled={!isAccountConnected || !selectedPrefix}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Stream
              </Button>
            </div>

            {streamFields.map((field, index) => (
              <div key={field.fieldId} className="flex gap-2">
                <FormField
                  control={form.control}
                  name={`streams.${index}.0`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Stream ID (H256)"
                          disabled={!isAccountConnected || !selectedPrefix}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`streams.${index}.1`}
                  render={({ field }) => (
                    <FormItem className="w-32">
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="%"
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                          disabled={!isAccountConnected || !selectedPrefix}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeStream(index)}
                  disabled={!isAccountConnected || !selectedPrefix}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

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
