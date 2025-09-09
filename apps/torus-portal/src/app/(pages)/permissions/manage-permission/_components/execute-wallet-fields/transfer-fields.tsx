import type { Control } from "react-hook-form";
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
import type { ExecuteWalletFormData } from "./execute-wallet-schema";

interface TransferFieldsProps {
  control: Control<ExecuteWalletFormData>;
  isAccountConnected: boolean;
}

export function TransferFields({ control, isAccountConnected }: TransferFieldsProps) {
  return (
    <>
      <FormField
        control={control}
        name="transferData.from"
        render={({ field }) => (
          <FormItem>
            <FormLabel>From Account</FormLabel>
            <FormControl>
              <FormAddressField
                field={field}
                disabled={!isAccountConnected}
              />
            </FormControl>
            <FormDescription>
              The account to transfer stake from.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="transferData.to"
        render={({ field }) => (
          <FormItem>
            <FormLabel>To Account</FormLabel>
            <FormControl>
              <FormAddressField
                field={field}
                disabled={!isAccountConnected}
              />
            </FormControl>
            <FormDescription>
              The account to transfer stake to.
            </FormDescription>
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