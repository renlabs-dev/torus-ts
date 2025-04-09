"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useUsdPrice } from "~/context/usd-price-provider";
import { useWallet } from "~/context/wallet-provider";
import { env } from "~/env";
import type { ReviewTransactionDialogHandle } from "~/app/_components/review-transaction-dialog";
import { ReviewTransactionDialog } from "~/app/_components/review-transaction-dialog";
import type { FeeLabelHandle } from "~/app/_components/fee-label";
import { createSendFormSchema } from "./send-form-schema";
import { handleEstimateFee } from "./send-fee-handler";
import { SendForm } from "./send-form";
import type { SendFormValues } from "./send-form-schema";

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

  const onSubmit = async (values: SendFormValues) => {
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
    void handleEstimateFeeCallback();
  }, [handleEstimateFeeCallback, selectedAccount?.address]);

  useEffect(() => {
    reset();
    feeRef.current?.updateFee(null);
  }, [selectedAccount?.address, reset]);

  const handleReviewClick = async () => {
    const isValid = await trigger();

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
        onSubmit={onSubmit}
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
