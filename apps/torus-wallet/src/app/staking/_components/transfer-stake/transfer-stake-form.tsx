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
import { TransactionStatus } from "@torus-ts/ui/components/transaction-status";
import type { RefObject } from "react";
import type { UseFormReturn } from "react-hook-form";
import { AllocatorSelector } from "../../../_components/allocator-selector";
import { CurrencySwap } from "../../../_components/currency-swap";
import type { FeeLabelHandle } from "../../../_components/fee-label";
import { FeeLabel } from "../../../_components/fee-label";
import type { TransferStakeFormValues } from "./transfer-stake-form-schema";

interface TransferStakeFormProps {
  form: UseFormReturn<TransferStakeFormValues>;
  selectedAccount: InjectedAccountWithMeta | null;
  maxAmountRef: RefObject<string>;
  feeRef: RefObject<FeeLabelHandle | null>;
  transactionStatus: TransactionResult;
  handleSelectFromValidator: (validator: { address: string }) => Promise<void>;
  handleSelectToValidator: (validator: { address: string }) => Promise<void>;
  onReviewClick: () => Promise<void>;
  handleAmountChange: (amount: string) => Promise<void>;
  formRef: RefObject<HTMLFormElement | null>;
  fromValidatorValue: string;
  usdPrice: number;
}

export function TransferStakeForm({
  form,
  selectedAccount,
  maxAmountRef,
  feeRef,
  transactionStatus,
  handleSelectFromValidator,
  handleSelectToValidator,
  onReviewClick,
  handleAmountChange,
  formRef,
  fromValidatorValue,
  usdPrice,
}: TransferStakeFormProps) {
  return (
    <Card className="animate-fade w-full p-6">
      <Form {...form}>
        <form ref={formRef} className="flex w-full flex-col gap-6">
          <FormField
            control={form.control}
            name="fromValidator"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>From Allocator</FormLabel>
                <FormControl>
                  <AllocatorSelector
                    value={field.value}
                    onSelect={handleSelectFromValidator}
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
            name="toValidator"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>To Allocator</FormLabel>
                <FormControl>
                  <AllocatorSelector
                    value={field.value}
                    onSelect={handleSelectToValidator}
                    listType="all"
                    placeholder="Select an allocator"
                    excludeAddress={fromValidatorValue}
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
            render={() => (
              <FormItem className="flex flex-col">
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <CurrencySwap
                    usdPrice={usdPrice}
                    disabled={!selectedAccount?.address}
                    availableFunds={maxAmountRef.current || "0"}
                    onAmountChangeAction={handleAmountChange}
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
