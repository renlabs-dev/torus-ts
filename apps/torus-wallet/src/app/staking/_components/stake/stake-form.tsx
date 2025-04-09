import type { TransactionResult } from "@torus-ts/torus-provider/types";
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
import { TransactionStatus } from "@torus-ts/ui/components/transaction-status";
import { useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import { AllocatorSelector } from "../../../_components/allocator-selector";
import { CurrencySwap } from "../../../_components/currency-swap";
import type { FeeLabelHandle } from "../../../_components/fee-label";
import { FeeLabel } from "../../../_components/fee-label";
import type { StakeFormValues } from "./stake-form-schema";

interface StakeFormProps {
  form: UseFormReturn<StakeFormValues>;
  selectedAccount: { address: string } | null;
  minAllowedStakeData: bigint;
  maxAmountRef: React.RefObject<string>;
  feeRef: React.RefObject<FeeLabelHandle | null>;
  transactionStatus: TransactionResult;
  handleSelectValidator: (validator: { address: string }) => Promise<void>;
  onReviewClick: () => Promise<void>;
  handleAmountChange: (newAmount: string) => Promise<void>;
  usdPrice: number;
}

export function StakeForm({
  form,
  selectedAccount,
  minAllowedStakeData,
  maxAmountRef,
  feeRef,
  transactionStatus,
  handleSelectValidator,
  onReviewClick,
  handleAmountChange,
  usdPrice,
}: StakeFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Card className="animate-fade w-full p-6">
      <Form {...form}>
        <form ref={formRef} className="flex w-full flex-col gap-6">
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

          <FeeLabel ref={feeRef} accountConnected={!!selectedAccount} />

          {transactionStatus.status && (
            <TransactionStatus
              status={transactionStatus.status}
              message={transactionStatus.message}
            />
          )}
          <Button
            type="button"
            onClick={onReviewClick}
            disabled={!selectedAccount?.address}
          >
            Review Transaction
          </Button>
        </form>
      </Form>
    </Card>
  );
}
