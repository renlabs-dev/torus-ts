"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { isSS58 } from "@torus-ts/subspace";
import {
  Card,
  Input,
  TransactionStatus,
  Form,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
  FormItem,
  Button,
} from "@torus-ts/ui";
import { fromNano, toNano } from "@torus-ts/utils/subspace";
import { useWallet } from "~/context/wallet-provider";
import { AmountButtons } from "../amount-buttons";
import type { FeeLabelHandle } from "../send-fee-label";
import { FeeLabel } from "../send-fee-label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ALLOCATOR_ADDRESS } from "~/consts";
import type { ReviewTransactionDialogHandle } from "../review-transaction-dialog";
import { ReviewTransactionDialog } from "../review-transaction-dialog";

export function SendAction() {
  const {
    estimateFee,
    accountFreeBalance,
    transfer,
    selectedAccount,
    transferTransaction,
  } = useWallet();

  const estimatedFeeRef = useRef<FeeLabelHandle>(null);
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
          (amount) => {
            const feeNano = toNano(
              estimatedFeeRef.current?.getEstimatedFee() ?? "0",
            );
            const balance = accountFreeBalance.data ?? 0n;
            const maxTransferable = balance > feeNano ? balance - feeNano : 0n;
            return toNano(amount) <= maxTransferable;
          },
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

  const { reset, setError, setValue } = form;

  const handleEstimateFee = useCallback(async () => {
    estimatedFeeRef.current?.setLoading(true);
    try {
      const transaction = transferTransaction({
        to: ALLOCATOR_ADDRESS,
        amount: "0",
      });
      if (!transaction) {
        setError("recipient", { message: "Invalid transaction" });
        return;
      }
      const fee = await estimateFee(transaction);
      if (fee != null) {
        const adjustedFee = (fee * 1005n) / 1000n;
        const feeStr = fromNano(adjustedFee);
        estimatedFeeRef.current?.updateFee(feeStr);
        const afterFeesBalance = (accountFreeBalance.data ?? 0n) - adjustedFee;
        const maxTransferable = afterFeesBalance > 0n ? afterFeesBalance : 0n;
        maxAmountRef.current = fromNano(maxTransferable);
      } else {
        estimatedFeeRef.current?.updateFee(null);
        maxAmountRef.current = "";
      }
    } catch (error) {
      console.error("Error estimating fee:", error);
      estimatedFeeRef.current?.updateFee(null);
    } finally {
      estimatedFeeRef.current?.setLoading(false);
    }
  }, [accountFreeBalance.data, estimateFee, setError, transferTransaction]);

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
    await form.trigger("amount");
  };

  useEffect(() => {
    if (!selectedAccount?.address) return;
    void handleEstimateFee();
  }, [handleEstimateFee, selectedAccount?.address]);

  useEffect(() => {
    reset();
    estimatedFeeRef.current?.updateFee(null);
  }, [selectedAccount?.address, reset]);

  const reviewData = () => {
    const [recipient, amount] = form.getValues(["recipient", "amount"]);
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
        content: `${estimatedFeeRef.current?.getEstimatedFee()} TORUS`,
      },
    ];
  };

  const handleReviewClick = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      reviewDialogRef.current?.openDialog();
    }
  };

  return (
    <div className="l flex w-full flex-col gap-4 md:flex-row">
      <Card className="w-full animate-fade p-6">
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
                <FormItem className="flex flex-col gap-2">
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
                <FormItem className="flex flex-col gap-2">
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Amount of TORUS"
                      disabled={
                        !estimatedFeeRef.current?.getEstimatedFee() ||
                        !selectedAccount?.address
                      }
                      type="number"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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

            <FeeLabel
              ref={estimatedFeeRef}
              accountConnected={!!selectedAccount}
            />

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
        reviewContent={reviewData()}
      />
    </div>
  );
}
