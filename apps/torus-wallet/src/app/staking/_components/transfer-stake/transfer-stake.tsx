"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { transferStake } from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";
import { checkSS58, isSS58 } from "@torus-network/sdk/types";
import type { BrandTag } from "@torus-network/torus-utils";
import {
  formatToken,
  fromNano,
  toNano,
} from "@torus-network/torus-utils/torus/token";
import { tryAsync } from "@torus-network/torus-utils/try-catch";

import { useTorus } from "@torus-ts/torus-provider";
import { useSendTransaction } from "@torus-ts/torus-provider/use-send-transaction";
import { useToast } from "@torus-ts/ui/hooks/use-toast";

import { useUsdPrice } from "~/context/usd-price-provider";
import { useWallet } from "~/context/wallet-provider";
import { useTransactionsStore } from "~/store/transactions-store";

import type { ReviewTransactionDialogHandle } from "../../../_components/review-transaction-dialog";
import { ReviewTransactionDialog } from "../../../_components/review-transaction-dialog";
import { TransferStakeForm } from "./transfer-stake-form";
import type { TransferStakeFormValues } from "./transfer-stake-form-schema";
import { createTransferStakeFormSchema } from "./transfer-stake-form-schema";

export const MIN_ALLOWED_STAKE_SAFEGUARD = 500000000000000000n;
export const MIN_EXISTENTIAL_BALANCE = 100000000000000000n;

export function TransferStake() {
  const {
    accountStakedBy,
    selectedAccount,
    accountFreeBalance,
    minAllowedStake,
    estimatedFee,
  } = useWallet();

  const { api, torusApi, wsEndpoint } = useTorus();

  const { sendTx, isPending } = useSendTransaction({
    api,
    selectedAccount,
    wsEndpoint,
    wallet: torusApi,
    transactionType: "Transfer Stake",
  });

  const addTransaction = useTransactionsStore((state) => state.addTransaction);
  const markTransactionSuccess = useTransactionsStore(
    (state) => state.markTransactionSuccess,
  );

  const { toast } = useToast();
  const { usdPrice } = useUsdPrice();

  const minAllowedStakeData =
    minAllowedStake.data ?? MIN_ALLOWED_STAKE_SAFEGUARD;

  const freeBalance = accountFreeBalance.data ?? 0n;

  const [maxTransferStakeAmount, setMaxTransferStakeAmount] =
    useState<string>("");
  const stakedValidators = useMemo(
    () => accountStakedBy.data ?? [],
    [accountStakedBy.data],
  );

  const reviewDialogRef = useRef<ReviewTransactionDialogHandle>(null);
  const currentTxIdRef = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const transferStakeFormSchema = createTransferStakeFormSchema(
    minAllowedStakeData,
    MIN_EXISTENTIAL_BALANCE,
    freeBalance,
    estimatedFee,
    { current: maxTransferStakeAmount },
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
        setMaxTransferStakeAmount(fromNano(validatorData.stake.toString()));
      } else {
        setMaxTransferStakeAmount("0");
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

  const handleAmountChange = async (torusAmount: string) => {
    setValue("amount", torusAmount);
    const [error, _success] = await tryAsync(trigger("amount"));
    if (error !== undefined) {
      toast.error(error.message);
      return;
    }
    return;
  };

  useEffect(() => {
    reset();
    setMaxTransferStakeAmount("");
  }, [selectedAccount?.address, reset]);

  const refetchHandler = async () => {
    const [error] = await tryAsync(accountStakedBy.refetch());
    if (error !== undefined) {
      console.error("Failed to refetch account staked by:", error);
      toast.error("Failed to refresh staking data");
    }
  };

  const onSubmit = async (values: TransferStakeFormValues) => {
    if (!selectedAccount?.address) {
      toast.error("No account selected");
      return;
    }

    if (!api || !sendTx) {
      toast.error("API not ready");
      return;
    }

    const txId = addTransaction({
      type: "transfer-stake",
      fromAddress: selectedAccount.address as SS58Address,
      toAddress: values.toValidator,
      amount: formatToken(toNano(values.amount), 12), // Convert to nano and format
      fee: estimatedFee ? formatToken(estimatedFee, 12) : "Estimating...",
      status: "PENDING",
      metadata: {
        usdPrice: usdPrice,
        fromValidator: values.fromValidator,
      },
    });

    currentTxIdRef.current = txId;

    const [sendErr, sendRes] = await sendTx(
      transferStake(
        api,
        checkSS58(values.fromValidator),
        checkSS58(values.toValidator),
        toNano(values.amount),
      ),
    );

    if (sendErr !== undefined) {
      return; // Error already handled by sendTx
    }

    const { tracker } = sendRes;

    tracker.on("finalized", (event) => {
      // Update transaction store with actual transaction hash
      if (currentTxIdRef.current) {
        markTransactionSuccess(currentTxIdRef.current, event.blockHash);
        currentTxIdRef.current = null;
      }

      form.reset();
      void refetchHandler();
    });
  };

  const handleSelectFromValidator = async (
    address: BrandTag<"SS58Address"> & string,
  ) => {
    setValue("fromValidator", address);

    const [updateError] = await tryAsync(
      Promise.resolve().then(() => updateMaxTransferableAmount(address)),
    );
    if (updateError !== undefined) {
      console.error("Failed to update max transferable amount:", updateError);
    }

    const [triggerError] = await tryAsync(trigger("fromValidator"));
    if (triggerError !== undefined) {
      console.error("Failed to validate fromValidator:", triggerError);
    }
  };

  const handleSelectToValidator = async (
    address: BrandTag<"SS58Address"> & string,
  ) => {
    setValue("toValidator", address);
    const [error] = await tryAsync(trigger("toValidator"));
    if (error !== undefined) {
      console.error("Failed to validate toValidator:", error);
    }
  };

  const handleReviewClick = async () => {
    const [error, isValid] = await tryAsync(trigger());
    if (error !== undefined) {
      toast.error(error.message);
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

  const { fromValidator, toValidator, amount } = getValues();

  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      <TransferStakeForm
        form={form}
        selectedAccount={selectedAccount}
        usdPrice={usdPrice}
        maxTransferStakeAmount={maxTransferStakeAmount}
        estimatedFee={estimatedFee}
        isPending={isPending}
        handleSelectFromValidatorAction={handleSelectFromValidator}
        handleSelectToValidatorAction={handleSelectToValidator}
        onReviewClickAction={handleReviewClick}
        handleAmountChangeAction={handleAmountChange}
        formRef={formRef}
        fromValidatorValue={fromValidator}
        minAllowedStakeData={minAllowedStakeData}
      />
      <ReviewTransactionDialog
        ref={reviewDialogRef}
        from={selectedAccount?.address}
        to={toValidator}
        amount={amount}
        fee={formatToken(estimatedFee ?? 0n, 12)}
        onConfirm={handleConfirmTransaction}
      />
    </div>
  );
}
