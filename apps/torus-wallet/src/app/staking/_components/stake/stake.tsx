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
import type { UpdatedTransaction } from "~/store/transactions-store";
import { useTransactionsStore } from "~/store/transactions-store";
import type { FeeLabelHandle } from "../../../_components/fee-label";
import type { ReviewTransactionDialogHandle } from "../../../_components/review-transaction-dialog";
import { ReviewTransactionDialog } from "../../../_components/review-transaction-dialog";
import { handleEstimateFee } from "./stake-fee-handler";
import { StakeForm } from "./stake-form";
import type { StakeFormValues } from "./stake-form-schema";
import { createStakeActionFormSchema } from "./stake-form-schema";
import type { BrandTag } from "@torus-network/torus-utils";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import type { SS58Address } from "@torus-network/sdk";

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

  const handleTransactionCallback = (
    result: TransactionResult,
    txId: string,
  ) => {
    setTransactionStatus(result);

    if (!isTransactionCompleted(result.status)) return;

    const isError = isTransactionError(result.status);

    const updatedTransaction: UpdatedTransaction = isError
      ? {
          status: "ERROR",
          metadata: { error: "Transaction failed" },
        }
      : {
          status: "SUCCESS",
          hash: result.hash ?? "unknown",
        };

    updateTransaction(txId, updatedTransaction);

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

    if (!selectedAccount?.address) {
      toast.error("No account selected");
      return;
    }

    const txId = addTransaction({
      type: "stake",
      fromAddress: selectedAccount.address as SS58Address,
      toAddress: values.recipient,
      amount: values.amount,
      fee: feeRef.current?.getEstimatedFee() ?? "0",
      status: "PENDING",
      metadata: {
        usdPrice: usdPrice,
      },
    });

    const [error] = await tryAsync(
      addStake({
        validator: checkSS58(values.recipient),
        amount: values.amount,
        callback: (args) => handleTransactionCallback(args, txId),
        refetchHandler: refetchData,
      }),
    );

    if (error !== undefined) {
      updateTransaction(txId, {
        status: "ERROR",
        metadata: { error: error.message },
      });

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
