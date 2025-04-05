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
  onSubmit: (values: TransferStakeFormValues) => Promise<void>;
  formRef: RefObject<HTMLFormElement | null>;
  fromValidatorValue: string;
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
  onSubmit,
  formRef,
  fromValidatorValue,
}: TransferStakeFormProps) {
  return (
    <Card className="animate-fade w-full p-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          ref={formRef}
          className="flex w-full flex-col gap-6"
        >
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
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Amount</FormLabel>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="Amount of TORUS"
                      disabled={!selectedAccount?.address}
                    />
                  </FormControl>
                  <AmountButtons
                    setAmount={handleAmountChange}
                    availableFunds={maxAmountRef.current || "0"}
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
