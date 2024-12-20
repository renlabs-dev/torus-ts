"use client";

import React, { useEffect, useRef, useState } from "react";

import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { isSS58 } from "@torus-ts/subspace";
import { Card, Input, Label, TransactionStatus } from "@torus-ts/ui";
import { fromNano, smallAddress, toNano } from "@torus-ts/utils/subspace";

import { useWallet } from "~/context/wallet-provider";
import { AmountButtons } from "../amount-buttons";
import { FeeLabel } from "../fee-label";
import { WalletTransactionReview } from "../wallet-review";

export function SendAction() {
  const { estimateFee, accountFreeBalance, transfer } = useWallet();

  const [amount, setAmount] = useState<string>("");
  const [estimatedFee, setEstimatedFee] = useState<string | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [recipient, setRecipient] = useState<string>("");

  const [inputError, setInputError] = useState<{
    recipient: string | null;
    value: string | null;
  }>({
    recipient: null,
    value: null,
  });

  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      status: null,
      message: null,
      finalized: false,
    },
  );

  const handleEstimateFee = async (): Promise<bigint | undefined> => {
    if (!recipient) {
      setEstimatedFee(null);
      setMaxAmount("");
      return;
    }

    if (!isSS58(recipient)) {
      setInputError((prev) => ({
        ...prev,
        recipient: "Invalid recipient address",
      }));
      return;
    }

    setIsEstimating(true);
    try {
      const fee = await estimateFee(recipient, "0");
      if (fee != null) {
        const adjustedFee = (fee * 11n) / 10n;
        setEstimatedFee(fromNano(adjustedFee));
        return adjustedFee;
      } else {
        setEstimatedFee(null);
        setMaxAmount("");
      }
    } catch (error) {
      console.error("Error estimating fee:", error);
      setEstimatedFee(null);
      setMaxAmount("");
    } finally {
      setIsEstimating(false);
    }
  };

  const handleUpdateMaxAmount = (fee: bigint | undefined) => {
    if (!fee) return;
    const afterFeesBalance = (accountFreeBalance.data ?? 0n) - fee;
    const maxAmount = afterFeesBalance > 0 ? afterFeesBalance : 0n;

    setMaxAmount(fromNano(maxAmount));

    const amountNano = toNano(amount || "0");
    if (amountNano > maxAmount) {
      setInputError((prev) => ({
        ...prev,
        value: "Amount exceeds maximum transferable amount",
      }));
    } else {
      setInputError((prev) => ({ ...prev, value: null }));
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value.replace(/[^0-9.]/g, "");

    const amountNano = toNano(newAmount || "0");
    const estimatedFeeNano = toNano(estimatedFee ?? "0");
    const afterFeesBalance = (accountFreeBalance.data ?? 0n) - estimatedFeeNano;
    const maxAmountNano = afterFeesBalance > 0n ? afterFeesBalance : 0n;

    if (amountNano > maxAmountNano) {
      setInputError((prev) => ({
        ...prev,
        value: "Amount exceeds maximum transferable amount",
      }));
    } else {
      setInputError((prev) => ({ ...prev, value: null }));
    }

    setAmount(newAmount);
  };

  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipient(e.target.value);
    setAmount("");
    setEstimatedFee(null);
    setMaxAmount("");
    setInputError({ recipient: null, value: null });
  };

  const handleCallback = (callbackReturn: TransactionResult) => {
    setTransactionStatus(callbackReturn);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const isValidInput = amount && recipient && !inputError.value;
    if (!isValidInput) return;

    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting transaction...",
    });

    void transfer({ to: recipient, amount, callback: handleCallback });
  };

  useEffect(() => {
    async function fetchFeeAndMax() {
      const fee = await handleEstimateFee();
      handleUpdateMaxAmount(fee);
    }

    void fetchFeeAndMax();
  }, [recipient]); // eslint-disable-line react-hooks/exhaustive-deps

  const formRef = useRef<HTMLFormElement>(null);

  const reviewData = [
    {
      label: "To",
      content: `${recipient ? smallAddress(recipient, 6) : "Recipient Address"}`,
    },
    { label: "Amount", content: `${amount ? amount : 0} TOR` },
    {
      label: "Fee",
      content: `${amount ? estimatedFee : 0} TOR`,
    },
  ];

  return (
    <div className="l flex w-full flex-col gap-4 md:flex-row">
      <Card className="w-full animate-fade p-6 md:w-3/5">
        <form
          onSubmit={handleSubmit}
          ref={formRef}
          className="flex w-full flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="send-recipient" className="">
              To
            </Label>
            <Input
              id="send-recipient"
              type="text"
              value={recipient}
              required
              onChange={handleRecipientChange}
              placeholder="Full recipient address"
            />
            {inputError.recipient && (
              <span className="-mt-1 mb-1 flex text-left text-sm text-red-400">
                {inputError.recipient}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="send-amount" className="text-base">
              Amount
            </Label>
            <div className="flex w-full flex-col gap-2">
              <Input
                id="send-amount"
                type="number"
                value={amount}
                max={maxAmount}
                min={0}
                step={0.000000001}
                required
                onChange={handleAmountChange}
                placeholder="Amount of TOR"
                className="disabled:cursor-not-allowed"
                disabled={!recipient || isEstimating}
              />
              <AmountButtons
                setAmount={setAmount}
                availableFunds={maxAmount}
                disabled={!recipient || isEstimating}
              />
            </div>
            {inputError.value && (
              <span className="-mt-1 mb-1 flex text-left text-sm text-red-400">
                {inputError.value}
              </span>
            )}
          </div>

          <FeeLabel
            estimatedFee={estimatedFee}
            isEstimating={isEstimating}
            roundedEstimatedFee={estimatedFee ?? "0"}
          />

          {transactionStatus.status && (
            <TransactionStatus
              status={transactionStatus.status}
              message={transactionStatus.message}
            />
          )}
        </form>
      </Card>
      <WalletTransactionReview
        disabled={
          transactionStatus.status === "PENDING" ||
          !amount ||
          !recipient ||
          isEstimating ||
          !!inputError.value
        }
        formRef={formRef}
        reviewContent={reviewData}
      />
    </div>
  );
}
