import type { Api } from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import type { Control } from "react-hook-form";
import { BalanceDisplay } from "./balance-display";
import type { ExecuteWalletFormData } from "./execute-wallet-schema";
import { TokenAmountInput } from "./token-amount-input";

interface UnstakeFieldsProps {
  control: Control<ExecuteWalletFormData>;
  isAccountConnected: boolean;
  api: Api | null;
}

export function UnstakeFields({
  control,
  isAccountConnected,
  api,
}: UnstakeFieldsProps) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const stakedAccountValue = control._formValues.unstakeData?.staked || "";

  return (
    <>
      <div className="space-y-2">
        <FormLabel>Staked Account</FormLabel>
        <div className="bg-muted/50 flex items-center justify-between rounded-md border px-3 py-2 text-sm">
          <span>{stakedAccountValue}</span>
          <BalanceDisplay
            api={api}
            address={stakedAccountValue as SS58Address}
          />
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
