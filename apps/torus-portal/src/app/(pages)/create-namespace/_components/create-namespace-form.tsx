"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";


import type { SS58Address } from "@torus-network/sdk";
import {
  isValidNamespaceSegment,
  namespacePathField,
} from "@torus-network/sdk/types/namespace";

import { useNamespaceEntriesOf } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { Button } from "@torus-ts/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@torus-ts/ui/components/toggle-group";
import { TransactionStatus } from "@torus-ts/ui/components/transaction-status";
import { useToast } from "@torus-ts/ui/hooks/use-toast";

const HTTP_METHODS = ["get", "post", "patch", "delete", "put"] as const;

// Every single namespace name has been changed to Capability Permission
// as requested here: https://coda.io/d/RENLABS-CORE-DEVELOPMENT-DOCUMENTS_d5Vgr5OavNK/Text-change-requests_su4jQAlx
// In the future we are going to have all the other names from namespace to Capability Permission
// TODO : Change all namespace to Capability Permission

const createNamespaceSchema = z
  .object({
    path: z.string().refine(
      (val) => {
        if (val === "") return true;
        const pathResult = namespacePathField().safeParse(val);
        return pathResult.success;
      },
      {
        message: "Must be a valid capability permission path or empty",
      },
    ),
    method: z.enum([...HTTP_METHODS, "custom"]),
    customMethod: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.method === "custom") {
        if (!data.customMethod || data.customMethod.trim().length === 0) {
          return false;
        }
        return isValidNamespaceSegment(data.customMethod);
      }
      return true;
    },
    {
      message:
        "Custom method is required and must be a valid capability permission segment",
      path: ["customMethod"],
    },
  );

type CreateNamespaceFormData = z.infer<typeof createNamespaceSchema>;

interface CreateNamespaceFormProps {
  onSuccess?: () => void;
}

