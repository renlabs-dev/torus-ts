"use client";

import { useCallback } from "react";
import type { SS58Address } from "@torus-network/sdk";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useFieldArray } from "react-hook-form";

import { useTorus } from "@torus-ts/torus-provider";
import { useNamespaceEntriesOf } from "@torus-ts/query-provider/hooks";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import type {
  GrantNamespacePermissionForm,
  GrantNamespacePermissionFormData,
  GrantNamespacePermissionMutation,
} from "./grant-namespace-permission-form-schema";

// Every single namespace name has been changed to Capability Permission
// as requested here: https://coda.io/d/RENLABS-CORE-DEVELOPMENT-DOCUMENTS_d5Vgr5OavNK/Text-change-requests_su4jQAlx
// In the future we are going to have all the other names from namespace to Capability Permission
// TODO : Change all namespace to Capability Permission

// Every single grantor/grantee terminology has been changed to delegator/recipient
// as requested here: https://coda.io/d/RENLABS-CORE-DEVELOPMENT-DOCUMENTS_d5Vgr5OavNK/Text-change-requests_su4jQAlx
// This change affects UI labels, variable names, and function names throughout the codebase
// TODO : Ensure all grantor/grantee references are updated to delegator/recipient

interface GrantNamespacePermissionFormProps {
  form: GrantNamespacePermissionForm;
  mutation: GrantNamespacePermissionMutation;
  onClose?: () => void;
}

export function GrantNamespacePermissionFormComponent({
  form,
  mutation,
}: GrantNamespacePermissionFormProps) {
  const { isAccountConnected, selectedAccount, api } = useTorus();

  // Get user's namespaces for the dropdown
  const namespaceEntries = useNamespaceEntriesOf(
    api,
    selectedAccount?.address as SS58Address,
  );

  // Watch form values for conditional rendering
  const durationType = form.watch("duration.type");
  const revocationType = form.watch("revocation.type");

  const {
    fields: arbiterFields,
    append: appendArbiter,
    remove: removeArbiter,
  } = useFieldArray({
    control: form.control,
    // @ts-expect-error - TypeScript has issues with conditional schema fields
    name: "revocation.accounts",
  });

  const namespaceOptions =
    namespaceEntries.data?.map((entry) => entry.path.join(".")) ?? [];

  const onSubmit = useCallback(
    (data: GrantNamespacePermissionFormData) => {
      mutation.mutate(data);
    },
    [mutation],
  );

  return (
    <Card className="border-none w-full">
      <CardHeader>
        <CardTitle>Grant Capability Permission</CardTitle>
        <CardDescription>
          Grant permission to access a specific capability permission path.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <WalletConnectionWarning isAccountConnected={isAccountConnected} />

            {/* Recipient */}
            <FormField
              control={form.control}
              name="grantee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="5Dx...abc (SS58 address)"
                      disabled={!isAccountConnected}
                    />
                  </FormControl>
                  <FormDescription>
                    The account that will receive the capability permission.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Namespace Path */}
            <FormField
              control={form.control}
              name="namespacePath"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capability Permission Path</FormLabel>
                  <FormControl>
                    {!isAccountConnected ? (
                      <Input
                        {...field}
                        placeholder="Connect wallet to see your capability permissions"
                        disabled
                      />
                    ) : namespaceEntries.isLoading ? (
                      <Input
                        {...field}
                        placeholder="Loading capability permissions..."
                        disabled
                      />
                    ) : namespaceOptions.length === 0 ? (
                      <Input
                        {...field}
                        placeholder="No capability permissions found - create a capability permission first"
                        disabled
                      />
                    ) : (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a capability permission..." />
                        </SelectTrigger>
                        <SelectContent>
                          {namespaceOptions.map((path) => (
                            <SelectItem key={path} value={path}>
                              <span className="font-mono">{path}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FormControl>
                  <FormDescription>
                    Choose from your existing capability permissions to grant
                    access to.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Duration */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="duration.type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value === "Indefinite") {
                            form.setValue("duration", { type: "Indefinite" });
                          } else {
                            form.setValue("duration", {
                              type: "UntilBlock",
                              blockNumber: "",
                            });
                          }
                        }}
                        disabled={!isAccountConnected}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Indefinite">Indefinite</SelectItem>
                          <SelectItem value="UntilBlock">
                            Until Block
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
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
                      <FormLabel>Block Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g. 1000000"
                          type="number"
                          disabled={!isAccountConnected}
                        />
                      </FormControl>
                      <FormDescription>
                        The block number when this permission expires.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Revocation */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="revocation.type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Revocation Terms</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          switch (value) {
                            case "Irrevocable":
                              form.setValue("revocation", {
                                type: "Irrevocable",
                              });
                              break;
                            case "RevocableByGrantor":
                              form.setValue("revocation", {
                                type: "RevocableByGrantor",
                              });
                              break;
                            case "RevocableByArbiters":
                              form.setValue("revocation", {
                                type: "RevocableByArbiters",
                                accounts: [],
                                requiredVotes: "1",
                              });
                              break;
                            case "RevocableAfter":
                              form.setValue("revocation", {
                                type: "RevocableAfter",
                                blockNumber: "",
                              });
                              break;
                          }
                        }}
                        disabled={!isAccountConnected}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select revocation terms..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Irrevocable">
                            Irrevocable
                          </SelectItem>
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {revocationType === "RevocableByArbiters" && (
                <>
                  <div className="space-y-2">
                    <FormLabel>Arbiters</FormLabel>
                    {arbiterFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2">
                        <FormField
                          control={form.control}
                          name={`revocation.accounts.${index}`}
                          render={({ field: arbiterField }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input
                                  {...arbiterField}
                                  placeholder="5Dx...abc (SS58 address)"
                                  disabled={!isAccountConnected}
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
                          onClick={() => removeArbiter(index)}
                          disabled={
                            !isAccountConnected || arbiterFields.length <= 1
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendArbiter("")}
                      disabled={!isAccountConnected}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Arbiter
                    </Button>
                  </div>

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
                            min="1"
                            disabled={!isAccountConnected}
                          />
                        </FormControl>
                        <FormDescription>
                          Number of arbiter votes required to revoke this
                          permission.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
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
                          placeholder="e.g. 1000000"
                          type="number"
                          disabled={!isAccountConnected}
                        />
                      </FormControl>
                      <FormDescription>
                        The block number after which this permission can be
                        revoked.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={
                !isAccountConnected ||
                mutation.isPending ||
                namespaceOptions.length === 0
              }
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Granting Permission...
                </>
              ) : !isAccountConnected ? (
                "Connect Wallet to Continue"
              ) : namespaceOptions.length === 0 ? (
                "Create a Capability Permission First"
              ) : (
                "Grant Capability Permission"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
