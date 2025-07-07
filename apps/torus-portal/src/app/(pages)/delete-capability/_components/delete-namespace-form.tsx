"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { SS58Address } from "@torus-network/sdk";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import { TransactionStatus } from "@torus-ts/ui/components/transaction-status";
import { useToast } from "@torus-ts/ui/hooks/use-toast";

// Every single namespace name has been changed to Capability Permission
// as requested here: https://coda.io/d/RENLABS-CORE-DEVELOPMENT-DOCUMENTS_d5Vgr5OavNK/Text-change-requests_su4jQAlx
// In the future we are going to have all the other names from namespace to Capability Permission
// TODO : Change all namespace to Capability Permission

const deleteNamespaceSchema = z.object({
  selectedNamespace: z
    .string()
    .min(1, "Please select a capability permission path"),
  segmentToDelete: z.number().min(2, "Please select a segment to delete"),
});

type DeleteNamespaceFormData = z.infer<typeof deleteNamespaceSchema>;

interface DeleteNamespaceFormProps {
  onSuccess?: () => void;
}

export default function DeleteNamespaceForm({
  onSuccess,
}: DeleteNamespaceFormProps) {
  const {
    deleteNamespaceTransaction,
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

  const form = useForm<DeleteNamespaceFormData>({
    resolver: zodResolver(deleteNamespaceSchema),
    defaultValues: {
      selectedNamespace: "",
      segmentToDelete: -1,
    },
  });

  const { control, watch, handleSubmit, setValue } = form;
  const watchedNamespace = watch("selectedNamespace");
  const watchedSegment = watch("segmentToDelete");

  const namespaceEntries = useNamespaceEntriesOf(
    api,
    selectedAccount?.address as SS58Address,
  );

  const maxPaths = useMemo(() => {
    if (!namespaceEntries.data) return [];

    const pathLengths = new Map<string, number>();

    namespaceEntries.data.forEach((entry) => {
      // Skip entries with only 2 segments (agent.name) - nothing to delete
      if (entry.path.length <= 2) return;

      const baseKey = entry.path.slice(0, 3).join(".");

      if (
        !pathLengths.has(baseKey) ||
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        entry.path.length > pathLengths.get(baseKey)!
      ) {
        pathLengths.set(baseKey, entry.path.length);
      }
    });

    const result = new Map<string, (typeof namespaceEntries.data)[0]>();

    namespaceEntries.data.forEach((entry) => {
      // Skip entries with only 2 segments (agent.name) - nothing to delete
      if (entry.path.length <= 2) return;

      const baseKey = entry.path.slice(0, 3).join(".");
      const maxLength = pathLengths.get(baseKey);

      if (entry.path.length === maxLength) {
        result.set(entry.path.join("."), entry);
      }
    });

    return Array.from(result.values());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespaceEntries.data]);

  useEffect(() => {
    if (maxPaths.length > 0 && !watchedNamespace) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      setValue("selectedNamespace", maxPaths[0]!.path.join("."));
    }
  }, [maxPaths, watchedNamespace, setValue]);

  const selectedPath = maxPaths.find(
    (entry) => entry.path.join(".") === watchedNamespace,
  );

  const onSubmit = useCallback(
    async (data: DeleteNamespaceFormData) => {
      if (!selectedPath) {
        toast.error("Please select a capability permission path");
        return;
      }

      if (data.segmentToDelete < 2) {
        toast.error("Please select a segment to delete");
        return;
      }

      const pathToDelete = selectedPath.path
        .slice(0, data.segmentToDelete + 1)
        .join(".");

      try {
        setTransactionStatus({
          status: "STARTING",
          finalized: false,
          message: "Deleting capability permission...",
        });

        await deleteNamespaceTransaction({
          path: pathToDelete,
          callback: (result) => {
            setTransactionStatus(result);
            if (result.status === "SUCCESS" && result.finalized) {
              onSuccess?.();
              toast.success(
                `Capability permission "${pathToDelete}" deleted successfully`,
              );
              form.reset();
            } else if (result.status === "ERROR") {
              toast.error(
                result.message ?? "Failed to delete capability permission",
              );
            }
          },
          refetchHandler: async () => {
            // Refetch namespace entries after successful deletion
            await namespaceEntries.refetch();
          },
        });
      } catch (error) {
        console.error("Error deleting capability permission:", error);
        setTransactionStatus({
          status: "ERROR",
          finalized: true,
          message: "Failed to delete capability permission",
        });
        toast.error("Failed to delete capability permission");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedPath, deleteNamespaceTransaction, onSuccess, toast, form],
  );

  // Handle segment selection
  const handleSegmentSelect = useCallback(
    (segmentIndex: number) => {
      setValue("segmentToDelete", segmentIndex);
    },
    [setValue],
  );

  return (
    <Card className="border-none w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Delete Capability Permission
        </CardTitle>
        <CardDescription>
          Select a capability permission path and choose where to cut it. The
          selected segment and everything after it will be deleted. If you have
          any active permissions, you need to delete them first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <div className="space-y-6">
            {/* Namespace Path Selection */}
            <FormField
              control={control}
              name="selectedNamespace"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Capability Permission Path</FormLabel>
                  <FormControl>
                    {!isAccountConnected ? (
                      <div className="text-sm text-muted-foreground p-4 border rounded-md">
                        Connect your wallet to see your capability permissions
                      </div>
                    ) : namespaceEntries.isLoading ? (
                      <div className="text-sm text-muted-foreground p-4 border rounded-md">
                        Loading your capability permissions...
                      </div>
                    ) : maxPaths.length === 0 ? (
                      <div className="text-sm text-muted-foreground p-4 border rounded-md">
                        No capability permissions found. Create a capability
                        permission first.
                      </div>
                    ) : (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a capability permission path..." />
                        </SelectTrigger>
                        <SelectContent>
                          {maxPaths.map((entry) => (
                            <SelectItem
                              key={entry.path.join(".")}
                              value={entry.path.join(".")}
                            >
                              {entry.path.join(".")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FormControl>
                  <FormDescription>
                    Choose the capability permission path to view its segments
                    for deletion.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedPath && (
              <FormField
                control={control}
                name="segmentToDelete"
                render={() => (
                  <FormItem>
                    <FormLabel>Select Segment to Delete</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center p-4 border rounded-lg bg-muted/50">
                          <div className="flex items-center font-mono text-sm mr-1">
                            {selectedPath.path.slice(0, 2).join(".")}
                            <span>.</span>
                          </div>
                          {selectedPath.path
                            .slice(2)
                            .map((segment, sliceIndex) => {
                              const index = sliceIndex + 2;
                              return (
                                <div key={index} className="flex items-center">
                                  <div className="flex items-center bg-background border rounded-lg">
                                    <span className="px-3 py-1 font-mono text-sm border-r">
                                      {segment}
                                    </span>
                                    <Button
                                      variant={
                                        watchedSegment === index
                                          ? "destructive"
                                          : "ghost"
                                      }
                                      size="sm"
                                      className="rounded-r-md"
                                      onClick={() => handleSegmentSelect(index)}
                                      disabled={
                                        transactionStatus.status ===
                                          "PENDING" ||
                                        transactionStatus.status === "STARTING"
                                      }
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  {index < selectedPath.path.length - 1 && (
                                    <span className="mx-1 text-muted-foreground">
                                      .
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Click on a segment to select it for deletion. You can only
                      delete segments after the agent name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedPath && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Deletion Preview:</div>
                  <div className="flex items-center text-sm">
                    {watchedSegment >= 2 ? (
                      <>
                        {watchedSegment > 0 && (
                          <>
                            <span className="text-green-600 font-mono">
                              {selectedPath.path
                                .slice(0, watchedSegment)
                                .join(".")}
                            </span>
                            <span className="text-muted-foreground">.</span>
                          </>
                        )}
                        <span className="text-red-600 font-mono font-medium">
                          {selectedPath.path.slice(watchedSegment).join(".")}
                        </span>
                      </>
                    ) : (
                      <span className="text-green-600 font-mono">
                        {selectedPath.path.join(".")}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="text-green-600">■</span> Will remain |
                    <span className="text-red-600 ml-1">■</span> Will be deleted
                  </div>
                </div>
              </div>
            )}

            {selectedPath && watchedSegment >= 2 && (
              <Button
                type="submit"
                variant="destructive"
                className="w-full"
                onClick={handleSubmit(onSubmit)}
                disabled={
                  transactionStatus.status === "PENDING" ||
                  transactionStatus.status === "STARTING" ||
                  watchedSegment < 2
                }
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete "{selectedPath.path.slice(watchedSegment).join(".")}"
              </Button>
            )}

            {/* Transaction Status */}
            {transactionStatus.status && (
              <TransactionStatus
                status={transactionStatus.status}
                message={transactionStatus.message}
              />
            )}
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
