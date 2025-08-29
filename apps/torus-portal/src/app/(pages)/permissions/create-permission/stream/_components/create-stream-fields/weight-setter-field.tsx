import {
  FormControl,
  FormField,
  FormItem,
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
                label="Weight Setter (Optional)"
                disabled={!isAccountConnected}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <p className="text-sm text-gray-500">
        Account authorized to modify recipient weights for this stream
        permission. Leave empty if no specific weight setter is required.
      </p>
    </div>
  );
}
