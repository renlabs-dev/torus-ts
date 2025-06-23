"use client";

import { useCallback } from "react";
import type { SS58Address } from "@torus-network/sdk";
import { checkSS58 } from "@torus-network/sdk";
import { Loader2, Plus, Trash2, Wand2, Lock, AlertCircle } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
import { Card, CardContent } from "@torus-ts/ui/components/card";
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
import { Badge } from "@torus-ts/ui/components/badge";
import { Alert, AlertDescription } from "@torus-ts/ui/components/alert";
import { WalletConnectionWarning } from "@torus-ts/ui/components/wallet-connection-warning";
import { useAvailableStreams } from "~/hooks/use-available-streams";
import type {
  EditEmissionPermissionForm,
  EditEmissionPermissionFormData,
  EditEmissionPermissionMutation,
  PermissionInfo,
} from "./edit-emission-permission-form-schema";

interface EditEmissionPermissionFormProps {
  form: EditEmissionPermissionForm;
  mutation: EditEmissionPermissionMutation;
  permissionInfo: PermissionInfo;
  onClose?: () => void;
}

const checkSS58IfDefined = (addressTxt?: string) =>
  addressTxt ? checkSS58(addressTxt) : null;

export function EditEmissionPermissionFormComponent({
  form,
  mutation,
  permissionInfo,
  onClose,
}: EditEmissionPermissionFormProps) {
  const { api, selectedAccount, isAccountConnected } = useTorus();

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
    name: "newTargets",
  });

  const {
    fields: streamFields,
    append: appendStream,
    remove: removeStream,
  } = useFieldArray({
    control: form.control,
    name: "newStreams",
  });

  const distributionType = form.watch("newDistributionControl.type");
  const { canEditStreams, canEditDistribution } = permissionInfo;

  const handleAutoPopulateStreams = useCallback(() => {
    if (!availableStreams.data) return;

    // Clear existing streams
    const currentStreamCount = streamFields.length;
    for (let i = currentStreamCount - 1; i >= 0; i--) {
      removeStream(i);
    }

    // Add available streams with current percentages if they exist
    availableStreams.data.forEach((stream) => {
      const existingStream = permissionInfo.currentStreams?.find(
        (s) => s.streamId === stream.streamId,
      );
      appendStream({
        streamId: stream.streamId,
        percentage: existingStream?.percentage ?? "",
      });
    });
  }, [
    availableStreams.data,
    streamFields.length,
    removeStream,
    appendStream,
    permissionInfo.currentStreams,
  ]);

  const onSubmit = (data: EditEmissionPermissionFormData) => {
    mutation.mutate(data);
  };

  const PermissionInfo = () => (
    <Alert className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center gap-2 mb-2">
          <Badge
            variant={
              permissionInfo.userRole === "grantor" ? "default" : "secondary"
            }
          >
            {permissionInfo.userRole === "grantor" ? "Grantor" : "Grantee"}
          </Badge>
          <span className="text-sm">
            Permission: {permissionInfo.permissionId.substring(0, 16)}...
          </span>
        </div>
        {permissionInfo.userRole === "grantor" ? (
          canEditStreams && canEditDistribution ? (
            <p className="text-sm">
              As grantor, you can edit all fields based on the permission's
              revocation terms.
            </p>
          ) : (
            <p className="text-sm">
              As grantor, your edit permissions are limited by the revocation
              terms. You can only edit targets.
            </p>
          )
        ) : (
          <p className="text-sm">
            As grantee, you can only edit target accounts and their weights.
            Stream and distribution changes are not permitted.
          </p>
        )}
      </AlertDescription>
    </Alert>
  );

  return (
    <Card className="border-none w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CardContent className="space-y-6">
            <WalletConnectionWarning isAccountConnected={isAccountConnected} />
            <PermissionInfo />

            {/* Targets */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Target Accounts</h4>
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
              </div>

              {targetFields.map((field, index) => (
                <div key={field.id} className="space-y-2">
                  <div className="flex gap-2 items-end">
                    <FormField
                      control={form.control}
                      name={`newTargets.${index}.account`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Account Address</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Account Address" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`newTargets.${index}.weight`}
                      render={({ field }) => (
                        <FormItem className="w-32">
                          <FormLabel>Weight</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Weight"
                              type="number"
                              min="0"
                              max="65535"
                            />
                          </FormControl>
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
                  {/* Error messages below the row */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name={`newTargets.${index}.account`}
                        render={() => <FormMessage />}
                      />
                    </div>
                    <div className="w-32">
                      <FormField
                        control={form.control}
                        name={`newTargets.${index}.weight`}
                        render={() => <FormMessage />}
                      />
                    </div>
                    <div className="w-10"></div>{" "}
                    {/* Spacer for button alignment */}
                  </div>
                </div>
              ))}
              <p className="text-sm text-muted-foreground">
                Specify the accounts that will receive emissions and their
                relative weights for distribution.
              </p>
            </div>

            {/* Streams */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">Streams</h4>
                  {!canEditStreams && (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                {canEditStreams && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
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
                      onClick={() =>
                        appendStream({ streamId: "", percentage: "" })
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Stream
                    </Button>
                  </div>
                )}
              </div>

              {streamFields.map((field, index) => {
                const currentStreamValue = form.watch(
                  `newStreams.${index}.streamId`,
                );
                const isRootStream = availableStreams.data?.find(
                  (stream) => stream.streamId === currentStreamValue,
                )?.isRootStream;

                return (
                  <div key={field.id} className="space-y-2">
                    <div className="flex gap-2 items-end">
                      <FormField
                        control={form.control}
                        name={`newStreams.${index}.streamId`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>
                              {isRootStream && <Badge>Root Stream</Badge>}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Stream ID"
                                disabled={!canEditStreams}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`newStreams.${index}.percentage`}
                        render={({ field }) => (
                          <FormItem className="w-32">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Percentage"
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                disabled={!canEditStreams}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      {canEditStreams && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeStream(index)}
                          className="py-[1.4em]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {/* Error messages below the row */}
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <FormField
                          control={form.control}
                          name={`newStreams.${index}.streamId`}
                          render={() => <FormMessage />}
                        />
                      </div>
                      <div className="w-32">
                        <FormField
                          control={form.control}
                          name={`newStreams.${index}.percentage`}
                          render={() => <FormMessage />}
                        />
                      </div>
                      <div className={canEditStreams ? "w-10" : "w-0"}></div>{" "}
                      {/* Conditional spacer for button alignment */}
                    </div>
                  </div>
                );
              })}
              <p className="text-sm text-muted-foreground">
                {canEditStreams
                  ? "Define the streams and their percentage allocations."
                  : "Stream allocation can only be modified if the permission's revocation terms allow it."}
              </p>
            </div>

            {/* Distribution Control */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">Distribution Control</h4>
                {!canEditDistribution && (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              <FormField
                control={form.control}
                name="newDistributionControl.type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Distribution Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!canEditDistribution}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select distribution type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Manual">Manual</SelectItem>
                        <SelectItem value="Automatic">Threshold</SelectItem>
                        <SelectItem value="AtBlock">At Block</SelectItem>
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
                  name="newDistributionControl.threshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Threshold Amount</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g. 100.0"
                          type="number"
                          step="0.000001"
                          disabled={!canEditDistribution}
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
                  name="newDistributionControl.blockNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Block Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g. 1000000"
                          type="number"
                          disabled={!canEditDistribution}
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
                  name="newDistributionControl.blocks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Block Interval</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g. 14400"
                          type="number"
                          disabled={!canEditDistribution}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <p className="text-sm text-muted-foreground">
                {canEditDistribution
                  ? "Configure how and when emissions are distributed to target accounts."
                  : "Distribution control can only be modified if the permission's revocation terms allow it."}
              </p>
            </div>

            {/* Submit Actions */}
            <div className="flex justify-end space-x-4 pt-4 pb-12">
              {onClose && (
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Permission"
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
