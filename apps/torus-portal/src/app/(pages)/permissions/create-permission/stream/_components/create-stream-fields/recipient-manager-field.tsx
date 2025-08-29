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

interface RecipientManagerFieldProps {
  form: CreateStreamPermissionForm;
  isAccountConnected: boolean;
}

export function RecipientManagerField({
  form,
  isAccountConnected,
}: RecipientManagerFieldProps) {
  return (
    <div className="grid gap-3">
      <FormLabel className="text-sm font-medium">
        Recipient Manager (Optional)
      </FormLabel>
      <p className="text-sm text-gray-500">
        Account authorized to manage recipients for this stream permission.
        Leave empty if no specific manager is required.
      </p>

      <FormField
        control={form.control}
        name="recipientManager"
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
