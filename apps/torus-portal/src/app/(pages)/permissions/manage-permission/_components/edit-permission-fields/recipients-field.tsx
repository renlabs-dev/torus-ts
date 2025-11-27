import { Button } from "@torus-ts/ui/components/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";
import { cn } from "@torus-ts/ui/lib/utils";
import { FormAddressField } from "~/app/_components/address-field";
import { Plus, Trash2 } from "lucide-react";
import type { Control } from "react-hook-form";
import { useFieldArray, useWatch } from "react-hook-form";
import type { EditPermissionFormData } from "../edit-permission-schema";

interface RecipientsFieldProps {
  control: Control<EditPermissionFormData>;
  canEditRecipients?: boolean;
  isWeightsOnly?: boolean;
}

export function RecipientsField({
  control,
  canEditRecipients = true,
  isWeightsOnly = false,
}: RecipientsFieldProps) {
  const {
    fields: recipientFields,
    append: appendRecipient,
    remove: removeRecipient,
  } = useFieldArray({
    control,
    name: "newTargets",
  });

  // Watch all recipient values to calculate total
  const recipients = useWatch({
    control,
    name: "newTargets",
  });

  const totalPercentage =
    recipients?.reduce(
      (sum, recipient) => sum + (recipient.percentage || 0),
      0,
    ) ?? 0;

  const isOverLimit = totalPercentage > 100;

  // Check for duplicate addresses
  const addresses = recipients?.map((r) => r.address).filter(Boolean) ?? [];
  const duplicateAddresses = new Set(
    addresses.filter((addr, index) => addresses.indexOf(addr) !== index),
  );

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3
            className={cn(
              "font-medium",
              (!canEditRecipients || isWeightsOnly) && "text-muted-foreground",
            )}
          >
            Recipients
          </h3>
          <span
            className={cn(
              "text-xs",
              isOverLimit
                ? "text-destructive font-semibold"
                : "text-muted-foreground",
            )}
          >
            ({totalPercentage}% / 100%)
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          className="bg-white/70"
          disabled={!canEditRecipients || isWeightsOnly}
          onClick={() => appendRecipient({ address: "", percentage: 0 })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Recipient
        </Button>
      </div>

      {recipientFields.map((field, index) => (
        <div key={field.id} className="space-y-1">
          <div className="flex items-start gap-2">
            <FormField
              control={control}
              name={`newTargets.${index}.address`}
              render={({ field }) => {
                const isDuplicate =
                  field.value !== undefined &&
                  duplicateAddresses.has(field.value);
                return (
                  <div className="flex-1">
                    <FormAddressField
                      field={field}
                      className={cn(isDuplicate && "border-destructive")}
                      disabled={!canEditRecipients || isWeightsOnly}
                    />
                  </div>
                );
              }}
            />
            <FormField
              control={control}
              name={`newTargets.${index}.percentage`}
              render={({ field }) => (
                <FormItem className="w-32">
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="%"
                      min="0"
                      max="100"
                      className="h-[2.7rem]"
                      disabled={!(canEditRecipients || isWeightsOnly)}
                      value={field.value}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        field.onChange(
                          isNaN(value) ? 0 : Math.min(100, Math.max(0, value)),
                        );
                      }}
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
              className="mt-0 h-[2.7rem] w-[2.7rem]"
              disabled={!canEditRecipients || isWeightsOnly}
              onClick={() => removeRecipient(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
