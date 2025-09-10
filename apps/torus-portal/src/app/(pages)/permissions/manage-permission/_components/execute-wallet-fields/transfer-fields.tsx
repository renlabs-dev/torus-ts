import type { Api } from "@torus-network/sdk/chain";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { FormAddressField } from "~/app/_components/address-field";
import type { Control } from "react-hook-form";
import type { ExecuteWalletFormData } from "./execute-wallet-schema";
import { TokenAmountInput } from "./token-amount-input";

interface TransferFieldsProps {
  control: Control<ExecuteWalletFormData>;
  isAccountConnected: boolean;
  api: Api | null;
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
        <div className="bg-muted/50 flex items-center justify-between rounded-md border px-3 py-2 text-sm">
          <span>{fromAccountValue}</span>
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
              <TokenAmountInput
                value={field.value}
                onChange={field.onChange}
                placeholder="Enter amount to transfer"
                disabled={!isAccountConnected}
              />
            </FormControl>
            <FormDescription>Amount of tokens to transfer.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
