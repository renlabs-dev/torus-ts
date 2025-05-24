"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useUsdPrice } from "~/context/usd-price-provider";
import { useWallet } from "~/context/wallet-provider";
import { env } from "~/env";
import type { UpdatedTransaction } from "~/store/transactions-store";
import { useTransactionsStore } from "~/store/transactions-store";
import type { ReviewTransactionDialogHandle } from "~/app/_components/review-transaction-dialog";
import { ReviewTransactionDialog } from "~/app/_components/review-transaction-dialog";
import type { FeeLabelHandle } from "~/app/_components/fee-label";
import { createSendFormSchema } from "./send-form-schema";
import { handleEstimateFee } from "./send-fee-handler";
import { SendForm } from "./send-form";
import type { SendFormValues } from "./send-form-schema";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import type { SS58Address } from "@torus-network/sdk";

export const MIN_ALLOWED_STAKE_SAFEGUARD = 500000000000000000n;

export function Send() {
  const {
    estimateFee,
    accountFreeBalance,
    transfer,
    selectedAccount,
    transferTransaction,
    minAllowedStake,
  } = useWallet();

  const {
    addTransaction,
    isTransactionError,
    isTransactionCompleted,
    updateTransaction,
  } = useTransactionsStore((state) => ({
    addTransaction: (args: Parameters<typeof state.addTransaction>[0]) =>
      state.addTransaction(args),
    isTransactionError: (
      args: Parameters<typeof state.isTransactionError>[0],
    ) => state.isTransactionError(args),
    isTransactionCompleted: (
      args: Parameters<typeof state.isTransactionCompleted>[0],
    ) => state.isTransactionCompleted(args),
    updateTransaction: (...args: Parameters<typeof state.updateTransaction>) =>
      state.updateTransaction(...args),
  }));

  const { toast } = useToast();
  const { usdPrice } = useUsdPrice();

  const minAllowedStakeData =
    minAllowedStake.data ?? MIN_ALLOWED_STAKE_SAFEGUARD;

  const feeRef = useRef<FeeLabelHandle>(null);
  const maxAmountRef = useRef<string>("");
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

  const form = useForm<SendFormValues>({
    resolver: zodResolver(sendActionFormSchema),
    defaultValues: {
      recipient: "",
      amount: "",
    },
    mode: "onTouched",
  });

  const { reset, setValue, getValues, trigger } = form;

  const handleEstimateFeeCallback = useCallback(async () => {
    await handleEstimateFee({
      feeRef,
      maxAmountRef,
      transferTransaction,
      estimateFee,
      allocatorAddress: env("NEXT_PUBLIC_TORUS_ALLOCATOR_ADDRESS"),
      accountFreeBalance: accountFreeBalance.data ?? 0n,
      toast,
    });
  }, [accountFreeBalance.data, estimateFee, transferTransaction, toast]);

  const handleAmountChange = async (torusAmount: string) => {
    setValue("amount", torusAmount);
    const [error, _success] = await tryAsync(trigger("amount"));
    if (error !== undefined) {
      toast.error(error.message);
      return;
    }
    return;
  };

  const handleTransactionCallback = (
    callbackReturn: TransactionResult,
    txId: string,
  ) => {
    setTransactionStatus(callbackReturn);

    if (!isTransactionCompleted(callbackReturn.status)) return;

    const isError = isTransactionError(callbackReturn.status);

    const updatedTransaction: UpdatedTransaction = isError
      ? {
          status: "error",
          metadata: { error: "Transaction failed" },
        }
      : {
          status: "success",
          hash: callbackReturn.hash ?? "unknown",
        };

    updateTransaction(txId, updatedTransaction);

    reset();
  };

  const refetchHandler = async () => {
    const [error2, _success2] = await tryAsync(accountFreeBalance.refetch());
    if (error2 !== undefined) {
      toast.error(error2.message);
      return;
    }
    return;
  };

  const onSubmit = async (values: SendFormValues) => {
    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Awaiting signature",
    });

    const txId = addTransaction({
      type: "send",
      fromAddress: selectedAccount?.address as SS58Address,
      toAddress: values.recipient,
      amount: values.amount,
      fee: feeRef.current?.getEstimatedFee() ?? "0",
      status: "pending",
      metadata: {
        usdPrice: usdPrice,
      },
    });

    await transfer({
      to: values.recipient,
      amount: values.amount,
      callback: (args) => handleTransactionCallback(args, txId),
      refetchHandler,
    });
  };

  useEffect(() => {
    if (!selectedAccount?.address) return;
    void handleEstimateFeeCallback();
  }, [handleEstimateFeeCallback, selectedAccount?.address]);

  useEffect(() => {
    reset();
    feeRef.current?.updateFee(null);
  }, [selectedAccount?.address, reset]);

  const handleReviewClick = async () => {
    const [error4, isValid] = await tryAsync(trigger());
    if (error4 !== undefined) {
      toast.error(error4.message);
      return;
    }
    if (isValid) {
      reviewDialogRef.current?.openDialog();
    }
  };

  const handleConfirmTransaction = () => {
    const values = getValues();
    void onSubmit(values);
  };

  const { recipient, amount } = getValues();

  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      <SendForm
        form={form}
        selectedAccount={selectedAccount}
        usdPrice={usdPrice}
        maxAmountRef={maxAmountRef}
        feeRef={feeRef}
        transactionStatus={transactionStatus}
        onReviewClick={handleReviewClick}
        handleAmountChange={handleAmountChange}
        minAllowedStakeData={minAllowedStakeData}
      />
      <ReviewTransactionDialog
        ref={reviewDialogRef}
        from={selectedAccount?.address}
        to={recipient}
        amount={amount}
        fee={feeRef.current?.getEstimatedFee() ?? "0"}
        onConfirm={handleConfirmTransaction}
      />
    </div>
  );
}
