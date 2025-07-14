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

interface StreamsFieldProps {
  control: Control<EditPermissionFormData>;
}

export function StreamsField({ control }: StreamsFieldProps) {
  const {
    fields: streamFields,
    append: appendStream,
    remove: removeStream,
  } = useFieldArray({
    control,
    name: "newStreams",
  });

  return (
    <div className="grid gap-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Streams</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => appendStream({ streamId: "", percentage: 0 })}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Stream
        </Button>
      </div>

      {streamFields.map((field, index) => (
        <div key={field.id} className="flex gap-2">
          <FormField
            control={control}
            name={`newStreams.${index}.streamId`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input {...field} placeholder="Stream ID (H256)" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`newStreams.${index}.percentage`}
            render={({ field }) => (
              <FormItem className="w-32">
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder="%"
                    value={field.value || ""}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      field.onChange(isNaN(value) ? 0 : value);
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
            onClick={() => removeStream(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
