import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { FormAddressField } from "~/app/_components/address-field";
import React from "react";
import type { CreateStreamPermissionForm } from "../create-stream-permission-form-schema";

interface WeightSetterFieldProps {
  form: CreateStreamPermissionForm;
  isAccountConnected: boolean;
}

export function WeightSetterField({
  form,
  isAccountConnected,
}: WeightSetterFieldProps) {
  return (
    <div className="grid gap-3">
      <FormLabel className="text-sm font-medium">
        Weight Setter (Optional)
      </FormLabel>
      <p className="text-sm text-gray-500">
        Account authorized to modify recipient weights for this stream
        permission. Leave empty if no specific weight setter is required.
      </p>

      <FormField
        control={form.control}
        name="weightSetter"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <FormAddressField
                field={{
                  ...field,
                  value: field.value || "",
                  onChange: (value: string) =>
                    field.onChange(value || undefined),
                }}
                label="Address (Optional)"
                disabled={!isAccountConnected}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
