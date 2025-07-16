import React from "react";

import { Plus, Trash2 } from "lucide-react";
import { useFieldArray } from "react-hook-form";

import type { SS58Address } from "@torus-network/sdk";

import { Button } from "@torus-ts/ui/components/button";
import {
  FormControl,
  FormDescription,
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

import type {
  CreateCapabilityPermissionForm,
} from "../create-capability-permission-form-schema";

interface RevocationFieldProps {
  form: CreateCapabilityPermissionForm;
  isAccountConnected: boolean;
}

export function RevocationField({
  form,
  isAccountConnected,
}: RevocationFieldProps) {
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

  return (
    <div className="grid gap-4">
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
                        accounts: ["" as SS58Address],
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
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select revocation terms..." />
                </SelectTrigger>
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
            </FormControl>
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
              onClick={() => appendArbiter("")}
              disabled={!isAccountConnected}
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
                size="icon"
                onClick={() => removeArbiter(index)}
                disabled={!isAccountConnected || arbiterFields.length <= 1}
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
                    min="1"
                    disabled={!isAccountConnected}
                  />
                </FormControl>
                <FormDescription>
                  Number of arbiter votes required to revoke this permission.
                </FormDescription>
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
                  placeholder="e.g. 1000000"
                  type="number"
                  disabled={!isAccountConnected}
                />
              </FormControl>
              <FormDescription>
                The block number after which this permission can be revoked.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
