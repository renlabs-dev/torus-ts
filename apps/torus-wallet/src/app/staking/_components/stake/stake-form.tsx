import { Button } from "@torus-ts/ui/components/button";
import { Card } from "@torus-ts/ui/components/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";

import { useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import { AllocatorSelector } from "../../../_components/allocator-selector";
import { CurrencySwap } from "../../../_components/currency-swap";
import { FeeLabel } from "../../../_components/fee-label";
import type { StakeFormValues } from "./stake-form-schema";
import type { BrandTag } from "@torus-network/torus-utils";

interface StakeFormProps {
  form: UseFormReturn<StakeFormValues>;
  selectedAccount: { address: string } | null;
  minAllowedStakeData: bigint;
  maxAmountRef: React.RefObject<string>;
  estimatedFee: bigint | undefined;
  isPending: boolean;
  handleSelectValidator: (
    address: BrandTag<"SS58Address"> & string,
  ) => Promise<void>;
  onReviewClick: () => Promise<void>;
  handleAmountChange: (newAmount: string) => Promise<void>;
  usdPrice: number;
}

export function StakeForm({
  form,
  selectedAccount,
  minAllowedStakeData,
  maxAmountRef,
  estimatedFee,
  isPending,
  handleSelectValidator,
  onReviewClick,
  handleAmountChange,
  usdPrice,
}: StakeFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Card className="animate-fade w-full p-6">
      <Form {...form}>
        <form
          ref={formRef}
          className="flex w-full flex-col gap-6"
          aria-label="Stake form"
        >
          <FormField
            control={form.control}
            name="recipient"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Allocator Address</FormLabel>
                <FormControl>
                  <AllocatorSelector
                    value={field.value}
                    onSelect={handleSelectValidator}
                    listType="all"
                    placeholder="Select an allocator"
                    disabled={!selectedAccount?.address}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <CurrencySwap
                    amount={field.value}
                    usdPrice={usdPrice}
                    disabled={!selectedAccount?.address}
                    availableFunds={maxAmountRef.current}
                    onAmountChangeAction={handleAmountChange}
                    minAllowedStakeData={minAllowedStakeData}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FeeLabel accountConnected={!!selectedAccount} fee={estimatedFee} />

          <Button
            type="button"
            variant="outline"
            onClick={onReviewClick}
            disabled={!selectedAccount?.address || isPending}
          >
            {isPending ? "Processing..." : "Review & Submit Transaction"}
          </Button>
        </form>
      </Form>
    </Card>
  );
}
