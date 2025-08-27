"use client";

import { useEffect, useRef, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { removeStake } from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";
import { checkSS58 } from "@torus-network/sdk/types";
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
import { MIN_ALLOWED_STAKE_SAFEGUARD, MIN_EXISTENTIAL_BALANCE } from "~/utils/constants";

import type { ReviewTransactionDialogHandle } from "../../../_components/review-transaction-dialog";
import { ReviewTransactionDialog } from "../../../_components/review-transaction-dialog";
import { UnstakeForm } from "./unstake-form";
import type { UnstakeFormValues } from "./unstake-form-schema";
import { createUnstakeFormSchema } from "./unstake-form-schema";

interface StakedValidator {
  address: string;
  stake: bigint;
}

export function Unstake() {
  const {
    accountStakedBy,
    accountFreeBalance,
    stakeOut,
    selectedAccount,
    minAllowedStake,
    estimatedFee,
  } = useWallet();

  const { api, torusApi, wsEndpoint } = useTorus();

  const { sendTx, isPending, isSigning } = useSendTransaction({
    api,
    selectedAccount,
    wsEndpoint,
    wallet: torusApi,
    transactionType: "Unstake",
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

  const [stakedAmount, setStakedAmount] = useState<bigint | null>(null);
  const [maxUnstakeAmount, setMaxUnstakeAmount] = useState<string>("");

  const reviewDialogRef = useRef<ReviewTransactionDialogHandle>(null);
  const currentTxIdRef = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const unstakeFormSchema = createUnstakeFormSchema(
    minAllowedStakeData,
    MIN_EXISTENTIAL_BALANCE,
    freeBalance,
    estimatedFee,
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
          setMaxUnstakeAmount(fromNano(staked.stake));
        } else {
          setStakedAmount(null);
          setMaxUnstakeAmount("");
        }
      }
    });
    return () => {
      unsubscribe();
    };
  }, [accountStakedBy.data, watch]);

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

  const onSubmit = async (values: UnstakeFormValues) => {
    if (!selectedAccount?.address) {
      toast.error("No account selected");
      return;
    }

    if (!api || !sendTx) {
      toast.error("API not ready");
      return;
    }

    const txId = addTransaction({
      type: "unstake",
      fromAddress: selectedAccount.address as SS58Address,
      toAddress: values.validator,
      amount: formatToken(toNano(values.amount), 12), // Convert to nano and format
      fee: estimatedFee ? formatToken(estimatedFee, 12) : "Estimating...",
      status: "PENDING",
      metadata: {
        usdPrice: usdPrice,
      },
    });

    currentTxIdRef.current = txId;

    const [sendErr, sendRes] = await sendTx(
      removeStake(api, checkSS58(values.validator), toNano(values.amount)),
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

  const handleSelectValidator = async (
    address: BrandTag<"SS58Address"> & string,
  ) => {
    setValue("validator", address);
    const [error] = await tryAsync(trigger("validator"));
    if (error !== undefined) {
      console.error("Failed to validate validator:", error);
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

  const { validator, amount } = getValues();

  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      <UnstakeForm
        form={form}
        selectedAccount={selectedAccount}
        usdPrice={usdPrice}
        minAllowedStakeData={minAllowedStakeData}
        maxUnstakeAmount={maxUnstakeAmount}
        estimatedFee={estimatedFee}
        isPending={isPending}
        isSigning={isSigning}
        handleSelectValidator={handleSelectValidator}
        onReviewClick={handleReviewClick}
        handleAmountChange={handleAmountChange}
        formRef={formRef}
      />
      <ReviewTransactionDialog
        ref={reviewDialogRef}
        from={selectedAccount?.address}
        to={validator}
        amount={amount}
        fee={formatToken(estimatedFee ?? 0n, 12)}
        onConfirm={handleConfirmTransaction}
      />
    </div>
  );
}
