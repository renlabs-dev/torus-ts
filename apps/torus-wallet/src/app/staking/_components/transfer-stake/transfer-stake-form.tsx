"use client";

import type { UseFormReturn } from "react-hook-form";

import type { BrandTag } from "@torus-network/torus-utils";

import type { InjectedAccountWithMeta } from "@torus-ts/torus-provider";
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

import { AllocatorSelector } from "../../../_components/allocator-selector";
import { CurrencySwap } from "../../../_components/currency-swap";
import { FeeLabel } from "../../../_components/fee-label";
import type { TransferStakeFormValues } from "./transfer-stake-form-schema";

interface TransferStakeFormProps {
  form: UseFormReturn<TransferStakeFormValues>;
  selectedAccount: InjectedAccountWithMeta | null;
  maxTransferStakeAmount: string;
  estimatedFee: bigint | undefined;
  isPending: boolean;
  isSigning: boolean;
  handleSelectFromValidatorAction: (
    address: BrandTag<"SS58Address"> & string,
  ) => Promise<void>;
  handleSelectToValidatorAction: (
    address: BrandTag<"SS58Address"> & string,
  ) => Promise<void>;
  onReviewClickAction: () => Promise<void>;
  handleAmountChangeAction: (amount: string) => Promise<void>;
  formRef: React.RefObject<HTMLFormElement | null>;
  fromValidatorValue: string;
  usdPrice: number;
  minAllowedStakeData: bigint;
}

export function TransferStakeForm({
  form,
  selectedAccount,
  maxTransferStakeAmount,
  estimatedFee,
  isPending,
  isSigning,
  handleSelectFromValidatorAction,
  handleSelectToValidatorAction,
  onReviewClickAction,
  handleAmountChangeAction,
  formRef,
  fromValidatorValue,
  usdPrice,
  minAllowedStakeData,
}: TransferStakeFormProps) {
  return (
    <Card className="animate-fade w-full p-6">
      <Form {...form}>
        <form
          ref={formRef}
          className="flex w-full flex-col gap-6"
          aria-label="Transfer stake form"
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
                    onSelect={handleSelectFromValidatorAction}
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
                    onSelect={handleSelectToValidatorAction}
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
                <FormControl>
                  <CurrencySwap
                    amount={field.value}
                    usdPrice={usdPrice}
                    disabled={!selectedAccount?.address}
                    availableFunds={maxTransferStakeAmount || "0"}
                    onAmountChangeAction={handleAmountChangeAction}
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
            onClick={onReviewClickAction}
            disabled={!selectedAccount?.address || isPending || isSigning}
          >
            {isPending ? "Processing..." : "Review & Submit Transaction"}
          </Button>
        </form>
      </Form>
    </Card>
  );
}
