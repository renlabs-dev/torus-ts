"use client";

import type { InjectedAccountWithMeta } from "@torus-ts/torus-provider";
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
import { toNano } from "@torus-ts/utils/subspace";
import type { RefObject } from "react";
import type { UseFormReturn } from "react-hook-form";
import { AllocatorSelector } from "../../../_components/allocator-selector";
import { AmountButtons } from "../../../_components/amount-buttons";
import { FeeLabel } from "../../../_components/fee-label";
import type { FeeLabelHandle } from "../../../_components/fee-label";
import type { UnstakeFormValues } from "./unstake-form-schema";

interface UnstakeFormProps {
  form: UseFormReturn<UnstakeFormValues>;
  selectedAccount: InjectedAccountWithMeta | null;
  maxAmountRef: RefObject<string>;
  feeRef: RefObject<FeeLabelHandle | null>;
  transactionStatus: TransactionResult;
  handleSelectValidator: (validator: { address: string }) => Promise<void>;
  onReviewClick: () => Promise<void>;
  handleAmountChange: (amount: string) => Promise<void>;
  onSubmit: (values: UnstakeFormValues) => Promise<void>;
  formRef: React.RefObject<HTMLFormElement | null>;
}

export function UnstakeForm({
  form,
  selectedAccount,
  maxAmountRef,
  feeRef,
  transactionStatus,
  handleSelectValidator,
  onReviewClick,
  handleAmountChange,
  onSubmit,
  formRef,
}: UnstakeFormProps) {
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
            name="validator"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Validator Address</FormLabel>
                <FormControl>
                  <AllocatorSelector
                    value={field.value}
                    onSelect={handleSelectValidator}
                    listType="staked"
                    placeholder="Select a staked allocator"
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
                  <FormControl className="flex items-center gap-2">
                    <Input
                      {...field}
                      type="number"
                      placeholder="Amount to unstake"
                      min="0"
                      step="0.000000000000000001"
                      disabled={!selectedAccount?.address}
                    />
                  </FormControl>
                  <AmountButtons
                    setAmount={async (value) => await handleAmountChange(value)}
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
