"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  namespaceSegmentField,
  isValidNamespaceSegment,
} from "@torus-network/torus-utils/namespace-validation";
import { useTorus } from "@torus-ts/torus-provider";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
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
  ToggleGroup,
  ToggleGroupItem,
} from "@torus-ts/ui/components/toggle-group";
import { Button } from "@torus-ts/ui/components/button";
import { TransactionStatus } from "@torus-ts/ui/components/transaction-status";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { Info } from "lucide-react";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// HTTP method options
const HTTP_METHODS = ["get", "post", "patch", "delete", "update"] as const;

const createNamespaceSchema = z
  .object({
    path: namespaceSegmentField(),
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
        "Custom method is required and must be a valid namespace segment",
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
  const { createNamespaceTransaction, isAccountConnected } = useTorus();
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

  // Generate the full namespace path preview
  const generateFullPath = useCallback(() => {
    if (!watchedPath) return "";

    const method =
      watchedMethod === "custom" ? watchedCustomMethod : watchedMethod;
    return `${watchedPath}.${method ?? "[method]"}`;
  }, [watchedPath, watchedMethod, watchedCustomMethod]);

  const fullPath = generateFullPath();

  const onSubmit = useCallback(
    async (data: CreateNamespaceFormData) => {
      try {
        const method =
          data.method === "custom" ? data.customMethod : data.method;

        if (!method) {
          toast({
            title: "Error",
            description: "Please specify a method",
            variant: "destructive",
          });
          return;
        }

        const fullNamespacePath = `${data.path}.${method}`;

        setTransactionStatus({
          status: "STARTING",
          finalized: false,
          message: "Creating namespace...",
        });

        await createNamespaceTransaction({
          path: fullNamespacePath,
          callback: (result) => {
            setTransactionStatus(result);
            if (result.status === "SUCCESS" && result.finalized) {
              onSuccess?.();
              toast({
                title: "Success",
                description: `Namespace "${fullNamespacePath}" created successfully`,
              });
              form.reset();
            } else if (result.status === "ERROR") {
              toast({
                title: "Error",
                description: result.message ?? "Failed to create namespace",
                variant: "destructive",
              });
            }
          },
          refetchHandler: async () => {
            // Namespace list will be automatically updated
          },
        });
      } catch (error) {
        console.error("Error creating namespace:", error);
        setTransactionStatus({
          status: "ERROR",
          finalized: true,
          message: "Failed to create namespace",
        });
        toast({
          title: "Error",
          description: "Failed to create namespace",
          variant: "destructive",
        });
      }
    },
    [createNamespaceTransaction, onSuccess, toast, form],
  );

  return (
    <div className="w-full max-w-2xl p-6">
      <Card className="border-none w-full">
        <CardHeader>
          <CardTitle>Create Namespace</CardTitle>
          <CardDescription>
            Create a new namespace on the Torus Network. The method suffix helps
            agent APIs recognize the functionality of the namespace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Namespace Path Field */}
              <FormField
                control={control}
                name="path"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Namespace Path</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="agent.alice.twitter"
                        disabled={!isAccountConnected}
                      />
                    </FormControl>
                    <FormDescription>
                      Must start and end with alphanumeric characters. Can
                      contain lowercase letters, numbers, hyphens, underscores,
                      and plus signs.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* HTTP Method Toggle Group */}
              <FormField
                control={control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HTTP Method</FormLabel>
                    <FormControl>
                      <ToggleGroup
                        type="single"
                        value={field.value}
                        onValueChange={(value) => {
                          if (value) {
                            field.onChange(value);
                            // Clear custom method when switching away from custom
                            if (value !== "custom") {
                              setValue("customMethod", "");
                            }
                          }
                        }}
                        className="justify-start flex-wrap"
                        disabled={!isAccountConnected}
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
                      Select the HTTP method that this namespace endpoint will
                      handle. This is appended to the end of the path.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Custom Method Field - only shown when "custom" is selected */}
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
                          disabled={!isAccountConnected}
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

              {/* Full Path Preview */}
              {fullPath && (
                <div className="rounded-md border border-border bg-muted p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Info className="h-4 w-4" />
                    Full Namespace Path
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    <code className="rounded bg-background px-2 py-1 text-foreground">
                      {fullPath}
                    </code>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    This path will be created on the Torus Network and can be
                    used by agents to handle API requests.
                  </div>
                </div>
              )}

              {/* Transaction Status */}
              {transactionStatus.status && (
                <TransactionStatus
                  status={transactionStatus.status}
                  message={transactionStatus.message}
                />
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={
                  !isAccountConnected ||
                  transactionStatus.status === "PENDING" ||
                  transactionStatus.status === "STARTING"
                }
              >
                {!isAccountConnected
                  ? "Connect Wallet to Continue"
                  : transactionStatus.status === "PENDING" ||
                      transactionStatus.status === "STARTING"
                    ? "Creating Namespace..."
                    : "Create Namespace"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
