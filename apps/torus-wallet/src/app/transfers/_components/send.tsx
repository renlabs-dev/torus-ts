"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { isSS58 } from "@torus-network/sdk";
import { useGetTorusPrice } from "@torus-ts/query-provider/hooks";
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
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { fromNano, toNano } from "@torus-ts/utils/subspace";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useWallet } from "~/context/wallet-provider";
import { env } from "~/env";
import { computeFeeData } from "~/utils/helpers";
import { isWithinTransferLimit } from "~/utils/validators";
import type { FeeLabelHandle } from "../../components/fee-label";
import { FeeLabel } from "../../components/fee-label";
import type { ReviewTransactionDialogHandle } from "../../components/review-transaction-dialog";
import { ReviewTransactionDialog } from "../../components/review-transaction-dialog";
import { CurrencySwap } from "~/app/components/currency-swap";
import { Input } from "@torus-ts/ui/components/input";

const FEE_BUFFER_PERCENT = 102n;

const createSendFormSchema = (
  accountFreeBalance: bigint | null,
  feeRef: React.RefObject<FeeLabelHandle | null>,
) =>
  z.object({
    recipient: z
      .string()
      .nonempty({ message: "Recipient address is required" })
      .refine(isSS58, { message: "Invalid recipient address" }),
    amount: z
      .string()
      .nonempty({ message: "Amount is required" })
      .refine((amount) => toNano(amount) > 0n, {
        message: "Amount must be greater than 0",
      })
      .refine(
        (amount) =>
          isWithinTransferLimit(
            amount,
            feeRef.current?.getEstimatedFee() ?? "0",
            accountFreeBalance ?? 0n,
          ),
        { message: "Amount exceeds maximum transferable amount" },
      ),
  });

export function Send() {
  const {
    estimateFee,
    accountFreeBalance,
    transfer,
    selectedAccount,
    transferTransaction,
  } = useWallet();
  const { toast } = useToast();
  const { data: usdPrice = 0 } = useGetTorusPrice();

  const feeRef = useRef<FeeLabelHandle>(null);
  const maxAmountRef = useRef<string>("");
  const formRef = useRef<HTMLFormElement>(null);
  const reviewDialogRef = useRef<ReviewTransactionDialogHandle>(null);

  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      status: null,
      message: null,
      finalized: false,
    },
  );

  const sendActionFormSchema = createSendFormSchema(
    accountFreeBalance.data ?? null,
    feeRef,
  );

  const form = useForm<z.infer<typeof sendActionFormSchema>>({
    resolver: zodResolver(sendActionFormSchema),
    defaultValues: {
      recipient: "",
      amount: "",
    },
    mode: "onTouched",
  });

  const { reset, setValue, getValues, trigger } = form;

  const handleEstimateFee = useCallback(async () => {
    feeRef.current?.setLoading(true);
    try {
      const transaction = transferTransaction({
        to: env("NEXT_PUBLIC_TORUS_ALLOCATOR_ADDRESS"),
        amount: "0",
      });

      if (!transaction) {
        toast({
          title: "Uh oh! Something went wrong.",
          description: "Error creating transaction for estimating fee.",
        });
        return;
      }

      const fee = await estimateFee(transaction);
      if (fee != null) {
        const { feeStr, maxTransferable } = computeFeeData(
          fee,
          FEE_BUFFER_PERCENT,
          accountFreeBalance.data ?? 0n,
        );
        feeRef.current?.updateFee(feeStr);
        maxAmountRef.current = fromNano(maxTransferable);
      } else {
        feeRef.current?.updateFee(null);
        maxAmountRef.current = "";
      }
    } catch (error) {
      console.error("Error estimating fee:", error);
      feeRef.current?.updateFee(null);
    } finally {
      feeRef.current?.setLoading(false);
    }
  }, [accountFreeBalance.data, estimateFee, transferTransaction, toast]);

  const handleAmountChange = async (torusAmount: string) => {
    setValue("amount", torusAmount);
    await trigger("amount");
  };

  const handleCallback = (callbackReturn: TransactionResult) => {
    setTransactionStatus(callbackReturn);
    if (callbackReturn.status === "SUCCESS") {
      reset();
    }
  };

  const refetchHandler = async () => {
    await accountFreeBalance.refetch();
  };

  const onSubmit = async (values: z.infer<typeof sendActionFormSchema>) => {
    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting transaction...",
    });
    await transfer({
      to: values.recipient,
      amount: values.amount,
      callback: handleCallback,
      refetchHandler,
    });
  };

  useEffect(() => {
    if (!selectedAccount?.address) return;
    void handleEstimateFee();
  }, [handleEstimateFee, selectedAccount?.address]);

  useEffect(() => {
    reset();
    feeRef.current?.updateFee(null);
  }, [selectedAccount?.address, reset]);

  const reviewData = () => {
    const { recipient, amount } = getValues();
    return [
      { label: "To", content: recipient },
      { label: "Amount", content: `${amount} TORUS` },
      { label: "Fee", content: `${feeRef.current?.getEstimatedFee()} TORUS` },
    ];
  };

  const handleReviewClick = async () => {
    const isValid = await trigger();
    if (isValid) {
      reviewDialogRef.current?.openDialog();
    }
  };

  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      <Card className="animate-fade w-full p-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            ref={formRef}
            className="flex w-full flex-col gap-6"
          >
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

            <FormItem className="flex flex-col">
              <FormLabel>Amount to send</FormLabel>
              <FormControl>
                <CurrencySwap
                  usdPrice={usdPrice}
                  disabled={!selectedAccount?.address}
                  availableFunds={maxAmountRef.current}
                  onAmountChange={handleAmountChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FeeLabel ref={feeRef} accountConnected={!!selectedAccount} />

            {transactionStatus.status && (
              <TransactionStatus
                status={transactionStatus.status}
                message={transactionStatus.message}
              />
            )}

            <Button
              type="button"
              variant="outline"
              onClick={handleReviewClick}
              disabled={!selectedAccount?.address}
            >
              Review & Submit Send Transaction
            </Button>
          </form>
        </Form>
      </Card>

      <ReviewTransactionDialog
        ref={reviewDialogRef}
        formRef={formRef}
        reviewContent={reviewData}
      />
    </div>
  );
}
