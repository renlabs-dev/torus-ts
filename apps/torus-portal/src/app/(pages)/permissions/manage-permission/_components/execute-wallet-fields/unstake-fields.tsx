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

interface UnstakeFieldsProps {
  control: Control<ExecuteWalletFormData>;
  isAccountConnected: boolean;
}

export function UnstakeFields({
  control,
  isAccountConnected,
}: UnstakeFieldsProps) {
  return (
    <>
      <FormField
        control={control}
        name="unstakeData.staked"
        render={({ field }) => (
          <div className="space-y-2">
            <FormAddressField
              field={field}
              label="Staked Account"
              disabled={!isAccountConnected}
            />

            <FormDescription>
              The account from which to unstake tokens.
            </FormDescription>
          </div>
        )}
      />

      <FormField
        control={control}
        name="unstakeData.amount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Amount</FormLabel>
            <FormControl>
              <TokenAmountInput
                value={field.value}
                onChange={field.onChange}
                placeholder="Enter amount to unstake"
                disabled={!isAccountConnected}
              />
            </FormControl>
            <FormDescription>Amount of tokens to unstake.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
