import React, { useCallback, useEffect } from "react";

import { Plus, Trash2 } from "lucide-react";
import { useFieldArray } from "react-hook-form";

import type { Api } from "@torus-network/sdk";
import { checkSS58 } from "@torus-network/sdk";

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

import type { CreateEmissionPermissionForm } from "../create-emission-permission-form-schema";

interface AllocationFieldProps {
  form: CreateEmissionPermissionForm;
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
  const availableStreams = useAvailableStreams(
    api,
    checkSS58IfDefined(selectedAccountAddress),
  );

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
                <Plus className="h-4 w-4 mr-2" />
                Add Stream
              </Button>
            </div>
          </div>
        )}

        {streamFields.length === 0 && (
          <div className="text-center py-4 border-2 border-dashed rounded-md">
            <p className="text-sm text-muted-foreground mb-2">
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
              <Plus className="h-4 w-4 mr-2" />
              Add First Stream
            </Button>
          </div>
        )}

        {streamFields.map((field, index) => {
          return (
            <div
              key={field.id}
              className="grid gap-3 px-4 pt-4 pb-2 border rounded-md"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Stream {index + 1}</h4>
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
      </div>
    </div>
  );
}
