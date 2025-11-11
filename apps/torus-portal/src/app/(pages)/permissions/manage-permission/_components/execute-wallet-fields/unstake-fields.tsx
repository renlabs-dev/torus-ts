import { formatToken } from "@torus-network/torus-utils/torus";
import { useKeyStakingTo } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
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
import type { Control } from "react-hook-form";
import type { ExecuteWalletFormData } from "./execute-wallet-schema";
import { TokenAmountInput } from "./token-amount-input";

interface UnstakeFieldsProps {
  control: Control<ExecuteWalletFormData>;
  isAccountConnected: boolean;
  delegatorAddress: string;
}

export function UnstakeFields({
  control,
  isAccountConnected,
  delegatorAddress,
}: UnstakeFieldsProps) {
  const { api } = useTorus();

  return (
    <>
      <FormField
        control={control}
        name="unstakeData.staked"
        render={({ field }) => {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const accountStakedBy = useKeyStakingTo(api, delegatorAddress);

          // Find the stake amount for the selected staked account
          const stakeToSelected = accountStakedBy.data?.find(
            (stake) => stake.address === field.value,
          );

          return (
            <div className="space-y-2">
              <FormAddressField
                field={field}
                label="Staked Account"
                disabled={!isAccountConnected}
              />

              <div className="flex justify-between">
                <FormDescription>
                  The account from which to unstake tokens.
                </FormDescription>
                {field.value && (
                  <div className="text-muted-foreground text-xs">
                    {accountStakedBy.isLoading ? (
                      <Skeleton className="h-4 w-24" />
                    ) : stakeToSelected ? (
                      `Delegator stake: ${formatToken(stakeToSelected.stake)}`
                    ) : (
                      "No delegation found"
                    )}
                  </div>
                )}
              </div>
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
