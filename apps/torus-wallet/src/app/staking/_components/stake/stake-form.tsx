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
import { Input } from "@torus-ts/ui/components/input";
import { TransactionStatus } from "@torus-ts/ui/components/transaction-status";
import { fromNano, toNano } from "@torus-ts/utils/subspace";
import { useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import { AllocatorSelector } from "../../../_components/allocator-selector";
import { AmountButtons } from "../../../_components/amount-buttons";
import type { FeeLabelHandle } from "../../../_components/fee-label";
import { FeeLabel } from "../../../_components/fee-label";
import type { StakeFormValues } from "./stake-form-schema";

interface StakeFormProps {
  form: UseFormReturn<StakeFormValues>;
  selectedAccount: { address: string } | null;
  maxAmountRef: React.RefObject<string>;
  feeRef: React.RefObject<FeeLabelHandle | null>;
  minAllowedStakeData: bigint;
  transactionStatus: TransactionResult;
  handleSelectValidator: (validator: { address: string }) => Promise<void>;
  onReviewClick: () => Promise<void>;
  handleAmountChange: (newAmount: string) => Promise<void>;
  onSubmit: (values: StakeFormValues) => Promise<void>;
}

export function StakeForm({
  form,
  selectedAccount,
  maxAmountRef,
  feeRef,
  minAllowedStakeData,
  transactionStatus,
  handleSelectValidator,
  onReviewClick,
  handleAmountChange,
  onSubmit,
}: StakeFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Card className="animate-fade w-full p-6">
      <Form {...form}>
        <form
          ref={formRef}
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex w-full flex-col gap-6"
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
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="Amount of TORUS"
                      min={fromNano(minAllowedStakeData)}
                      step="0.000000000000000001"
                      disabled={!selectedAccount?.address}
                    />
                  </FormControl>
                  <AmountButtons
                    setAmount={handleAmountChange}
                    availableFunds={maxAmountRef.current}
                    disabled={
                      !(toNano(maxAmountRef.current) > 0n) ||
                      !selectedAccount?.address
                    }
                  />
                </div>
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
