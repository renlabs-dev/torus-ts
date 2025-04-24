"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { checkSS58 } from "@torus-network/sdk";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { fromNano } from "@torus-network/torus-utils/subspace";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useUsdPrice } from "~/context/usd-price-provider";
import { useWallet } from "~/context/wallet-provider";
import { env } from "~/env";
import type { FeeLabelHandle } from "../../../_components/fee-label";
import type { ReviewTransactionDialogHandle } from "../../../_components/review-transaction-dialog";
import { ReviewTransactionDialog } from "../../../_components/review-transaction-dialog";
import { handleEstimateFee } from "./unstake-fee-handler";
import { UnstakeForm } from "./unstake-form";
import type { UnstakeFormValues } from "./unstake-form-schema";
import { createUnstakeFormSchema } from "./unstake-form-schema";
import type { BrandTag } from "@torus-network/torus-utils";
import { tryAsync } from "@torus-network/torus-utils/try-catch";

export const MIN_ALLOWED_STAKE_SAFEGUARD = 500000000000000000n;
export const MIN_EXISTENTIAL_BALANCE = 100000000000000000n;

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
    getExistentialDeposit,
  } = useWallet();

  const { toast } = useToast();
  const { usdPrice } = useUsdPrice();

  const minAllowedStakeData =
    minAllowedStake.data ?? MIN_ALLOWED_STAKE_SAFEGUARD;
  const existentialDepositValue =
    getExistentialDeposit() ?? MIN_EXISTENTIAL_BALANCE;
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
    existentialDepositValue,
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
      message: "Awaiting Signature",
    });

    const [error] = await tryAsync(
      removeStake({
        validator: checkSS58(values.validator),
        amount: values.amount,
        callback: handleCallback,
        refetchHandler,
      }),
    );

    if (error !== undefined) {
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: error.message || "Transaction failed",
      });
      toast.error("Failed to unstake tokens");
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
    setValue("validator", address);
    setCurrentView("wallet");
    const [error] = await tryAsync(trigger("validator"));
    if (error !== undefined) {
      console.error("Failed to validate validator:", error);
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
      <UnstakeForm
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
        formRef={formRef}
      />
      <ReviewTransactionDialog
        ref={reviewDialogRef}
        from={selectedAccount?.address}
        to={getValues().validator}
        amount={getValues().amount}
        fee={feeRef.current?.getEstimatedFee() ?? "0"}
        onConfirm={onConfirm}
      />
    </div>
  );
}
