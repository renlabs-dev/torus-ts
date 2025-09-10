import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import type { Control } from "react-hook-form";
import type { ExecuteWalletFormData } from "./execute-wallet-schema";

interface OperationTypeFieldProps {
  control: Control<ExecuteWalletFormData>;
  canTransferStake?: boolean;
}

export function OperationTypeField({
  control,
  canTransferStake = true,
}: OperationTypeFieldProps) {
  return (
    <FormField
      control={control}
      name="operationType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Operation Type</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select operation type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="Unstake">Unstake</SelectItem>
              <SelectItem value="Transfer" disabled={!canTransferStake}>
                Transfer Stake{" "}
                {!canTransferStake ? "(Disabled by permission)" : ""}
              </SelectItem>
            </SelectContent>
          </Select>
          <FormDescription>
            Choose the type of wallet stake operation to execute.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
