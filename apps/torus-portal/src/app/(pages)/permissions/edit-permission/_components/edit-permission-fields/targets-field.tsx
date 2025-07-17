import { AlertCircle, Plus, Trash2 } from "lucide-react";
import type { Control } from "react-hook-form";
import { useFieldArray, useWatch } from "react-hook-form";

import { Button } from "@torus-ts/ui/components/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";
import { cn } from "@torus-ts/ui/lib/utils";

import type { EditPermissionFormData } from "../edit-permission-schema";

interface TargetsFieldProps {
  control: Control<EditPermissionFormData>;
}

export function TargetsField({ control }: TargetsFieldProps) {
  const {
    fields: targetFields,
    append: appendTarget,
    remove: removeTarget,
  } = useFieldArray({
    control,
    name: "newTargets",
  });

  // Watch all target values to calculate total
  const targets = useWatch({
    control,
    name: "newTargets",
  });

  const totalPercentage =
    targets?.reduce((sum, target) => sum + (target.percentage || 0), 0) ?? 0;

  const isOverLimit = totalPercentage > 100;

  // Check for duplicate addresses
  const addresses = targets?.map((t) => t.address).filter(Boolean) ?? [];
  const duplicateAddresses = new Set(
    addresses.filter((addr, index) => addresses.indexOf(addr) !== index),
  );

  return (
    <div className="grid gap-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Targets</h3>
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
          onClick={() => appendTarget({ address: "", percentage: 0 })}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Target
        </Button>
      </div>

      {targetFields.map((field, index) => (
        <div key={field.id} className="flex gap-2">
          <FormField
            control={control}
            name={`newTargets.${index}.address`}
            render={({ field }) => {
              const isDuplicate = duplicateAddresses.has(field.value);
              return (
                <FormItem className="flex-1">
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder="Agent address"
                        className={cn(isDuplicate && "border-destructive")}
                      />
                      {isDuplicate && (
                        <AlertCircle className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
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
                    value={field.value || ""}
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
            onClick={() => removeTarget(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
