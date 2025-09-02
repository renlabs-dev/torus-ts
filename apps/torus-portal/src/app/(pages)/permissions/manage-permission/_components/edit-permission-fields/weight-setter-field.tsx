import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { FormAddressField } from "~/app/_components/address-field";
import type { Control } from "react-hook-form";
import type { EditPermissionFormData } from "../edit-permission-schema";

interface WeightSetterFieldProps {
  control: Control<EditPermissionFormData>;
  isAccountConnected: boolean;
  disabled?: boolean;
}

export function WeightSetterField({
  control,
  isAccountConnected,
  disabled = false,
}: WeightSetterFieldProps) {
  return (
    <FormField
      control={control}
      name="weightSetter"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Weight Setter (Optional)</FormLabel>
          <FormControl>
            <FormAddressField
              field={{
                ...field,
                value: field.value || "",
                onChange: (value: string) => field.onChange(value || undefined),
              }}
              label=""
              disabled={!isAccountConnected || disabled}
            />
          </FormControl>
          <div className="text-muted-foreground text-sm">
            Account authorized to modify recipient weights in this permission
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
