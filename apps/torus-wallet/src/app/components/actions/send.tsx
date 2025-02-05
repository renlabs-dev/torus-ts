"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
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
} from "@torus-ts/ui";
import { fromNano, smallAddress, toNano } from "@torus-ts/utils/subspace";

import { useWallet } from "~/context/wallet-provider";
import { AmountButtons } from "../amount-buttons";
import { FeeLabel } from "../fee-label";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { WalletTransactionReview } from "../wallet-review";

const sendActionFormSchema = z.object({
  recipient: z
    .string()
    .nonempty({ message: "Recipient address is required" })
    .refine(isSS58, { message: "Invalid recipient address" }),
  amount: z
    .string()
    .nonempty({ message: "Amount is required" })
    .refine((amount) => toNano(amount) > 0n, {
      message: "Amount must be greater than 0",
    }),
});

export function SendAction() {
  const {
    estimateFee,
    accountFreeBalance,
    transfer,
    selectedAccount,
    transferTransaction,
  } = useWallet();

  const [estimatedFee, setEstimatedFee] = useState<string | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [maxAmount, setMaxAmount] = useState<string>("");

  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      status: null,
      message: null,
      finalized: false,
    },
  );

  const form = useForm<z.infer<typeof sendActionFormSchema>>({
    resolver: zodResolver(sendActionFormSchema),
    defaultValues: {
      recipient: "",
      amount: "",
    },
  });
  const { watch, reset, clearErrors, setError, setValue, getValues, setFocus } =
    form;

  const recipientValue = getValues("recipient");
  const amountValue = getValues("amount");
  const amountRef = useRef(amountValue);

  const handleEstimateFee = useCallback(
    async (recipient: string) => {
      if (!isSS58(recipient)) {
        setError("recipient", { message: "Invalid recipient address" });
        return;
      }
      clearErrors("recipient");
      setIsEstimating(true);
      try {
        const transaction = transferTransaction({ to: recipient, amount: "0" });
        if (!transaction) {
          setError("recipient", { message: "Invalid transaction" });
          return;
        }
        const fee = await estimateFee(transaction);
        if (fee != null) {
          const adjustedFee = (fee * 1005n) / 1000n;
          const feeStr = fromNano(adjustedFee);
          setEstimatedFee(feeStr);
          const afterFeesBalance =
            (accountFreeBalance.data ?? 0n) - adjustedFee;
          const maxTransferable = afterFeesBalance > 0n ? afterFeesBalance : 0n;
          setMaxAmount(fromNano(maxTransferable));
        } else {
          setEstimatedFee(null);
          setMaxAmount("");
        }
      } catch (error) {
        console.error("Error estimating fee:", error);
        setEstimatedFee(null);
        setMaxAmount("");
      } finally {
        setIsEstimating(false);
      }
    },
    [
      accountFreeBalance.data,
      clearErrors,
      estimateFee,
      setError,
      transferTransaction,
    ],
  );

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
    const feeNano = toNano(estimatedFee ?? "0");
    const balance = accountFreeBalance.data ?? 0n;
    const maxTransferable = balance - feeNano;

    if (toNano(values.amount) > maxTransferable) {
      setError("amount", {
        message: "Amount exceeds maximum transferable amount",
      });
      return;
    }

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

  const formRef = useRef<HTMLFormElement>(null);

  const handleAmountChange = (amount: string) => {
    const newAmount = amount.replace(/[^0-9.]/g, "");
    setValue("amount", newAmount);
    return newAmount;
  };

  const validateAmount = (amount: string) => {
    const amountNano = toNano(amount || "0");

    const feeNano = toNano(estimatedFee ?? "0");
    const balanceAfterFees = (accountFreeBalance.data ?? 0n) - feeNano;

    const maxAmountNano = balanceAfterFees > 0n ? balanceAfterFees : 0n;

    if (amountNano > maxAmountNano) {
      setError("amount", {
        message: "Amount exceeds maximum transferable amount",
      });
      return;
    } else {
      clearErrors("amount");
      return;
    }
  };

  useEffect(() => {
    const { unsubscribe } = watch((formData, { name, type }) => {
      if (
        name === "recipient" &&
        type === "change" &&
        (formData.recipient?.length ?? 0) >= 47 &&
        (formData.recipient?.length ?? 0) <= 48
      ) {
        void handleEstimateFee(String(formData.recipient));
      }
    });

    return () => unsubscribe();
  }, [watch, handleEstimateFee]);

  useEffect(() => {
    reset();
    setEstimatedFee(null);
    setMaxAmount("");
  }, [selectedAccount?.address, reset]);

  const reviewData = [
    {
      label: "To",
      content: recipientValue
        ? smallAddress(recipientValue, 6)
        : "Recipient Address",
    },
    {
      label: "Amount",
      content: amountValue ? `${amountValue} TORUS` : "0 TORUS",
    },
    {
      label: "Fee",
      content:
        recipientValue && selectedAccount?.address
          ? `${estimatedFee} TORUS`
          : "-",
    },
  ];

  return (
    <div className="l flex w-full flex-col gap-4 md:flex-row">
      <Card className="w-full animate-fade p-6 md:w-3/5">
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
                      disabled={!selectedAccount?.address || isEstimating}
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
                      onBlur={() => {
                        if (amountRef.current !== field.value) {
                          const newAmount = handleAmountChange(field.value);
                          amountRef.current = newAmount;
                          validateAmount(newAmount);
                        }
                        return null;
                      }}
                      placeholder="Amount of TORUS"
                      disabled={
                        isEstimating || !estimatedFee || !String(recipientValue)
                      }
                      type="number"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <AmountButtons
              setAmount={(value) => {
                handleAmountChange(value);
                setFocus("amount");
              }}
              availableFunds={maxAmount}
              disabled={isEstimating || !estimatedFee}
            />

            <FeeLabel
              estimatedFee={estimatedFee}
              isEstimating={isEstimating}
              accountConnected={!!selectedAccount}
            />

            {transactionStatus.status && (
              <TransactionStatus
                status={transactionStatus.status}
                message={transactionStatus.message}
              />
            )}
          </form>
        </Form>
      </Card>

      <WalletTransactionReview formRef={formRef} reviewContent={reviewData} />
    </div>
  );
}
