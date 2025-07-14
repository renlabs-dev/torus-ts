import { Plus, Trash2 } from "lucide-react";
import type { Control } from "react-hook-form";
import { useFieldArray } from "react-hook-form";

import { Button } from "@torus-ts/ui/components/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";

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

  return (
    <div className="grid gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Targets</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => appendTarget({ address: "", weight: 1 })}
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
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input {...field} placeholder="Agent address" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`newTargets.${index}.weight`}
            render={({ field }) => (
              <FormItem className="w-32">
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder="Weight"
                    value={field.value || ""}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      field.onChange(isNaN(value) ? 1 : value);
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
