// Every single grantor/grantee terminology has been changed to delegator/recipient
// as requested here: https://coda.io/d/RENLABS-CORE-DEVELOPMENT-DOCUMENTS_d5Vgr5OavNK/Text-change-requests_su4jQAlx
// This change affects UI labels, variable names, and function names throughout the codebase
// TODO : Ensure all grantor/grantee references are updated to delegator/recipient

"use client";

import { useCallback, useEffect } from "react";

import { Loader2, Plus, Trash2, Wand2 } from "lucide-react";
import { useFieldArray } from "react-hook-form";

import type { SS58Address } from "@torus-network/sdk";
import { checkSS58 } from "@torus-network/sdk";

import { useTorus } from "@torus-ts/torus-provider";
import { Badge } from "@torus-ts/ui/components/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import { WalletConnectionWarning } from "@torus-ts/ui/components/wallet-connection-warning";

import PortalFormHeader from "~/app/_components/portal-form-header";
import { useAvailableStreams } from "~/hooks/use-available-streams";

import type {
  GrantEmissionPermissionForm,
  GrantEmissionPermissionFormData,
  GrantEmissionPermissionMutation,
} from "./grant-emission-permission-form-schema";

interface GrantEmissionPermissionFormProps {
  form: GrantEmissionPermissionForm;
  mutation: GrantEmissionPermissionMutation;
}

const checkSS58IfDefined = (addressTxt?: string) =>
  addressTxt ? checkSS58(addressTxt) : null;

