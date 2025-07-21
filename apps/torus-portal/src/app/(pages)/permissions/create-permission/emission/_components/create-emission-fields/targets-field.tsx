import React from "react";

import { Plus, Trash2 } from "lucide-react";
import { useFieldArray } from "react-hook-form";

import type { SS58Address } from "@torus-network/sdk/types";

import { Button } from "@torus-ts/ui/components/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";

import type { CreateEmissionPermissionForm } from "../create-emission-permission-form-schema";

interface TargetsFieldProps {
  form: CreateEmissionPermissionForm;
  isAccountConnected: boolean;
}

export function TargetsField({ form, isAccountConnected }: TargetsFieldProps) {
  const {
    fields: targetFields,
    append: appendTarget,
    remove: removeTarget,
  } = useFieldArray({
    control: form.control,
    name: "targets",
  });

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <FormLabel>Target Accounts</FormLabel>
        <Button
          type="button"
          size="sm"
          onClick={() =>
            appendTarget({ account: "" as SS58Address, weight: "" })
          }
          disabled={!isAccountConnected}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Target
        </Button>
      </div>

      {targetFields.map((field, index) => (
        <div
          key={field.id}
          className="grid gap-3 pt-4 px-4 pb-2 border rounded-md relative"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Target {index + 1}</h4>
            {targetFields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeTarget(index)}
                disabled={!isAccountConnected}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-[1fr,120px] gap-3">
            <FormField
              control={form.control}
              name={`targets.${index}.account`}
              render={({ field: accountField }) => (
                <FormItem>
                  <FormLabel>Account</FormLabel>
                  <FormControl>
                    <Input
                      {...accountField}
                      placeholder="e.g. 5FHy...Wdpc"
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
              name={`targets.${index}.weight`}
              render={({ field: weightField }) => (
                <FormItem>
                  <FormLabel>Weight</FormLabel>
                  <FormControl>
                    <Input
                      {...weightField}
                      placeholder="e.g. 50%"
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
      ))}
    </div>
  );
}
