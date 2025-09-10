import type { SS58Address } from "@torus-network/sdk/types";
import { formatToken } from "@torus-network/torus-utils/torus";
import { useCachedStakeOut } from "@torus-ts/query-provider/hooks";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Skeleton } from "@torus-ts/ui/components/skeleton";
import { FormAddressField } from "~/app/_components/address-field";
import { env } from "~/env";
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
  const stakeOut = useCachedStakeOut(env("NEXT_PUBLIC_TORUS_CACHE_URL"));

  return (
    <>
      <FormField
        control={control}
        name="unstakeData.staked"
        render={({ field }) => {
          const stakedBalance = field.value
            ? stakeOut.data?.perAddr[field.value as SS58Address]
            : undefined;

          return (
            <div className="space-y-2">
              <FormAddressField
                field={field}
                label="Staked Account"
                disabled={!isAccountConnected}
              />
              <div className="flex justify-end">
                {field.value && (
                  <div className="text-muted-foreground text-xs">
                    {stakeOut.isLoading ? (
                      <Skeleton className="h-4 w-24" />
                    ) : stakedBalance ? (
                      `Staked: ${formatToken(stakedBalance)}`
                    ) : (
                      "No stake found"
                    )}
                  </div>
                )}
              </div>
              <FormDescription>
                The account from which to unstake tokens.
              </FormDescription>
            </div>
          );
        }}
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
