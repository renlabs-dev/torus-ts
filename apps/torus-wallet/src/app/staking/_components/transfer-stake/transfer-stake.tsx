"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { checkSS58, isSS58 } from "@torus-network/sdk";
import { fromNano } from "@torus-network/torus-utils/subspace";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import type { BrandTag } from "@torus-network/torus-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useUsdPrice } from "~/context/usd-price-provider";
import { useWallet } from "~/context/wallet-provider";
import { env } from "~/env";
import type { FeeLabelHandle } from "../../../_components/fee-label";
import type { ReviewTransactionDialogHandle } from "../../../_components/review-transaction-dialog";
import { ReviewTransactionDialog } from "../../../_components/review-transaction-dialog";
import { handleEstimateFee } from "./transfer-stake-fee-handler";
import { TransferStakeForm } from "./transfer-stake-form";
import type { TransferStakeFormValues } from "./transfer-stake-form-schema";
import { createTransferStakeFormSchema } from "./transfer-stake-form-schema";

export const MIN_ALLOWED_STAKE_SAFEGUARD = 500000000000000000n;
export const MIN_EXISTENTIAL_BALANCE = 100000000000000000n;

export function TransferStake() {
  const {
    accountStakedBy,
    transferStake,
    selectedAccount,
    accountFreeBalance,
    minAllowedStake,
    transferStakeTransaction,
    estimateFee,
    getExistentialDeposit,
  } = useWallet();
  const { toast } = useToast();
  const { usdPrice } = useUsdPrice();

  const minAllowedStakeData =
    minAllowedStake.data ?? MIN_ALLOWED_STAKE_SAFEGUARD;
  const existentialDepositValue =
    getExistentialDeposit() ?? MIN_EXISTENTIAL_BALANCE;
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
    existentialDepositValue,
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

  const updateMaxTransferableAmount = useCallback(
    (validatorAddress: string) => {
      const validatorData = stakedValidators.find(
        (v: { address: string; stake: bigint }) =>
          v.address === validatorAddress,
      );
      if (validatorData) {
        maxAmountRef.current = fromNano(validatorData.stake.toString());
      } else {
        maxAmountRef.current = "0";
        console.warn(
          `Validator ${validatorAddress} not found in staked validators`,
        );
      }
    },
    [stakedValidators],
  );

  useEffect(() => {
    const { unsubscribe } = watch((values, info) => {
      if (
        info.name === "fromValidator" &&
        isSS58(String(values.fromValidator))
      ) {
        updateMaxTransferableAmount(String(values.fromValidator));
      }
    });
    return () => {
      setValue("amount", "");
      unsubscribe();
    };
  }, [accountStakedBy.data, watch, setValue, updateMaxTransferableAmount]);

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

  const handleSelectFromValidator = async (
    address: BrandTag<"SS58Address"> & string,
  ) => {
    setValue("fromValidator", address);
    setCurrentView("wallet");
    updateMaxTransferableAmount(address);
    await trigger("fromValidator");
  };

  const handleSelectToValidator = async (
    address: BrandTag<"SS58Address"> & string,
  ) => {
    setValue("toValidator", address);
    setCurrentView("wallet");
    await trigger("toValidator");
  };

  const handleReviewClick = async () => {
    const isValid = await trigger();
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
      <TransferStakeForm
        form={form}
        selectedAccount={selectedAccount}
        usdPrice={usdPrice}
        maxAmountRef={maxAmountRef}
        feeRef={feeRef}
        transactionStatus={transactionStatus}
        handleSelectFromValidatorAction={handleSelectFromValidator}
        handleSelectToValidatorAction={handleSelectToValidator}
        onReviewClickAction={handleReviewClick}
        handleAmountChangeAction={handleAmountChange}
        formRef={formRef}
        fromValidatorValue={getValues("fromValidator")}
        minAllowedStakeData={minAllowedStakeData}
      />
      <ReviewTransactionDialog
        ref={reviewDialogRef}
        from={selectedAccount?.address}
        to={getValues().toValidator}
        amount={getValues().amount}
        fee={feeRef.current?.getEstimatedFee() ?? "0"}
        onConfirm={onConfirm}
      />
    </div>
  );
}
