import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const stakedAccountValue = control._formValues.unstakeData?.staked || "";

  return (
    <>
      <div className="space-y-2">
        <FormLabel>Staked Account</FormLabel>
        <div className="bg-muted/50 rounded-md border px-3 py-2 text-sm">
          {stakedAccountValue}
        </div>
        <FormDescription>
          The account from which to unstake tokens (determined by the
          permission).
        </FormDescription>
      </div>

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
