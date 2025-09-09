import type { Api } from "@torus-network/sdk/chain";
import { checkSS58 } from "@torus-network/sdk/types";
import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";
import { useAvailableStreams } from "~/hooks/use-available-streams";
import { useMultipleAccountStreams } from "~/hooks/use-multiple-account-streams";
import { calculateIndividualStreamValue } from "~/utils/calculate-stream-value";
import { Plus, Trash2 } from "lucide-react";
import React, { useCallback, useEffect } from "react";
import { useFieldArray } from "react-hook-form";
import type { CreateStreamPermissionForm } from "../create-stream-permission-form-schema";

interface AllocationFieldProps {
  form: CreateStreamPermissionForm;
  isAccountConnected: boolean;
  api: Api | null;
  selectedAccountAddress?: string;
}

const checkSS58IfDefined = (addressTxt?: string) =>
  addressTxt ? checkSS58(addressTxt) : null;

export function AllocationField({
  form,
  isAccountConnected,
  api,
  selectedAccountAddress,
}: AllocationFieldProps) {
  const { selectedAccount } = useTorus();

  const availableStreams = useAvailableStreams(
    api,
    checkSS58IfDefined(selectedAccountAddress),
  );

  const streamsData = useMultipleAccountStreams({
    accountIds: selectedAccount?.address ? [selectedAccount.address] : [],
  });

  const accountStreams = selectedAccount?.address
    ? streamsData[selectedAccount.address]
    : null;

  const {
    fields: streamFields,
    append: appendStream,
    remove: removeStream,
  } = useFieldArray({
    control: form.control,
    name: "allocation.streams",
  });

  const handleAutoPopulateStreams = useCallback(() => {
    if (!availableStreams.data) return;

    const newStreams = availableStreams.data.map((stream) => ({
      streamId: stream.streamId,
      percentage: "",
    }));

    form.setValue("allocation.streams", newStreams);
  }, [availableStreams.data, form]);

  // Clear streams when wallet changes
  useEffect(() => {
    if (selectedAccountAddress) {
      form.setValue("allocation.streams", []);
    }
  }, [selectedAccountAddress, form]);

  // Auto-populate streams after wallet change
  useEffect(() => {
    if (
      availableStreams.data &&
      availableStreams.data.length > 0 &&
      streamFields.length === 0
    ) {
      handleAutoPopulateStreams();
    }
  }, [availableStreams.data, streamFields.length, handleAutoPopulateStreams]);

  // Always use Streams allocation type
  return (
    <div className="grid gap-3">
      <div className="grid gap-3">
        {streamFields.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FormLabel>Streams</FormLabel>
              <Button
                type="button"
                size="sm"
                className="bg-white/70"
                onClick={() =>
                  appendStream({
                    streamId: "",
                    percentage: "",
                  })
                }
                disabled={!isAccountConnected}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Stream
              </Button>
            </div>
          </div>
        )}

        {streamFields.length === 0 && (
          <div className="rounded-md border-2 border-dashed py-4 text-center">
            <p className="text-muted-foreground mb-2 text-sm">
              No streams added yet
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendStream({
                  streamId: "",
                  percentage: "",
                })
              }
              disabled={!isAccountConnected}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Stream
            </Button>
          </div>
        )}

        {streamFields.map((field, index) => {
          return (
            <div
              key={field.id}
              className="grid gap-3 rounded-md border px-4 pb-2 pt-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  Stream {index + 1} (
                  {calculateIndividualStreamValue(
                    Number(
                      form.watch(`allocation.streams.${index}.percentage`),
                    ) || 0,
                    form.watch(`allocation.streams.${index}.streamId`) || "",
                    accountStreams,
                    isAccountConnected,
                    selectedAccount?.address,
                  )}
                  )
                </h4>
                {streamFields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStream(index)}
                    disabled={!isAccountConnected}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-[1fr,120px] gap-3">
                <FormField
                  control={form.control}
                  name={`allocation.streams.${index}.streamId`}
                  render={({ field: streamField }) => (
                    <FormItem>
                      <FormLabel>Stream ID</FormLabel>
                      <FormControl>
                        <Input
                          {...streamField}
                          placeholder="e.g. 0x2b...49bb"
                          disabled={!isAccountConnected}
                        />
                      </FormControl>
                      <div className="min-h-[20px]">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`allocation.streams.${index}.percentage`}
                  render={({ field: percentageField }) => (
                    <FormItem>
                      <FormLabel>Percentage</FormLabel>
                      <FormControl>
                        <Input
                          {...percentageField}
                          placeholder="e.g. 100"
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          disabled={!isAccountConnected}
                        />
                      </FormControl>
                      <div className="min-h-[20px]">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          );
        })}

        {/* Total Emission Display */}
        {streamFields.length > 0 && (
          <div className="bg-muted/20 mt-4 rounded-md border p-3">
            <div className="text-sm">
              <span className="text-muted-foreground font-medium">
                Total Stream Allocation:{" "}
              </span>
              <span className="font-semibold text-green-400">
                {(() => {
                  if (
                    !isAccountConnected ||
                    !selectedAccount?.address ||
                    !accountStreams ||
                    accountStreams.isLoading ||
                    accountStreams.isError
                  ) {
                    return "calculating...";
                  }

                  // Calculate total from individual streams that are configured
                  let totalStreamCapacity = 0;
                  let totalAllocated = 0;

                  streamFields.forEach((_, index) => {
                    const streamId = form.watch(
                      `allocation.streams.${index}.streamId`,
                    );
                    const percentage =
                      Number(
                        form.watch(`allocation.streams.${index}.percentage`),
                      ) || 0;

                    if (streamId) {
                      const stream = accountStreams.incoming.streams.find(
                        (s) => s.streamId === streamId,
                      );
                      if (stream) {
                        const streamCapacity = stream.tokensPerWeek.toNumber();
                        totalStreamCapacity += streamCapacity;
                        totalAllocated += (streamCapacity * percentage) / 100;
                      }
                    }
                  });

                  return `${totalAllocated.toFixed(2)}/${totalStreamCapacity.toFixed(2)} TORUS/week`;
                })()}{" "}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
