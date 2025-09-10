import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";
import { FormAddressField } from "~/app/_components/address-field";
import type { Control } from "react-hook-form";
import type { ExecuteWalletFormData } from "./execute-wallet-schema";

interface TransferFieldsProps {
  control: Control<ExecuteWalletFormData>;
  isAccountConnected: boolean;
}

export function TransferFields({
  control,
  isAccountConnected,
}: TransferFieldsProps) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const fromAccountValue = control._formValues.transferData?.from || "";

  return (
    <>
      <div className="space-y-2">
        <FormLabel>From Account</FormLabel>
        <div className="bg-muted/50 rounded-md border px-3 py-2 text-sm">
          {fromAccountValue}
        </div>
        <FormDescription>
          The account to transfer stake from (determined by the permission).
        </FormDescription>
      </div>

      <FormField
        control={control}
        name="transferData.to"
        render={({ field }) => (
          <FormItem>
            <FormLabel>To Account</FormLabel>
            <FormControl>
              <FormAddressField field={field} disabled={!isAccountConnected} />
            </FormControl>
            <FormDescription>The account to transfer stake to.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="transferData.amount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Amount</FormLabel>
            <FormControl>
              <Input
                type="text"
                placeholder="Enter amount to transfer"
                disabled={!isAccountConnected}
                {...field}
              />
            </FormControl>
            <FormDescription>
              Amount of tokens to transfer (in smallest unit).
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
