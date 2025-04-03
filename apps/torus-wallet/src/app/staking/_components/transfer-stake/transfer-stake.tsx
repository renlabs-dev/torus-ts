"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { checkSS58, isSS58 } from "@torus-network/sdk";
import { useGetTorusPrice } from "@torus-ts/query-provider/hooks";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { fromNano } from "@torus-ts/utils/subspace";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useWallet } from "~/context/wallet-provider";
import { env } from "~/env";
import type { FeeLabelHandle } from "../../../components/fee-label";
import type { ReviewTransactionDialogHandle } from "../../../components/review-transaction-dialog";
import { ReviewTransactionDialog } from "../../../components/review-transaction-dialog";
import { ValidatorsList } from "../../../components/validators-list";
import { handleEstimateFee } from "./transfer-stake-fee-handler";
import { TransferStakeForm } from "./transfer-stake-form";
import type { TransferStakeFormValues } from "./transfer-stake-form-schema";
import { createTransferStakeFormSchema } from "./transfer-stake-form-schema";

export const MIN_ALLOWED_STAKE_SAFEGUARD = 500000000000000000n;
export const MIN_EXISTENCIAL_BALANCE = 100000000000000000n;

export function TransferStake() {
  const {
    accountStakedBy,
    transferStake,
    selectedAccount,
    accountFreeBalance,
    minAllowedStake,
    transferStakeTransaction,
    estimateFee,
    getExistencialDeposit,
  } = useWallet();
  const { toast } = useToast();
  const { data: usdPrice = 0 } = useGetTorusPrice();

  const minAllowedStakeData =
    minAllowedStake.data ?? MIN_ALLOWED_STAKE_SAFEGUARD;
  const existencialDepositValue =
    getExistencialDeposit() ?? MIN_EXISTENCIAL_BALANCE;
  const freeBalance = accountFreeBalance.data ?? 0n;

  const maxAmountRef = useRef<string>("");
  const stakedValidators = useMemo(
    () => accountStakedBy.data ?? [],
    [accountStakedBy.data],
  );

  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      status: null,
      message: null,
      finalized: false,
    },
  );
  const [currentView, setCurrentView] = useState<
    "wallet" | "validators" | "stakedValidators"
  >("wallet");

  const feeRef = useRef<FeeLabelHandle>(null);
  const reviewDialogRef = useRef<ReviewTransactionDialogHandle>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const transferStakeFormSchema = createTransferStakeFormSchema(
    minAllowedStakeData,
    existencialDepositValue,
    freeBalance,
    feeRef,
    maxAmountRef,
  );

  const form = useForm<TransferStakeFormValues>({
    resolver: zodResolver(transferStakeFormSchema),
    defaultValues: {
      fromValidator: "",
      toValidator: "",
      amount: "",
    },
    mode: "onTouched",
  });

  const { reset, setValue, trigger, getValues, watch } = form;

  useEffect(() => {
    const { unsubscribe } = watch((values, info) => {
      if (
        info.name === "fromValidator" &&
        isSS58(String(values.fromValidator))
      ) {
        const validator = stakedValidators.find(
          (v: { address: string; stake: bigint }) =>
            v.address === values.fromValidator,
        );
        if (validator) {
          const stakedAmount = fromNano(validator.stake);
          maxAmountRef.current = stakedAmount;
        } else {
          maxAmountRef.current = "";
        }
      }
    });
    return () => {
      setValue("amount", "");
      unsubscribe();
    };
  }, [accountStakedBy.data, watch, setValue, stakedValidators]);

  const estimateFeeHandler = useCallback(async () => {
    await handleEstimateFee({
      feeRef,
      transferStakeTransaction,
      estimateFee,
      allocatorAddress: env("NEXT_PUBLIC_TORUS_ALLOCATOR_ADDRESS"),
      toast,
    });
  }, [estimateFee, transferStakeTransaction, toast]);

  useEffect(() => {
    if (!selectedAccount?.address || currentView !== "wallet") return;
    void estimateFeeHandler();
  }, [estimateFeeHandler, selectedAccount?.address, currentView]);

  useEffect(() => {
    reset();
    maxAmountRef.current = "";
  }, [selectedAccount?.address, reset]);

  const refetchHandler = async () => {
    await accountStakedBy.refetch();
  };

  const handleCallback = (callbackReturn: TransactionResult) => {
    setTransactionStatus(callbackReturn);
    if (callbackReturn.status === "SUCCESS") {
      reset();
    }
  };

  const onSubmit = async (values: TransferStakeFormValues) => {
    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting transaction...",
    });
    await transferStake({
      fromValidator: checkSS58(values.fromValidator),
      toValidator: checkSS58(values.toValidator),
      amount: values.amount,
      callback: handleCallback,
      refetchHandler,
    });
  };

  const handleAmountChange = async (newAmount: string) => {
    setValue("amount", newAmount);
    await trigger("amount");
  };

  const handleSelectFromValidator = async (validator: { address: string }) => {
    setValue("fromValidator", checkSS58(validator.address));
    setCurrentView("wallet");
    const validatorData = stakedValidators.find(
      (v: { address: string; stake: bigint }) =>
        v.address === validator.address,
    );
    if (validatorData) {
      maxAmountRef.current = fromNano(validatorData.stake);
    } else {
      maxAmountRef.current = "";
    }
    await trigger("fromValidator");
  };

  const handleSelectToValidator = async (validator: { address: string }) => {
    setValue("toValidator", checkSS58(validator.address));
    setCurrentView("wallet");
    await trigger("toValidator");
  };

  const handleReviewClick = async () => {
    const isValid = await trigger();
    if (isValid) {
      reviewDialogRef.current?.openDialog();
    }
  };

  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      {(currentView === "validators" || currentView === "stakedValidators") && (
        <ValidatorsList
          listType={currentView === "validators" ? "all" : "staked"}
          excludeAddress={() => getValues("fromValidator")}
          onSelectValidator={
            currentView === "stakedValidators"
              ? handleSelectFromValidator
              : handleSelectToValidator
          }
          onBack={() => setCurrentView("wallet")}
        />
      )}
      {currentView === "wallet" && (
        <TransferStakeForm
          form={form}
          selectedAccount={selectedAccount}
          maxAmountRef={maxAmountRef}
          feeRef={feeRef}
          transactionStatus={transactionStatus}
          onSetCurrentView={setCurrentView}
          onReviewClick={handleReviewClick}
          handleAmountChange={handleAmountChange}
          onSubmit={onSubmit}
          formRef={formRef}
        />
      )}
      {currentView === "wallet" && (
        <ReviewTransactionDialog
          ref={reviewDialogRef}
          formRef={formRef}
          usdPrice={usdPrice}
          from={selectedAccount?.address}
          to={getValues().toValidator}
          amount={getValues().amount}
          fee={feeRef.current?.getEstimatedFee() ?? "0"}
        />
      )}
    </div>
  );
}
