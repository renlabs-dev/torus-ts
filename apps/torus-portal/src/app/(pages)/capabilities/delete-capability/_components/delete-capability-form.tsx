"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { SS58Address } from "@torus-network/sdk/types";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import { WalletConnectionWarning } from "@torus-ts/ui/components/wallet-connection-warning";
import { useIsMobile } from "@torus-ts/ui/hooks/use-mobile";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { cn } from "@torus-ts/ui/lib/utils";

import PortalFormHeader from "~/app/_components/portal-form-header";
import { truncateMobileValue } from "~/utils/truncate-mobile-value";
import { tryCatch } from "~/utils/try-catch";

import { DeleteCapabilityPreview } from "./delete-capability-preview";
import { DeleteCapabilitySegmentSelector } from "./delete-capability-segment-selector";

const DELETE_CAPABILITY_SCHEMA = z.object({
  selectedCapability: z.string().min(1, "Please select a capability path"),
  segmentToDelete: z.number().min(2, "Please select a segment to delete"),
});

type DeleteCapabilityFormData = z.infer<typeof DELETE_CAPABILITY_SCHEMA>;

export function DeleteCapabilityForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const {
    isAccountConnected,
    isInitialized,
    api,
    selectedAccount,
    deleteNamespaceTransaction,
  } = useTorus();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const form = useForm<DeleteCapabilityFormData>({
    resolver: zodResolver(DELETE_CAPABILITY_SCHEMA),
    defaultValues: {
      selectedCapability: "",
      segmentToDelete: -1,
    },
  });

  const { control, watch, setValue } = form;
  const watchedCapability = watch("selectedCapability");
  const watchedSegment = watch("segmentToDelete");

  const namespaceEntries = useNamespaceEntriesOf(
    api,
    selectedAccount?.address as SS58Address,
  );

  const deletablePaths = useMemo(() => {
    if (!namespaceEntries.data) return [];

    // Filter out paths with 2 or fewer segments (agent.name)
    // as they cannot be deleted
    const validPaths = namespaceEntries.data.filter(
      (entry) => entry.path.length > 2,
    );

    // Sort paths by length (longest first) and then alphabetically
    return validPaths.sort((a, b) => {
      if (b.path.length !== a.path.length) {
        return b.path.length - a.path.length;
      }
      return a.path.join(".").localeCompare(b.path.join("."));
    });
  }, [namespaceEntries.data]);

  useEffect(() => {
    if (deletablePaths.length > 0 && !watchedCapability) {
      const firstPath = deletablePaths[0];
      if (firstPath) {
        setValue("selectedCapability", firstPath.path.join("."));
      }
    }
  }, [deletablePaths, watchedCapability, setValue]);

  const selectedPath = deletablePaths.find(
    (entry) => entry.path.join(".") === watchedCapability,
  );

  const handleSegmentSelect = useCallback(
    (segmentIndex: number) => {
      setValue("segmentToDelete", segmentIndex);
    },
    [setValue],
  );

  async function handleSubmit(data: DeleteCapabilityFormData) {
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

    setTransactionStatus("loading");
    const { error } = await tryCatch(
      deleteNamespaceTransaction({
        path: pathToDelete,
        callback: (result) => {
          if (result.status === "SUCCESS" && result.finalized) {
            setTransactionStatus("success");
            toast.success(
              `Capability permission "${pathToDelete}" deleted successfully`,
            );
            form.reset();
            void namespaceEntries.refetch();
          }

          if (result.status === "ERROR") {
            setTransactionStatus("error");
            toast.error(
              result.message ?? "Failed to delete capability permission",
            );
          }
        },
        refetchHandler: async () => {
          // Refetch namespace entries after successful deletion
          await namespaceEntries.refetch();
        },
      }),
    );

    if (error) {
      console.error("Error deleting capability permission:", error);
      setTransactionStatus("error");
      toast.error("Failed to delete capability permission");
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
          title="Delete Capability"
          description="Select a capability path and choose where to cut it. The selected segment and everything after it will be deleted."
        />

        <WalletConnectionWarning
          isAccountConnected={isAccountConnected}
          isInitialized={isInitialized}
        />

        <div className="grid gap-6">
          <FormField
            control={control}
            name="selectedCapability"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Capability a Path</FormLabel>
                <FormControl>
                  {!isAccountConnected ? (
                    <div className="text-sm text-muted-foreground sm:h-10 border flex items-center px-4">
                      Connect your wallet to see your capabilities
                    </div>
                  ) : namespaceEntries.isLoading ? (
                    <div className="text-sm text-muted-foreground sm:h-10 border flex items-center px-4">
                      Loading your capabilitys...
                    </div>
                  ) : deletablePaths.length === 0 ? (
                    <div className="text-sm text-muted-foreground sm:h-10 border flex items-center px-4">
                      No capabilities found. Create a capability first.
                    </div>
                  ) : (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full max-w-[44rem]">
                        <SelectValue placeholder="Choose a capability path...">
                          {truncateMobileValue(field.value, isMobile)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {deletablePaths.map((entry) => (
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

                <FormMessage />
              </FormItem>
            )}
          />

          {selectedPath && (
            <DeleteCapabilitySegmentSelector
              selectedPath={selectedPath}
              watchedSegment={watchedSegment}
              onSegmentSelect={handleSegmentSelect}
              isDisabled={false}
            />
          )}

          {selectedPath && (
            <DeleteCapabilityPreview
              selectedPath={selectedPath}
              watchedSegment={watchedSegment}
            />
          )}

          <Button
            type="submit"
            variant="outline"
            className="w-full"
            disabled={
              !isAccountConnected ||
              !selectedPath ||
              watchedSegment < 2 ||
              transactionStatus === "loading"
            }
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {transactionStatus === "loading"
              ? "Deleting..."
              : "Delete Capability"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
