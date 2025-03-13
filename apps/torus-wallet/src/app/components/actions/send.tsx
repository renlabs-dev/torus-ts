"use client";

import { AmountButtons } from "../amount-buttons";
import type { FeeLabelHandle } from "../fee-label";
import { FeeLabel } from "../fee-label";
import type { ReviewTransactionDialogHandle } from "../review-transaction-dialog";
import { ReviewTransactionDialog } from "../review-transaction-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { isSS58 } from "@torus-ts/subspace";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { Button } from "@torus-ts/ui/components/button";
import { Card } from "@torus-ts/ui/components/card";
import {
  Form,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
  FormItem,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";
import { TransactionStatus } from "@torus-ts/ui/components/transaction-status";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { fromNano, toNano } from "@torus-ts/utils/subspace";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ALLOCATOR_ADDRESS } from "~/consts";
import { useWallet } from "~/context/wallet-provider";
import { computeFeeData } from "~/utils/helpers";
import { isWithinTransferLimit } from "~/utils/validators";

const FEE_BUFFER_PERCENT = 102n;

export function SendAction() {
  const {
    estimateFee,
    accountFreeBalance,
    transfer,
    selectedAccount,
    transferTransaction,
  } = useWallet();
  const { toast } = useToast();

  const feeRef = useRef<FeeLabelHandle>(null);
  const maxAmountRef = useRef<string>("");
  const formRef = useRef<HTMLFormElement>(null);

  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      status: null,
      message: null,
      finalized: false,
    },
  );

  const reviewDialogRef = useRef<ReviewTransactionDialogHandle>(null);

  const sendActionFormSchema = useMemo(() => {
    return z.object({
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
              accountFreeBalance.data ?? 0n,
            ),
          { message: "Amount exceeds maximum transferable amount" },
        ),
    });
  }, [accountFreeBalance.data]);

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
        to: ALLOCATOR_ADDRESS,
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
      feeRef.current?.setLoading(false);
    } finally {
      feeRef.current?.setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountFreeBalance.data, estimateFee, transferTransaction]);

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

  const handleAmountChange = async (amount: string) => {
    setValue("amount", amount);
    await trigger("amount");
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
      {
        label: "To",
        content: recipient,
      },
      {
        label: "Amount",
        content: `${amount} TORUS`,
      },
      {
        label: "Fee",
        content: `${feeRef.current?.getEstimatedFee()} TORUS`,
      },
    ];
  };

  const handleReviewClick = async () => {
    const isValid = await trigger();
    if (isValid) {
      reviewDialogRef.current?.openDialog();
    }
  };

  return (
    <div className="l flex w-full flex-col gap-4 md:flex-row">
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
                  <FormLabel>To</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Full recipient address"
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
                        placeholder="Amount of TORUS"
                        disabled={!selectedAccount?.address}
                        type="number"
                      />
                    </FormControl>
                    <AmountButtons
                      setAmount={async (value) => {
                        await handleAmountChange(value);
                      }}
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
              onClick={handleReviewClick}
              disabled={!selectedAccount?.address}
            >
              Review Transaction
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
