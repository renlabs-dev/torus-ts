import React from "react";

import { Plus, Trash2 } from "lucide-react";
import { useFieldArray } from "react-hook-form";

import type { SS58Address } from "@torus-network/sdk/types";

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

import { FormAddressField } from "~/app/_components/address-field";
import { useMultipleAccountEmissions } from "~/hooks/use-multiple-account-emissions";
import { calculateEmissionValue } from "~/utils/calculate-emission-value";

import type { CreateEmissionPermissionForm } from "../create-emission-permission-form-schema";

interface TargetsFieldProps {
  form: CreateEmissionPermissionForm;
  isAccountConnected: boolean;
}

export function TargetsField({ form, isAccountConnected }: TargetsFieldProps) {
  const { selectedAccount } = useTorus();

  const {
    fields: targetFields,
    append: appendTarget,
    remove: removeTarget,
  } = useFieldArray({
    control: form.control,
    name: "targets",
  });

  const emissionsData = useMultipleAccountEmissions({
    accountIds: selectedAccount?.address ? [selectedAccount.address] : [],
  });

  const accountEmissions = selectedAccount?.address
    ? emissionsData[selectedAccount.address]
    : null;

  // Calculate total stream percentage to determine what portion targets get
  const totalStreamPercentage =
    form.watch("allocation.streams").reduce((total, stream) => {
      return total + (Number(stream.percentage) || 0);
    }, 0) || 0;

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <FormLabel>Target Accounts</FormLabel>
        <Button
          type="button"
          size="sm"
          className="bg-white/70"
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

          <div className="grid grid-cols-1 md:grid-cols-[1fr,120px] gap-3">
            <FormField
              control={form.control}
              name={`targets.${index}.account`}
              render={({ field: accountField }) => (
                <FormAddressField
                  field={accountField}
                  label="Account"
                  disabled={!isAccountConnected}
                />
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
                      className="h-[2.6rem]"
                    />
                  </FormControl>
                  <div className="text-xs text-green-400 mt-1">
                    {(() => {
                      const targetWeight = Number(weightField.value) || 0;
                      const targetPercentage =
                        totalStreamPercentage > 0
                          ? (targetWeight / 100) * totalStreamPercentage
                          : 0;

                      return `${targetWeight}% of ${totalStreamPercentage}% = ${calculateEmissionValue(
                        targetPercentage,
                        accountEmissions,
                        isAccountConnected,
                        selectedAccount?.address,
                      )}`;
                    })()}
                  </div>
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
