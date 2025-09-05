import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { cn } from "@torus-ts/ui/lib/utils";
import { FormAddressField } from "~/app/_components/address-field";
import type { Control } from "react-hook-form";
import type { EditPermissionFormData } from "../edit-permission-schema";

interface RecipientManagerFieldProps {
  control: Control<EditPermissionFormData>;
  isAccountConnected: boolean;
  disabled?: boolean;
}

export function RecipientManagerField({
  control,
  isAccountConnected,
  disabled = false,
}: RecipientManagerFieldProps) {
  return (
    <FormField
      control={control}
      name="recipientManager"
      render={({ field }) => (
        <FormItem>
          <FormLabel className={cn(disabled && "text-muted-foreground")}>
            Recipient Manager (Optional)
          </FormLabel>
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
            Account authorized to modify recipients in this permission
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
