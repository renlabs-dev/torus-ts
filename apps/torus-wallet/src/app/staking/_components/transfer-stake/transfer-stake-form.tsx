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
import { AmountButtons } from "../../../components/amount-buttons";
import type { FeeLabelHandle } from "../../../components/fee-label";
import { FeeLabel } from "../../../components/fee-label";
import type { TransferStakeFormValues } from "./transfer-stake-form-schema";

interface TransferStakeFormProps {
  form: UseFormReturn<TransferStakeFormValues>;
  selectedAccount: InjectedAccountWithMeta | null;
  maxAmountRef: RefObject<string>;
  feeRef: RefObject<FeeLabelHandle | null>;
  transactionStatus: TransactionResult;
  onSetCurrentView: (
    view: "wallet" | "validators" | "stakedValidators",
  ) => void;
  onReviewClick: () => Promise<void>;
  handleAmountChange: (amount: string) => Promise<void>;
  onSubmit: (values: TransferStakeFormValues) => Promise<void>;
  formRef: RefObject<HTMLFormElement | null>;
}

export function TransferStakeForm({
  form,
  selectedAccount,
  maxAmountRef,
  feeRef,
  transactionStatus,
  onSetCurrentView,
  onReviewClick,
  handleAmountChange,
  onSubmit,
  formRef,
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
                <div className="flex flex-row gap-2">
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Full Allocator address"
                      disabled={!selectedAccount?.address}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!selectedAccount?.address}
                    onClick={() => onSetCurrentView("stakedValidators")}
                    className="flex w-fit items-center px-6 py-2.5"
                  >
                    Staked Allocators
                  </Button>
                </div>
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
                <div className="flex flex-row gap-2">
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Full Allocator address"
                      disabled={!selectedAccount?.address}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!selectedAccount?.address}
                    onClick={() => onSetCurrentView("validators")}
                    className="flex w-fit items-center px-6 py-2.5"
                  >
                    Select Allocator
                  </Button>
                </div>
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
