import type { RefObject } from "react";
import { useRef } from "react";

import type { UseFormReturn } from "react-hook-form";

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

import { CurrencySwap } from "~/app/_components/currency-swap";
import { FeeLabel } from "~/app/_components/fee-label";

import type { SendFormValues } from "./send-form-schema";

interface SendFormProps {
  form: UseFormReturn<SendFormValues>;
  selectedAccount: { address: string } | null;
  usdPrice: number;
  maxAmountRef: RefObject<string>;
  estimatedFee: bigint | undefined;
  onReviewClick: () => Promise<void>;
  handleAmountChange: (newAmount: string) => Promise<void>;
  minAllowedStakeData: bigint;
  isPending: boolean;
}

export function SendForm({
  form,
  selectedAccount,
  usdPrice,
  maxAmountRef,
  estimatedFee,
  onReviewClick,
  handleAmountChange,
  minAllowedStakeData,
  isPending,
}: SendFormProps) {
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
                <FormLabel>Receiver address</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={`eg. 5CoS1L...2tCACxf4n`}
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
                <FormLabel>Amount to send</FormLabel>
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
            {isPending ? "Processing..." : "Review & Submit Send Transaction"}
          </Button>
        </form>
      </Form>
    </Card>
  );
}