export function GrantEmissionPermissionFormComponent({
  form,
  mutation,
}: GrantEmissionPermissionFormProps) {
  const { api, selectedAccount, isAccountConnected, isInitialized } =
    useTorus();

  const availableStreams = useAvailableStreams(
    api,
    checkSS58IfDefined(selectedAccount?.address),
  );

  const {
    fields: targetFields,
    append: appendTarget,
    remove: removeTarget,
  } = useFieldArray({
    control: form.control,
    name: "targets",
  });

  const {
    fields: streamFields,
    append: appendStream,
    remove: removeStream,
  } = useFieldArray({
    control: form.control,
    name: "allocation.streams",
  });

  const {
    fields: arbiterFields,
    append: appendArbiter,
    remove: removeArbiter,
  } = useFieldArray({
    control: form.control,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    name: "revocation.accounts" as any,
  });

  const allocationType = form.watch("allocation.type");
  const distributionType = form.watch("distribution.type");
  const durationType = form.watch("duration.type");
  const revocationType = form.watch("revocation.type");

  const handleAutoPopulateStreams = useCallback(() => {
    if (!availableStreams.data) return;

    // Clear existing streams
    const currentStreamCount = streamFields.length;
    for (let i = currentStreamCount - 1; i >= 0; i--) {
      removeStream(i);
    }

    // Add available streams with reasonable default percentages
    availableStreams.data.forEach((stream) => {
      appendStream({
        streamId: stream.streamId,
        percentage: "",
      });
    });
  }, [availableStreams.data, streamFields.length, removeStream, appendStream]);

  const handleRefreshStreams = useCallback(() => {
    // Refetch the streams data from the API
    void availableStreams.refetch();
  }, [availableStreams]);

  // Automatically populate streams when allocation type changes to "Streams" and data is available
  useEffect(() => {
    if (
      allocationType === "Streams" &&
      availableStreams.data &&
      availableStreams.data.length > 0 &&
      streamFields.length === 0 &&
      selectedAccount?.address
    ) {
      handleAutoPopulateStreams();
    }
  }, [
    allocationType,
    availableStreams.data,
    streamFields.length,
    selectedAccount?.address,
    handleAutoPopulateStreams,
  ]);

  // Automatically refresh streams when wallet changes
  useEffect(() => {
    if (selectedAccount?.address && availableStreams.data) {
      // Refetch streams when the selected account changes
      void availableStreams.refetch();
    }
  }, [selectedAccount?.address, availableStreams]);

  // Automatically populate streams after successful refresh
  useEffect(() => {
    if (
      allocationType === "Streams" &&
      availableStreams.data &&
      availableStreams.data.length > 0 &&
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      !availableStreams.isLoading &&
      selectedAccount?.address
    ) {
      // Only auto-populate if we don't have any streams or if we just refreshed
      if (streamFields.length === 0) {
        handleAutoPopulateStreams();
      }
    }
  }, [
    allocationType,
    availableStreams.data,
    availableStreams.isLoading,
    selectedAccount?.address,
    streamFields.length,
    handleAutoPopulateStreams,
  ]);

  const onSubmit = (data: GrantEmissionPermissionFormData) => {
    // Set grantee to the selected account address
    const submissionData = {
      ...data,
      grantee: selectedAccount?.address as SS58Address,
    };
    mutation.mutate(submissionData);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        <PortalFormHeader
          title="Delegate Emission Permission"
          description="Create and configure a new emission permission, to delegate it to a set of agents"
        />

        <WalletConnectionWarning
          isInitialized={isInitialized}
          isAccountConnected={isAccountConnected}
        />

        <div className="grid gap-6">
          {/* <FormField
                control={form.control}
                name="allocation.type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allocation Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select allocation type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FixedAmount" disabled>
                          Fixed Amount (Coming Soon)
                        </SelectItem>
                        <SelectItem value="Streams">Streams</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}

          {allocationType === "FixedAmount" && (
            <FormField
              control={form.control}
              name="allocation.amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. 1000.0"
                      type="number"
                      step="0.000001"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {allocationType === "Streams" && (
            <div className="space-y-4">
              <div className="flex md:flex-row flex-col w-full items-start md:items-center justify-between">
                <h4 className="font-medium mb-1 w-fit">Streams</h4>
                <div className="flex flex-col md:flex-row gap-2 md:w-fit w-full">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full md:w-auto"
                    onClick={handleRefreshStreams}
                    disabled={
                      availableStreams.isLoading || !selectedAccount?.address
                    }
                  >
                    {availableStreams.isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4 mr-2" />
                    )}
                    Refresh Streams
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full md:w-auto"
                    onClick={() =>
                      appendStream({ streamId: "", percentage: "" })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stream
                  </Button>
                </div>
              </div>
              {!selectedAccount?.address && (
                <p className="text-sm text-muted-foreground">
                  Connect your wallet to automatically populate available
                  streams
                </p>
              )}
              {availableStreams.isLoading && selectedAccount?.address && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading available streams...
                </p>
              )}

              {streamFields.map((field, index) => {
                const currentStreamValue = form.watch(
                  `allocation.streams.${index}.streamId`,
                );
                const isRootStream = availableStreams.data?.find(
                  (stream) => stream.streamId === currentStreamValue,
                )?.isRootStream;

                return (
                  <div key={field.id} className="grid gap-4">
                    {isRootStream && (
                      <Badge className="w-fit">Root Stream</Badge>
                    )}
                    <div className="flex gap-2 items-start">
                      <FormField
                        control={form.control}
                        name={`allocation.streams.${index}.streamId`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input {...field} placeholder="Stream ID" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`allocation.streams.${index}.percentage`}
                        render={({ field }) => (
                          <FormItem className="w-32">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="%"
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
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
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              <p className="text-sm text-muted-foreground">
                Define how emissions are allocated. Streams allow
                percentage-based distribution from your available streams.
              </p>
            </div>
          )}

          {targetFields.map((field, index) => (
            <div key={field.id} className="grid gap-4">
              <div className="flex gap-2 items-start">
                <FormField
                  control={form.control}
                  name={`targets.${index}.account`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input {...field} placeholder="Account Address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`targets.${index}.weight`}
                  render={({ field }) => (
                    <FormItem className="w-32">
                      <FormControl>
                        <Input {...field} placeholder="Weight" type="number" />
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
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendTarget({ account: "" as SS58Address, weight: "" })
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Target
          </Button>
          <p className="text-sm text-muted-foreground">
            Specify the accounts that will receive emissions and their relative
            weights for distribution.
          </p>

          <FormField
            control={form.control}
            name="distribution.type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Distribution Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select distribution type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="AtBlock">At Block</SelectItem>
                    <SelectItem value="Manual">Manual</SelectItem>
                    <SelectItem value="Automatic">Treshold</SelectItem>
                    <SelectItem value="Interval">Interval</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {distributionType === "Automatic" && (
            <FormField
              control={form.control}
              name="distribution.threshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Threshold Amount</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. 100.0"
                      type="number"
                      step="0.000001"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {distributionType === "AtBlock" && (
            <FormField
              control={form.control}
              name="distribution.blockNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Block Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g.  1000000"
                      type="number"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {distributionType === "Interval" && (
            <FormField
              control={form.control}
              name="distribution.blocks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Block Interval</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. 14400" type="number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <p className="text-sm text-muted-foreground">
            Configure how and when emissions are distributed to target accounts.
          </p>

          <FormField
            control={form.control}
            name="duration.type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Indefinite">Indefinite</SelectItem>
                    <SelectItem value="UntilBlock">Until Block</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {durationType === "UntilBlock" && (
            <FormField
              control={form.control}
              name="duration.blockNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Block Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="2000000" type="number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <p className="text-sm text-muted-foreground">
            Set how long this permission remains active (indefinitely or until a
            specific block number).
          </p>

          <FormField
            control={form.control}
            name="revocation.type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Revocation Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select revocation type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Irrevocable">Irrevocable</SelectItem>
                    <SelectItem value="RevocableByGrantor">
                      Revocable by Delegator
                    </SelectItem>
                    <SelectItem value="RevocableByArbiters">
                      Revocable by Arbiters
                    </SelectItem>
                    <SelectItem value="RevocableAfter">
                      Revocable After Block
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {revocationType === "RevocableByArbiters" && (
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <FormLabel>Arbiters</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
                  onClick={() => (appendArbiter as any)("")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Arbiter
                </Button>
              </div>
              {arbiterFields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <FormField
                    control={form.control}
                    name={`revocation.accounts.${index}`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g. 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
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
                    onClick={() => removeArbiter(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <FormField
                control={form.control}
                name="revocation.requiredVotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Votes</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. 2" type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {revocationType === "RevocableAfter" && (
            <FormField
              control={form.control}
              name="revocation.blockNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Revocable After Block</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. 1500000"
                      type="number"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <p className="text-sm text-muted-foreground">
            Define the conditions under which this permission can be revoked or
            cancelled.
          </p>

          <Button
            type="submit"
            variant="outline"
            className="w-full"
            disabled={
              mutation.isPending ||
              !isAccountConnected ||
              !form.formState.isValid
            }
          >
            {mutation.isPending
              ? "Awaiting Signature..."
              : "Delegate Permission"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