export default function CreateNamespaceForm({
  onSuccess,
}: CreateNamespaceFormProps) {
  const {
    createNamespaceTransaction,
    isAccountConnected,
    api,
    selectedAccount,
  } = useTorus();
  const { toast } = useToast();

  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      finalized: false,
      message: null,
      status: null,
    },
  );

  const form = useForm<CreateNamespaceFormData>({
    resolver: zodResolver(createNamespaceSchema),
    defaultValues: {
      path: "",
      method: "get",
      customMethod: "",
    },
  });

  const { control, handleSubmit, watch, setValue } = form;
  const watchedMethod = watch("method");
  const watchedPath = watch("path");
  const watchedCustomMethod = watch("customMethod");

  const [selectedPrefix, setSelectedPrefix] = useState("");

  const namespaceEntries = useNamespaceEntriesOf(
    api,
    selectedAccount?.address as SS58Address,
  );

  const prefixOptions = useMemo(() => {
    if (!namespaceEntries.data || namespaceEntries.data.length === 0) {
      return [];
    }

    const prefixes = new Set<string>();

    namespaceEntries.data.forEach((entry) => {
      if (entry.path.length >= 2) {
        const agentName = entry.path[1];
        prefixes.add(`agent.${agentName}`);
      }
    });

    namespaceEntries.data.forEach((entry) => {
      if (entry.path.length >= 3) {
        for (let i = 3; i <= entry.path.length; i++) {
          const prefix = entry.path.slice(0, i).join(".");
          prefixes.add(prefix);
        }
      }
    });

    return Array.from(prefixes).sort();
  }, [namespaceEntries.data]);

  useEffect(() => {
    setSelectedPrefix("");
  }, [selectedAccount?.address]);

  useEffect(() => {
    if (prefixOptions.length > 0 && !selectedPrefix) {
      const basePrefix = prefixOptions.find((p) => p.split(".").length === 2);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      setSelectedPrefix(basePrefix ?? prefixOptions[0]!);
    }
  }, [prefixOptions, selectedPrefix]);

  const generateFullPath = useCallback(() => {
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
  }, [watchedPath, watchedMethod, watchedCustomMethod, selectedPrefix]);

  const fullPath = generateFullPath();

  const onSubmit = useCallback(
    async (data: CreateNamespaceFormData) => {
      try {
        const method =
          data.method === "custom" ? data.customMethod : data.method;

        if (!method) {
          toast.error("Please specify a method");
          return;
        }

        const pathWithPrefix = selectedPrefix
          ? data.path
            ? `${selectedPrefix}.${data.path}`
            : selectedPrefix
          : data.path;

        const fullNamespacePath = `${pathWithPrefix}.${method}`;

        setTransactionStatus({
          status: "STARTING",
          finalized: false,
          message: "Creating capability permission...",
        });

        await createNamespaceTransaction({
          path: fullNamespacePath,
          callback: (result) => {
            setTransactionStatus(result);
            if (result.status === "SUCCESS" && result.finalized) {
              onSuccess?.();
              toast.success(
                `Capability permission "${fullNamespacePath}" created successfully`,
              );
              form.reset();
            } else if (result.status === "ERROR") {
              toast.error(
                result.message ?? "Failed to create capability permission",
              );
            }
          },
          refetchHandler: async () => {
            // Capability permission list will be automatically updated
          },
        });
      } catch (error) {
        console.error("Error creating capability permission:", error);
        setTransactionStatus({
          status: "ERROR",
          finalized: true,
          message: "Failed to create capability permission",
        });
        toast.error("Failed to create capability permission");
      }
    },
    [createNamespaceTransaction, onSuccess, toast, form, selectedPrefix],
  );

  return (
    <Card className="border-none w-full">
      <CardHeader>
        <CardTitle>Create Capability Permission</CardTitle>
        <CardDescription>
          Create a new capability permission on the Torus Network.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormItem>
              <FormLabel>Capability Permission Path</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <div className="w-fit">
                    {!isAccountConnected ? (
                      <div className="text-sm text-muted-foreground p-3 border rounded-md h-10 flex items-center">
                        Connect wallet...
                      </div>
                    ) : namespaceEntries.isLoading ? (
                      <div className="text-sm text-muted-foreground p-3 border rounded-md h-10 flex items-center">
                        Loading...
                      </div>
                    ) : prefixOptions.length === 0 ? (
                      <div
                        className="text-sm text-muted-foreground p-3 text-nowrap border rounded-md h-10 flex
                          items-center"
                      >
                        Agent registration required
                      </div>
                    ) : (
                      <Select
                        value={selectedPrefix}
                        onValueChange={setSelectedPrefix}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose prefix..." />
                        </SelectTrigger>
                        <SelectContent>
                          {prefixOptions.map((prefix) => (
                            <SelectItem key={prefix} value={prefix}>
                              <span className="font-mono">{prefix}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <span className="text-muted-foreground font-mono">.</span>

                  {/* Path Input */}
                  <div className="w-full">
                    <FormField
                      control={control}
                      name="path"
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder={
                            prefixOptions.length === 0
                              ? "Agent registration required"
                              : "capability permission path"
                          }
                          disabled={
                            !isAccountConnected ||
                            !selectedPrefix ||
                            prefixOptions.length === 0
                          }
                        />
                      )}
                    />
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                {prefixOptions.length === 0 &&
                isAccountConnected &&
                !namespaceEntries.isLoading ? (
                  <span className="text-orange-600 font-medium">
                    You must be registered as an agent before creating
                    capability permissions. Please register your agent first.
                  </span>
                ) : (
                  <>
                    Choose a prefix from existing capability permissions and
                    optionally add a path extension. Leave the path empty to
                    create a capability permission at the selected prefix level.
                  </>
                )}
              </FormDescription>
              <FormField
                control={control}
                name="path"
                render={() => <FormMessage />}
              />
            </FormItem>

            <FormField
              control={control}
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
                            setValue("customMethod", "");
                          }
                        }
                      }}
                      className="justify-start flex-wrap"
                      disabled={
                        !isAccountConnected || prefixOptions.length === 0
                      }
                    >
                      {HTTP_METHODS.map((method) => (
                        <ToggleGroupItem
                          key={method}
                          value={method}
                          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                        >
                          {method.toUpperCase()}
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
                    Select the REST method that this capability permission
                    endpoint will handle. This is appended to the end of the
                    path. The method suffix helps agent APIs recognize the
                    functionality of the capability permission.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedMethod === "custom" && (
              <FormField
                control={control}
                name="customMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Method</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="custom-action"
                        disabled={
                          !isAccountConnected || prefixOptions.length === 0
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Enter a custom method name. Must start and end with
                      alphanumeric characters and contain only lowercase
                      letters, numbers, hyphens, underscores, and plus signs.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="rounded-md border border-border bg-muted p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Info className="h-4 w-4" />
                Full Capability Permission Path
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                <code className="rounded bg-background px-2 py-1 text-foreground">
                  {fullPath === "" ? "Type a path..." : fullPath}
                </code>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                This path will be created on the Torus Network and can be used
                by agents to handle API requests.
              </div>
            </div>

            {transactionStatus.status && (
              <TransactionStatus
                status={transactionStatus.status}
                message={transactionStatus.message}
              />
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={
                !isAccountConnected ||
                prefixOptions.length === 0 ||
                transactionStatus.status === "PENDING" ||
                transactionStatus.status === "STARTING"
              }
            >
              {!isAccountConnected
                ? "Connect Wallet to Continue"
                : prefixOptions.length === 0 && !namespaceEntries.isLoading
                  ? "Agent Registration Required"
                  : transactionStatus.status === "PENDING" ||
                      transactionStatus.status === "STARTING"
                    ? "Creating Capability Permission..."
                    : "Create Capability Permission"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
