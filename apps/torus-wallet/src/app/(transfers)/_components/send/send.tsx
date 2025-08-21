"use client";

import { useEffect, useRef } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { transferAllowDeath } from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";
import { formatToken, toNano } from "@torus-network/torus-utils/torus/token";
import { tryAsync } from "@torus-network/torus-utils/try-catch";

import { useTorus } from "@torus-ts/torus-provider";
import { useSendTransaction } from "@torus-ts/torus-provider/use-send-transaction";
import { useToast } from "@torus-ts/ui/hooks/use-toast";

import type { ReviewTransactionDialogHandle } from "~/app/_components/review-transaction-dialog";
import { ReviewTransactionDialog } from "~/app/_components/review-transaction-dialog";
import { useUsdPrice } from "~/context/usd-price-provider";
import { useWallet } from "~/context/wallet-provider";
import { useTransactionsStore } from "~/store/transactions-store";

import { SendForm } from "./send-form";
import type { SendFormValues } from "./send-form-schema";
import { createSendFormSchema } from "./send-form-schema";

export const MIN_ALLOWED_STAKE_SAFEGUARD = 500000000000000000n;

export function Send() {
  const {
    accountFreeBalance,
    selectedAccount,
    minAllowedStake,
    estimatedFee,
    maxTransferableAmount,
  } = useWallet();

  const { api, torusApi, wsEndpoint } = useTorus();

  const { sendTx, isPending } = useSendTransaction({
    api,
    selectedAccount,
    wsEndpoint,
    wallet: torusApi,
    transactionType: "Transfer",
  });

  const addTransaction = useTransactionsStore((state) => state.addTransaction);

  const markTransactionSuccess = useTransactionsStore(
    (state) => state.markTransactionSuccess,
  );

  const { toast } = useToast();
  const { usdPrice } = useUsdPrice();

  const minAllowedStakeData =
    minAllowedStake.data ?? MIN_ALLOWED_STAKE_SAFEGUARD;

  const reviewDialogRef = useRef<ReviewTransactionDialogHandle>(null);
  const currentTxIdRef = useRef<string | null>(null);

  const sendActionFormSchema = createSendFormSchema(
    accountFreeBalance.data ?? null,
    estimatedFee,
  );

  const form = useForm<SendFormValues>({
    resolver: zodResolver(sendActionFormSchema),
    defaultValues: {
      recipient: "",
      amount: "",
    },
    mode: "onTouched",
  });

  const { reset, setValue, getValues, trigger } = form;

  const handleAmountChange = async (torusAmount: string) => {
    setValue("amount", torusAmount);
    const [error, _success] = await tryAsync(trigger("amount"));
    if (error !== undefined) {
      toast.error(error.message);
      return;
    }
    return;
  };

  const refetchHandler = async () => {
    const [error2, _success2] = await tryAsync(accountFreeBalance.refetch());
    if (error2 !== undefined) {
      toast.error(error2.message);
      return;
    }
    return;
  };

  const onSubmit = async (values: SendFormValues) => {
    if (!selectedAccount?.address) {
      toast.error("No account selected");
      return;
    }

    if (!api || !sendTx) {
      toast.error("API not ready");
      return;
    }

    const txId = addTransaction({
      type: "send",
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
      transferAllowDeath(
        api,
        values.recipient as SS58Address,
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
      void refetchHandler().then(() => {
        reset();
      });
    });
  };

  useEffect(() => {
    reset();
  }, [selectedAccount?.address, reset]);

  const handleReviewClick = async () => {
    const [error4, isValid] = await tryAsync(trigger());
    if (error4 !== undefined) {
      toast.error(error4.message);
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
      <SendForm
        form={form}
        selectedAccount={selectedAccount}
        usdPrice={usdPrice}
        maxTransferableAmount={maxTransferableAmount}
        estimatedFee={estimatedFee}
        onReviewClick={handleReviewClick}
        handleAmountChange={handleAmountChange}
        minAllowedStakeData={minAllowedStakeData}
        isPending={isPending}
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
