"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";
import { Button } from "@torus-ts/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import {
  Plus,
  Trash2,
  Coins,
  Target,
  Clock,
  Settings,
  Siren,
  Split,
} from "lucide-react";
import { useFieldArray } from "react-hook-form";
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

export function GrantEmissionPermissionFormComponent({
  form,
  mutation,
  onClose,
}: GrantEmissionPermissionFormProps) {
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
    name: "revocation.accounts",
  });

  const {
    fields: controllerFields,
    append: appendController,
    remove: removeController,
  } = useFieldArray({
    control: form.control,
    name: "enforcement.controllers",
  });

  const allocationType = form.watch("allocation.type");
  const distributionType = form.watch("distribution.type");
  const durationType = form.watch("duration.type");
  const revocationType = form.watch("revocation.type");
  const enforcementType = form.watch("enforcement.type");

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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Basic Information
              </CardTitle>
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
                        placeholder="5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
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
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
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
                        <SelectItem value="FixedAmount">
                          Fixed Amount
                        </SelectItem>
                        <SelectItem value="Streams">Streams</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                          placeholder="1000.0"
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
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Streams</h4>
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
                  {streamFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-start">
                      <FormField
                        control={form.control}
                        name={`allocation.streams.${index}.streamId`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Stream ID</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="0x..." />
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
                                placeholder="50"
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
                        className="mt-8"
                        onClick={() => removeStream(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
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
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Define the accounts that will receive emissions and their
                  weights
                </p>
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
              {targetFields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
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
                          <Input {...field} placeholder="100" type="number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-8"
                    onClick={() => removeTarget(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Distribution Control
              </CardTitle>
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
                        <SelectItem value="Manual">Manual</SelectItem>
                        <SelectItem value="Automatic">Automatic</SelectItem>
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
                  name="distribution.threshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Threshold Amount</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="100.0"
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
                        <Input {...field} placeholder="1000000" type="number" />
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
                        <Input {...field} placeholder="14400" type="number" />
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
                      onClick={() => appendArbiter("")}
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
                            <FormLabel>Arbiter Address</FormLabel>
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
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-8"
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
                          <Input {...field} placeholder="2" type="number" />
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
                        <Input {...field} placeholder="1500000" type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Enforcement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Siren className="h-5 w-5" />
                Enforcement Authority
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="enforcement.type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enforcement Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select enforcement type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="None">None</SelectItem>
                        <SelectItem value="ControlledBy">
                          Controlled By
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {enforcementType === "ControlledBy" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Controllers</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendController("")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Controller
                    </Button>
                  </div>
                  {controllerFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-start">
                      <FormField
                        control={form.control}
                        name={`enforcement.controllers.${index}`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Controller Address</FormLabel>
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
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-8"
                        onClick={() => removeController(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <FormField
                    control={form.control}
                    name="enforcement.requiredVotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Required Votes</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="1" type="number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
