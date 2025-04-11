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
import { FeeLabel } from "../../../_components/fee-label";
import type { FeeLabelHandle } from "../../../_components/fee-label";
import type { UnstakeFormValues } from "./unstake-form-schema";
import type { BrandTag } from "@torus-network/torus-utils";

interface UnstakeFormProps {
  form: UseFormReturn<UnstakeFormValues>;
  selectedAccount: InjectedAccountWithMeta | null;
  maxAmountRef: RefObject<string>;
  feeRef: RefObject<FeeLabelHandle | null>;
  transactionStatus: TransactionResult;
  handleSelectValidator: (address: BrandTag<"SS58Address"> & string) => void;
  onReviewClick: () => Promise<void>;
  handleAmountChange: (amount: string) => Promise<void>;
  formRef: React.RefObject<HTMLFormElement | null>;
  usdPrice: number;
  minAllowedStakeData: bigint;
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
  formRef,
  usdPrice,
  minAllowedStakeData,
}: UnstakeFormProps) {
  return (
    <Card className="animate-fade w-full p-6">
      <Form {...form}>
        <form ref={formRef} className="flex w-full flex-col gap-6">
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
                <FormControl>
                  <CurrencySwap
                    amount={field.value}
                    usdPrice={usdPrice}
                    disabled={!selectedAccount?.address}
                    availableFunds={maxAmountRef.current || "0"}
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
