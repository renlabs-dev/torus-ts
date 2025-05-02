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
import type { BrandTag } from "@torus-network/torus-utils";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { saveTransaction } from "~/utils/transaction/save-transaction";

export const MIN_ALLOWED_STAKE_SAFEGUARD = 500000000000000000n;
export const MIN_EXISTENTIAL_BALANCE = 100000000000000000n;

export function Stake() {
  const {
    addStake,
    accountFreeBalance,
    stakeOut,
    accountStakedBy,
    selectedAccount,
    addStakeTransaction,
    estimateFee,
    getExistentialDeposit,
    minAllowedStake,
  } = useWallet();
  const { toast } = useToast();
  const { usdPrice } = useUsdPrice();

  const minAllowedStakeData =
    minAllowedStake.data ?? MIN_ALLOWED_STAKE_SAFEGUARD;

  const existentialDepositValue =
    getExistentialDeposit() ?? MIN_EXISTENTIAL_BALANCE;

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
    existentialDepositValue,
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
      existentialDepositValue,
      toast,
    });
  }, [
    addStakeTransaction,
    estimateFee,
    existentialDepositValue,
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
    const [error] = await tryAsync(
      Promise.all([
        stakeOut.refetch(),
        accountStakedBy.refetch(),
        accountFreeBalance.refetch(),
      ]),
    );

    if (error !== undefined) {
      console.error("Failed to refetch data:", error);
      toast.error("Failed to refresh account data");
    }
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
      message: "Awaiting Signature",
    });

    // Save initial transaction record
    let updateTransaction;
    if (selectedAccount?.address) {
      const [saveError, saveResult] = await tryAsync(saveTransaction({
        type: "STAKE",
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

    // Create a transaction callback that also updates the transaction record
    const transactionCallback = (result: TransactionResult) => {
      if (updateTransaction) {
        void updateTransaction(
          result, 
          result.hash,
          result.blockHeight ? Number(result.blockHeight) : undefined
        );
      }
      handleTransactionCallback(result);
    };

    const [error] = await tryAsync(
      addStake({
        validator: checkSS58(values.recipient),
        amount: values.amount,
        callback: transactionCallback,
        refetchHandler: refetchData,
      }),
    );

    if (error !== undefined) {
      // Update transaction to error state if stake failed
      if (updateTransaction) {
        void updateTransaction(
          { status: "ERROR", finalized: true, message: error.message || "Transaction failed" },
          undefined,
          undefined
        );
      }
      
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: error.message || "Transaction failed",
      });
      toast.error("Failed to stake tokens");
    }
  };

  const handleAmountChange = async (newAmount: string) => {
    setValue("amount", newAmount);
    const [error] = await tryAsync(trigger("amount"));
    if (error !== undefined) {
      console.error("Failed to validate amount:", error);
    }
  };

  const handleSelectValidator = async (
    address: BrandTag<"SS58Address"> & string,
  ) => {
    setValue("recipient", address);
    setCurrentView("wallet");
    const [error] = await tryAsync(trigger("recipient"));
    if (error !== undefined) {
      console.error("Failed to validate recipient:", error);
    }
  };

  const handleReviewClick = async () => {
    const [triggerError, isValid] = await tryAsync(trigger());

    if (triggerError !== undefined) {
      console.error("Form validation failed:", triggerError);
      toast.error("Form validation failed");
      return;
    }

    if (isValid) {
      reviewDialogRef.current?.openDialog();
    }
  };

  const onConfirm = () => {
    const values = getValues();
    void onSubmit(values);
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
      />
      <ReviewTransactionDialog
        ref={reviewDialogRef}
        from={selectedAccount?.address}
        to={getValues().recipient}
        amount={getValues().amount}
        fee={feeRef.current?.getEstimatedFee() ?? "0"}
        onConfirm={onConfirm}
      />
    </div>
  );
}
