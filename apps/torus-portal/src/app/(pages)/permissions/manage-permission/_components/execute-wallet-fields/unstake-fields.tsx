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
          <FormItem>
            <FormLabel>Staked Account</FormLabel>
            <FormControl>
              <FormAddressField field={field} disabled={!isAccountConnected} />
            </FormControl>
            <FormDescription>
              The account from which to unstake tokens.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="unstakeData.amount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Amount</FormLabel>
            <FormControl>
              <Input
                type="text"
                placeholder="Enter amount to unstake"
                disabled={!isAccountConnected}
                {...field}
              />
            </FormControl>
            <FormDescription>
              Amount of tokens to unstake (in smallest unit).
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
