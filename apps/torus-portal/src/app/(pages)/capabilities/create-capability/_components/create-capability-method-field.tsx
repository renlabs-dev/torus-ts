import type { Control } from "react-hook-form";
import type { z } from "zod";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@torus-ts/ui/components/toggle-group";

import type { CREATE_CAPABILITY_SCHEMA } from "./create-capability-schema";
import { HTTP_METHODS } from "./create-capability-schema";

interface CreateCapabilityMethodFieldProps {
  control: Control<z.infer<typeof CREATE_CAPABILITY_SCHEMA>>;
  isDisabled: boolean;
  onMethodChange: (value: string) => void;
}

export function CreateCapabilityMethodField({
  control,
  isDisabled,
  onMethodChange,
}: CreateCapabilityMethodFieldProps) {
  return (
    <FormField
      control={control}
      name="method"
      render={({ field }) => (
        <FormItem>
          <FormLabel>REST Method</FormLabel>
          <FormControl>
            <ToggleGroup
              type="single"
              value={field.value}
              onValueChange={(value) => {
                if (value) {
                  field.onChange(value);
                  onMethodChange(value);
                }
              }}
              className="justify-start flex-wrap gap-2"
              disabled={isDisabled}
            >
              {HTTP_METHODS.map((method) => (
                <ToggleGroupItem
                  key={method}
                  value={method}
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {method.toUpperCase()}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </FormControl>
          <FormDescription>
            Select the REST method that this capability will handle
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
