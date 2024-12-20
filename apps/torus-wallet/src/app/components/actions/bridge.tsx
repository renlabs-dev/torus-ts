"use client";

import React, { useEffect, useRef, useState } from "react";

import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { isSS58 } from "@torus-ts/subspace";
import { Card, Input, Label, TransactionStatus } from "@torus-ts/ui";
import { fromNano, smallAddress, toNano2 } from "@torus-ts/utils/subspace";

import { useWallet } from "~/context/wallet-provider";
import { AmountButtons } from "../amount-buttons";
import { FeeLabel } from "../fee-label";
import { WalletTransactionReview } from "../wallet-review";

export function BridgeAction() {
  const { estimateFee, accountFreeBalance } = useWallet();

  const [amount, setAmount] = useState<string>("");
  const [estimatedFee, setEstimatedFee] = useState<string | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [maxAmount, setMaxAmount] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sender, setSender] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [exchangedValue, setExchangedValue] = useState<string>("");
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

  const handleUpdateMaxAmount = (fee: bigint | undefined) => {
    if (!fee) return;
    const balance = accountFreeBalance.data ?? 0n;
    const newMaxAmount = balance - fee;
    const newMaxAmountStr = newMaxAmount > 0n ? fromNano(newMaxAmount) : "0";
    setMaxAmount(newMaxAmountStr);

    const amountNano = toNano2(amount || "0");

    if (amountNano > newMaxAmount) {
      setInputError((prev) => ({
        ...prev,
        value: "Amount exceeds maximum transferable amount",
      }));
    } else {
      setInputError((prev) => ({ ...prev, value: null }));
    }
  };

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

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    if (maxAmount && Number(newAmount) > Number(maxAmount)) {
      setInputError((prev) => ({
        ...prev,
        value: "Amount exceeds maximum transferable amount",
      }));
    } else {
      setInputError((prev) => ({ ...prev, value: null }));
    }
    setAmount(newAmount);
  };

  const handleSenderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipient(e.target.value);
    setAmount("");
    setEstimatedFee(null);
    setMaxAmount("");
    setInputError({ recipient: null, value: null });
  };

  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipient(e.target.value);
    setInputError({ recipient: null, value: null });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // const handleCallback = (callbackReturn: TransactionResult) => {
    //   setTransactionStatus(callbackReturn);
    // };

    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting transaction...",
    });

    console.log("submitting transaction");
    // const isValidInput = amount && recipient && !inputError.value;

    // if (!isValidInput) return;

    // void transfer({ to: recipient, amount, callback: handleCallback });
  };

  useEffect(() => {
    async function fetchFeeAndMax() {
      const fee = await handleEstimateFee();
      handleUpdateMaxAmount(fee);
    }

    void fetchFeeAndMax();
  }, [recipient]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (amount) {
      if (Number(amount) > Number(maxAmount)) {
        setInputError((prev) => ({
          ...prev,
          value: "Amount exceeds maximum transferable amount",
        }));
      } else {
        setInputError((prev) => ({ ...prev, value: null }));
      }
    }
  }, [amount, maxAmount]);

  const formRef = useRef<HTMLFormElement>(null);
  const roundedEstimatedFee = (Number(estimatedFee) * 1.1).toFixed(9);

  const reviewData = [
    {
      label: "From",
      content: `${sender ? smallAddress(recipient, 6) : "Sender Address"}`,
    },
    {
      label: "To",
      content: `${recipient ? smallAddress(recipient, 6) : "Recipient Address"}`,
    },
    { label: "Amount", content: `${amount ? amount : 0} TOR` },
    {
      label: "Fee",
      content: `${roundedEstimatedFee} TOR`,
    },
    {
      label: "Receiving",
      content: `${exchangedValue} TOR`,
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
              From
            </Label>
            <Input
              id="send-recipient"
              type="text"
              value={sender}
              required
              onChange={handleSenderChange}
              placeholder="ETH Address"
            />
          </div>
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
              placeholder="TOR Address"
            />
          </div>
          {inputError.recipient && (
            <p className="-mt-2 mb-1 flex text-left text-base text-red-400">
              {inputError.recipient}
            </p>
          )}
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
                required
                onChange={handleAmountChange}
                placeholder="0.1"
                className="disabled:cursor-not-allowed"
                disabled={!recipient || isEstimating}
              />
              <AmountButtons
                setAmount={setAmount}
                availableFunds={maxAmount}
                disabled={!recipient || isEstimating}
              />
            </div>
          </div>

          {inputError.value && (
            <p className="mb-1 mt-2 flex text-left text-base text-red-400">
              {inputError.value}
            </p>
          )}

          <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
            <FeeLabel
              estimatedFee={estimatedFee}
              isEstimating={isEstimating}
              roundedEstimatedFee={roundedEstimatedFee}
            />
          </div>

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
        triggerTitle="Bridge Assets"
        formRef={formRef}
        reviewContent={reviewData}
      />
    </div>
  );
}
