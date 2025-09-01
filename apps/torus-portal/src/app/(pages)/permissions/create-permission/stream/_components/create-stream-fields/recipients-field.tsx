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
import { calculateStreamValue } from "~/utils/calculate-stream-value";
import { Plus, Trash2 } from "lucide-react";
import React from "react";
import { useFieldArray } from "react-hook-form";
import type { CreateStreamPermissionForm } from "../create-stream-permission-form-schema";

interface RecipientsFieldProps {
  form: CreateStreamPermissionForm;
  isAccountConnected: boolean;
}

export function RecipientsField({
  form,
  isAccountConnected,
}: RecipientsFieldProps) {
  const { selectedAccount } = useTorus();

  const {
    fields: recipientFields,
    append: appendRecipient,
    remove: removeRecipient,
  } = useFieldArray({
    control: form.control,
    name: "recipients",
  });

  const emissionsData = useMultipleAccountEmissions({
    accountIds: selectedAccount?.address ? [selectedAccount.address] : [],
  });

  const accountEmissions = selectedAccount?.address
    ? emissionsData[selectedAccount.address]
    : null;

  // Calculate total stream percentage to determine what portion recipients get
  const totalStreamPercentage =
    form.watch("allocation.streams").reduce((total, stream) => {
      return total + (Number(stream.percentage) || 0);
    }, 0) || 0;

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <FormLabel>Recipient Accounts</FormLabel>
        <Button
          type="button"
          size="sm"
          className="bg-white/70"
          onClick={() =>
            appendRecipient({ account: "" as SS58Address, weight: "" })
          }
          disabled={!isAccountConnected}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Recipient
        </Button>
      </div>

      {recipientFields.map((field, index) => (
        <div
          key={field.id}
          className="relative grid gap-3 rounded-md border px-4 pb-2 pt-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Recipient {index + 1} (
              {(() => {
                const recipientWeight =
                  Number(form.watch(`recipients.${index}.weight`)) || 0;
                const recipientPercentage =
                  totalStreamPercentage > 0
                    ? (recipientWeight / 100) * totalStreamPercentage
                    : 0;

                return `${recipientWeight}% of ${totalStreamPercentage}% = ${calculateStreamValue(
                  recipientPercentage,
                  accountEmissions,
                  isAccountConnected,
                  selectedAccount?.address,
                  "value-only",
                )}`;
              })()}
              )
            </h4>
            {recipientFields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeRecipient(index)}
                disabled={!isAccountConnected}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr,120px]">
            <FormField
              control={form.control}
              name={`recipients.${index}.account`}
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
              name={`recipients.${index}.weight`}
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
