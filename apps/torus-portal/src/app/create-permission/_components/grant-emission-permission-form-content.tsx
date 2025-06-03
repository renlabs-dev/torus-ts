"use client";

import { useCallback, useEffect } from "react";

import { checkSS58 } from "@torus-network/sdk";
import {
  Clock,
  Coins,
  Loader2,
  Plus,
  Settings,
  Split,
  Target,
  Trash2,
  Wand2,
} from "lucide-react";
import { useFieldArray } from "react-hook-form";

import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
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

import { useAvailableStreams } from "~/hooks/use-available-streams";

import type {
  GrantEmissionPermissionForm,
  GrantEmissionPermissionFormData,
  GrantEmissionPermissionMutation,
} from "./grant-emission-permission-form-schema";

interface GrantEmissionPermissionFormProps {
  form: GrantEmissionPermissionForm;
  mutation: GrantEmissionPermissionMutation;
  onClose?: () => void;
}

const checkSS58IfDefined = (addressTxt?: string) =>
  addressTxt ? checkSS58(addressTxt) : null;

export function GrantEmissionPermissionFormComponent({
  form,
  mutation,
  onClose,
}: GrantEmissionPermissionFormProps) {
  const { api, selectedAccount } = useTorus();

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

  // Automatically populate streams when allocation type changes to "Streams" and data is available
  useEffect(() => {
    if (
      allocationType === "Streams" &&
      availableStreams.data &&
      availableStreams.data.length > 0 &&
      streamFields.length === 0
    ) {
      handleAutoPopulateStreams();
    }
  }, [
    allocationType,
    availableStreams.data,
    streamFields.length,
    handleAutoPopulateStreams,
  ]);

  // Automatically populate streams when user account changes (and we're in Streams mode)
  useEffect(() => {
    if (
      allocationType === "Streams" &&
      availableStreams.data &&
      availableStreams.data.length > 0 &&
      selectedAccount?.address
    ) {
      handleAutoPopulateStreams();
    }
  }, [
    selectedAccount?.address,
    availableStreams.data,
    allocationType,
    handleAutoPopulateStreams,
  ]);

  const onSubmit = (data: GrantEmissionPermissionFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Grant Emission Permission</h1>
        <p className="text-muted-foreground">
          Create a new emission permission to grant allocation and distribution
          rights
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Specify the recipient who will receive the emission permission
                and be able to allocate streams.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="grantee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Grantee Address <span className="text-red-500">*</span>
                    </FormLabel>
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
            </CardContent>
          </Card>

          {/* Allocation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Allocation Configuration
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Define how emissions are allocated. Streams allow
                percentage-based distribution from your available streams.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        onClick={handleAutoPopulateStreams}
                        disabled={
                          availableStreams.isLoading ||
                          !availableStreams.data?.length ||
                          !selectedAccount?.address
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
                  {availableStreams.data &&
                    availableStreams.data.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Automatically populated {availableStreams.data.length}{" "}
                        available streams for your account
                      </p>
                    )}
                  {availableStreams.data &&
                    availableStreams.data.length === 0 &&
                    selectedAccount?.address && (
                      <p className="text-sm text-muted-foreground">
                        No streams found for your account. You can add streams
                        manually.
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
                      <div key={field.id} className="flex gap-2 items-end">
                        <FormField
                          control={form.control}
                          name={`allocation.streams.${index}.streamId`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="flex items-center gap-2 mb-3 md:mb-0">
                                Stream ID
                                {isRootStream && (
                                  <span className="text-xs hidden md:block bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    Root Stream
                                  </span>
                                )}
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g. 0x..." />
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
                              <FormLabel>Percentage</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="e.g. 20"
                                  type="number"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeStream(index)}
                          className="py-[1.4em]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Targets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Target Accounts
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Specify the accounts that will receive emissions and their
                relative weights for distribution.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {targetFields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-end">
                  <FormField
                    control={form.control}
                    name={`targets.${index}.account`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Account Address</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
                          />
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
                        <FormLabel>Weight</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g. 20"
                            type="number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeTarget(index)}
                    className="py-[1.4em]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <div></div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendTarget({ account: "", weight: "" })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Target
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Distribution Control
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Configure how and when emissions are distributed to target
                accounts (manual, automatic, or scheduled).
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        <Input
                          {...field}
                          placeholder="e.g. 14400"
                          type="number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Duration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Duration
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Set how long this permission remains active (indefinitely or
                until a specific block number).
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          {/* Revocation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Split className="h-5 w-5" />
                Revocation Terms
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Define the conditions under which this permission can be revoked
                or cancelled.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
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
                          Revocable by Grantor
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Arbiters</h4>
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
                    <div key={field.id} className="flex gap-2 items-end">
                      <FormField
                        control={form.control}
                        name={`revocation.accounts.${index}`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Arbiter Address</FormLabel>
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
                        size="sm"
                        className="py-[1.4em]"
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
                          <Input
                            {...field}
                            placeholder="e.g. 2"
                            type="number"
                          />
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
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4 justify-center">
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="w-full"
            >
              {mutation.isPending ? "Creating..." : "Create Permission"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
