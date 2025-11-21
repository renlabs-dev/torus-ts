import type { Api } from "@torus-network/sdk/chain";
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

interface TransferFieldsProps {
  control: Control<ExecuteWalletFormData>;
  isAccountConnected: boolean;
  api: Api | null;
  delegatorAddress: string;
}

export function TransferFields({
  control,
  isAccountConnected,
  delegatorAddress,
}: TransferFieldsProps) {
  const { api } = useTorus();

  return (
    <>
      <FormField
        control={control}
        name="transferData.from"
        render={({ field }) => {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const accountStakedBy = useKeyStakingTo(api, delegatorAddress);

          // Find the stake amount for the selected from account
          const stakeToSelected = accountStakedBy.data?.find(
            (stake) => stake.address === field.value,
          );

          return (
            <div className="space-y-2">
              <FormAddressField
                field={field}
                label="From Account"
                disabled={!isAccountConnected}
              />
              <div className="flex justify-between">
                <FormDescription>
                  The account to transfer stake from.
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
