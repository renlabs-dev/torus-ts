"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { checkSS58 } from "@torus-network/sdk";
import { useGetTorusPrice } from "@torus-ts/query-provider/hooks";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { fromNano } from "@torus-ts/utils/subspace";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useWallet } from "~/context/wallet-provider";
import { env } from "~/env";
import type { FeeLabelHandle } from "../../../_components/fee-label";
import type { ReviewTransactionDialogHandle } from "../../../_components/review-transaction-dialog";
import { ReviewTransactionDialog } from "../../../_components/review-transaction-dialog";
import { ValidatorsList } from "../../../_components/validators-list";
import { handleEstimateFee } from "./unstake-fee-handler";
import { UnstakeForm } from "./unstake-form";
import type { UnstakeFormValues } from "./unstake-form-schema";
import { createUnstakeFormSchema } from "./unstake-form-schema";

export const MIN_ALLOWED_STAKE_SAFEGUARD = 500000000000000000n;
export const MIN_EXISTENCIAL_BALANCE = 100000000000000000n;

interface StakedValidator {
  address: string;
  stake: bigint;
}

export function Unstake() {
  const {
    removeStake,
    accountStakedBy,
    accountFreeBalance,
    removeStakeTransaction,
    stakeOut,
    estimateFee,
    selectedAccount,
    minAllowedStake,
    getExistencialDeposit,
  } = useWallet();

  const { toast } = useToast();
  const { data: usdPrice = 0 } = useGetTorusPrice();

  const minAllowedStakeData =
    minAllowedStake.data ?? MIN_ALLOWED_STAKE_SAFEGUARD;
  const existencialDepositValue =
    getExistencialDeposit() ?? MIN_EXISTENCIAL_BALANCE;
  const freeBalance = accountFreeBalance.data ?? 0n;

  const [stakedAmount, setStakedAmount] = useState<bigint | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      status: null,
      message: null,
      finalized: false,
    },
  );
  const [currentView, setCurrentView] = useState<"wallet" | "stakedValidators">(
    "wallet",
  );

  const feeRef = useRef<FeeLabelHandle>(null);
  const maxAmountRef = useRef<string>("");
  const reviewDialogRef = useRef<ReviewTransactionDialogHandle>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const unstakeFormSchema = createUnstakeFormSchema(
    minAllowedStakeData,
    existencialDepositValue,
    freeBalance,
    feeRef,
    stakedAmount,
  );

  const form = useForm<UnstakeFormValues>({
    resolver: zodResolver(unstakeFormSchema),
    defaultValues: { validator: "", amount: "" },
    mode: "onTouched",
  });
  const { reset, setValue, trigger, watch, getValues } = form;

  useEffect(() => {
    const { unsubscribe } = watch((values, info) => {
      if (info.name === "validator" && checkSS58(String(values.validator))) {
        const staked = (accountStakedBy.data ?? ([] as StakedValidator[])).find(
          (v) => v.address === values.validator,
        );
        if (staked) {
          setStakedAmount(staked.stake);
          maxAmountRef.current = fromNano(staked.stake);
        } else {
          setStakedAmount(null);
          maxAmountRef.current = "";
        }
      }
    });
    return () => {
      unsubscribe();
    };
  }, [accountStakedBy.data, watch]);

  const estimateFeeHandler = useCallback(async () => {
    await handleEstimateFee({
      feeRef,
      removeStakeTransaction,
      estimateFee,
      allocatorAddress: env("NEXT_PUBLIC_TORUS_ALLOCATOR_ADDRESS"),
      toast,
    });
  }, [estimateFee, removeStakeTransaction, toast]);

  useEffect(() => {
    if (!selectedAccount?.address || currentView !== "wallet") return;
    void estimateFeeHandler();
  }, [estimateFeeHandler, selectedAccount?.address, currentView]);

  useEffect(() => {
    reset();
    feeRef.current?.updateFee(null);
  }, [selectedAccount?.address, reset]);

  const refetchHandler = async () => {
    await Promise.all([
      stakeOut.refetch(),
      accountStakedBy.refetch(),
      accountFreeBalance.refetch(),
    ]);
  };

  const handleCallback = (callbackReturn: TransactionResult) => {
    setTransactionStatus(callbackReturn);
    if (callbackReturn.status === "SUCCESS") {
      reset();
    }
  };

  const onSubmit = async (values: UnstakeFormValues) => {
    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting transaction...",
    });
    await removeStake({
      validator: checkSS58(values.validator),
      amount: values.amount,
      callback: handleCallback,
      refetchHandler,
    });
  };

  const handleAmountChange = async (newAmount: string) => {
    setValue("amount", newAmount);
    await trigger("amount");
  };

  const handleSelectValidator = async (validator: { address: string }) => {
    setValue("validator", checkSS58(validator.address));
    setCurrentView("wallet");
    await trigger("validator");
  };

  const handleReviewClick = async () => {
    const isValid = await trigger();
    if (isValid) {
      reviewDialogRef.current?.openDialog();
    }
  };

  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      {currentView === "stakedValidators" ? (
        <ValidatorsList
          listType="staked"
          onSelectValidator={handleSelectValidator}
          onBack={() => setCurrentView("wallet")}
        />
      ) : (
        <UnstakeForm
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
      {currentView !== "stakedValidators" && (
        <ReviewTransactionDialog
          ref={reviewDialogRef}
          formRef={formRef}
          usdPrice={usdPrice}
          from={selectedAccount?.address}
          to={getValues().validator}
          amount={getValues().amount}
          fee={feeRef.current?.getEstimatedFee() ?? "0"}
        />
      )}
    </div>
  );
}
