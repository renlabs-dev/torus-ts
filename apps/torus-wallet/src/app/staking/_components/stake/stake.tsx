"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { addStake } from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";
import { checkSS58 } from "@torus-network/sdk/types";
import type { BrandTag } from "@torus-network/torus-utils";
import { formatToken, toNano } from "@torus-network/torus-utils/torus/token";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { useTorus } from "@torus-ts/torus-provider";
import { useSendTransaction } from "@torus-ts/torus-provider/use-send-transaction";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useUsdPrice } from "~/context/usd-price-provider";
import { useWallet } from "~/context/wallet-provider";
import { useTransactionsStore } from "~/store/transactions-store";
import {
  MIN_ALLOWED_STAKE_SAFEGUARD,
  MIN_EXISTENTIAL_BALANCE,
} from "~/utils/constants";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import type { ReviewTransactionDialogHandle } from "../../../_components/review-transaction-dialog";
import { ReviewTransactionDialog } from "../../../_components/review-transaction-dialog";
import { StakeForm } from "./stake-form";
import type { StakeFormValues } from "./stake-form-schema";
import { createStakeActionFormSchema } from "./stake-form-schema";

export function Stake() {
  const {
    accountFreeBalance,
    stakeOut,
    accountStakedBy,
    selectedAccount,
    minAllowedStake,
    estimatedFee,
    maxTransferableAmount,
  } = useWallet();

  const { api, torusApi, wsEndpoint } = useTorus();

  const { sendTx, isPending, isSigning } = useSendTransaction({
    api,
    selectedAccount,
    wsEndpoint,
    wallet: torusApi,
    transactionType: "Stake",
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

  const reviewDialogRef = useRef<ReviewTransactionDialogHandle>(null);
  const currentTxIdRef = useRef<string | null>(null);

  const stakeActionFormSchema = createStakeActionFormSchema(
    minAllowedStakeData,
    MIN_EXISTENTIAL_BALANCE,
    freeBalance,
    estimatedFee,
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

  const onSubmit = async (values: StakeFormValues) => {
    if (!selectedAccount?.address) {
      toast.error("No account selected");
      return;
    }

    if (!api || !sendTx) {
      toast.error("API not ready");
      return;
    }

    const txId = addTransaction({
      type: "stake",
      fromAddress: selectedAccount.address as SS58Address,
      toAddress: values.recipient,
      amount: formatToken(toNano(values.amount), 12), // Convert to nano and format
      fee: estimatedFee ? formatToken(estimatedFee, 12) : "Estimating...",
      status: "PENDING",
      metadata: {
        usdPrice: usdPrice,
      },
    });

    currentTxIdRef.current = txId;

    const [sendErr, sendRes] = await sendTx(
      addStake(api, checkSS58(values.recipient), toNano(values.amount)),
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
    setValue("recipient", address);
    const [error] = await tryAsync(trigger("recipient"));
    if (error !== undefined) {
      console.error("Failed to validate recipient:", error);
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

  const { recipient, amount } = getValues();

  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      <StakeForm
        form={form}
        selectedAccount={selectedAccount}
        usdPrice={usdPrice}
        minAllowedStakeData={minAllowedStakeData}
        maxTransferableAmount={maxTransferableAmount}
        estimatedFee={estimatedFee}
        isPending={isPending}
        isSigning={isSigning}
        handleSelectValidator={handleSelectValidator}
        onReviewClick={handleReviewClick}
        handleAmountChange={handleAmountChange}
      />
      <ReviewTransactionDialog
        ref={reviewDialogRef}
        from={selectedAccount?.address}
        to={recipient}
        amount={amount}
        fee={formatToken(estimatedFee ?? 0n, 12)}
        onConfirm={handleConfirmTransaction}
      />
    </div>
  );
}
