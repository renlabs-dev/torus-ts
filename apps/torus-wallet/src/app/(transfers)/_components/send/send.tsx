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
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { saveTransaction } from "~/utils/transaction/save-transaction";

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
    const [error, _success] = await tryAsync(trigger("amount"));
    if (error !== undefined) {
      toast.error(error.message);
      return;
    }
    return;
  };

  const handleCallback = (callbackReturn: TransactionResult) => {
    setTransactionStatus(callbackReturn);
    if (callbackReturn.status === "SUCCESS") {
      reset();
    }
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

    // Save initial transaction record
    let updateTransaction;
    if (selectedAccount?.address) {
      const [saveError, saveResult] = await tryAsync(saveTransaction({
        type: "SEND",
        userKey: selectedAccount.address as `SS58:${string}`,
        fromAddress: selectedAccount.address as `SS58:${string}`,
        toAddress: values.recipient as `SS58:${string}`,
        amount: values.amount,
        fee: feeRef.current?.getEstimatedFee() || undefined,
      }));
      
      if (saveError) {
        console.error("Failed to save transaction:", saveError);
      } else {
        updateTransaction = saveResult;
      }
    }

    // Create a callback handler that will also update the transaction record
    const transactionCallback = (result: TransactionResult) => {
      if (updateTransaction) {
        void updateTransaction(
          result, 
          result.hash,
          result.blockHeight ? Number(result.blockHeight) : undefined
        );
      }
      handleCallback(result);
    };

    const [error3, _success3] = await tryAsync(
      transfer({
        to: values.recipient,
        amount: values.amount,
        callback: transactionCallback,
        refetchHandler,
      }),
    );
    if (error3 !== undefined) {
      // Update transaction to error state if transfer failed
      if (updateTransaction) {
        void updateTransaction(
          { status: "ERROR", finalized: true, message: error3.message },
          undefined,
          undefined
        );
      }
      toast.error(error3.message);
      return;
    }
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
