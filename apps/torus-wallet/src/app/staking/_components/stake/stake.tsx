"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { checkSS58 } from "@torus-network/sdk";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useUsdPrice } from "~/context/usd-price-provider";
import { useWallet } from "~/context/wallet-provider";
import { env } from "~/env";
import type { FeeLabelHandle } from "../../../_components/fee-label";
import type { ReviewTransactionDialogHandle } from "../../../_components/review-transaction-dialog";
import { ReviewTransactionDialog } from "../../../_components/review-transaction-dialog";
import { handleEstimateFee } from "./stake-fee-handler";
import { StakeForm } from "./stake-form";
import type { StakeFormValues } from "./stake-form-schema";
import { createStakeActionFormSchema } from "./stake-form-schema";

export const MIN_ALLOWED_STAKE_SAFEGUARD = 500000000000000000n;
export const MIN_EXISTENCIAL_BALANCE = 100000000000000000n;
export const FEE_BUFFER_PERCENT = 225n;

export function Stake() {
  const {
    addStake,
    accountFreeBalance,
    stakeOut,
    accountStakedBy,
    selectedAccount,
    addStakeTransaction,
    estimateFee,
    getExistencialDeposit,
    minAllowedStake,
  } = useWallet();
  const { toast } = useToast();
  const { usdPrice } = useUsdPrice();

  const minAllowedStakeData =
    minAllowedStake.data ?? MIN_ALLOWED_STAKE_SAFEGUARD;

  const existencialDepositValue =
    getExistencialDeposit() ?? MIN_EXISTENCIAL_BALANCE;

  const freeBalance = accountFreeBalance.data ?? 0n;

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
  const [currentView, setCurrentView] = useState<"wallet" | "validators">(
    "wallet",
  );

  const stakeActionFormSchema = createStakeActionFormSchema(
    minAllowedStakeData,
    existencialDepositValue,
    freeBalance,
    feeRef as React.RefObject<FeeLabelHandle>,
  );

  const form = useForm<StakeFormValues>({
    resolver: zodResolver(stakeActionFormSchema),
    defaultValues: {
      recipient: "",
      amount: "",
    },
    mode: "onTouched",
  });

  const { reset, setValue, trigger, getValues } = form;

  const estimateFeeHandler = useCallback(async () => {
    await handleEstimateFee({
      feeRef,
      maxAmountRef,
      addStakeTransaction,
      estimateFee,
      allocatorAddress: env("NEXT_PUBLIC_TORUS_ALLOCATOR_ADDRESS"),
      freeBalance,
      existencialDepositValue,
      toast,
    });
  }, [
    addStakeTransaction,
    estimateFee,
    existencialDepositValue,
    freeBalance,
    toast,
  ]);

  useEffect(() => {
    if (!selectedAccount?.address || currentView === "validators") return;
    void estimateFeeHandler();
  }, [estimateFeeHandler, selectedAccount?.address, currentView]);

  useEffect(() => {
    reset();
    feeRef.current?.updateFee(null);
  }, [selectedAccount?.address, reset]);

  const refetchData = async () => {
    await Promise.all([
      stakeOut.refetch(),
      accountStakedBy.refetch(),
      accountFreeBalance.refetch(),
    ]);
  };

  const handleTransactionCallback = (result: TransactionResult) => {
    setTransactionStatus(result);
    if (result.status === "SUCCESS") {
      reset();
    }
  };

  const onSubmit = async (values: StakeFormValues) => {
    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting transaction...",
    });

    await addStake({
      validator: checkSS58(values.recipient),
      amount: values.amount,
      callback: handleTransactionCallback,
      refetchHandler: refetchData,
    });
  };

  const handleAmountChange = async (newAmount: string) => {
    setValue("amount", newAmount);
    await trigger("amount");
  };

  const handleSelectValidator = async (validator: { address: string }) => {
    setValue("recipient", checkSS58(validator.address));
    setCurrentView("wallet");
    await trigger("recipient");
  };

  const handleReviewClick = async () => {
    const isValid = await trigger();
    if (isValid) {
      reviewDialogRef.current?.openDialog();
    }
  };

  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      <StakeForm
        form={form}
        selectedAccount={selectedAccount}
        usdPrice={usdPrice}
        minAllowedStakeData={minAllowedStakeData}
        maxAmountRef={maxAmountRef}
        feeRef={feeRef}
        transactionStatus={transactionStatus}
        handleSelectValidator={handleSelectValidator}
        onReviewClick={handleReviewClick}
        handleAmountChange={handleAmountChange}
        onSubmit={onSubmit}
      />
      <ReviewTransactionDialog
        ref={reviewDialogRef}
        formRef={{ current: null }}
        from={selectedAccount?.address}
        to={getValues().recipient}
        amount={getValues().amount}
        fee={feeRef.current?.getEstimatedFee() ?? "0"}
      />
    </div>
  );
}
