"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { BN } from "@polkadot/util";

import type {
  TransactionResult,
  Transfer,
} from "@torus-ts/torus-provider/types";
import { useTorus } from "@torus-ts/torus-provider";
import { Button, Input, TransactionStatus } from "@torus-ts/ui";
import { fromNano, toNano } from "@torus-ts/utils/subspace";

import { WalletTransactionReview } from "../wallet-review";

export function BridgeAction() {
  const { estimateFee, balance } = useTorus();

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

  const calculateMaxAmount = useCallback((balance: string, fee: string) => {
    const balanceBN = new BN(toNano(balance));
    const feeBN = new BN(toNano(fee));
    const adjustedFeeBN = feeBN.muln(1.1); // Increase fee by 10%
    const maxAmountBN = balanceBN.sub(adjustedFeeBN);
    return maxAmountBN.isNeg() ? "0" : fromNano(maxAmountBN.toString());
  }, []);

  const estimateFeeAndUpdateMax = async () => {
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
      if (fee) {
        const feeStr = fromNano(fee.toString());
        setEstimatedFee(feeStr);

        const newMaxAmount = calculateMaxAmount(
          fromNano(balance?.toString() ?? "0"),
          feeStr,
        );
        setMaxAmount(newMaxAmount);

        if (amount && Number(amount) > Number(newMaxAmount)) {
          setInputError((prev) => ({
            ...prev,
            value: "Amount exceeds maximum transferable amount",
          }));
        } else {
          setInputError((prev) => ({ ...prev, value: null }));
        }
      } else {
        setEstimatedFee(null);
        setMaxAmount("");
      }
    } catch (error) {
      console.error("Error estimating fee:", error);
      setEstimatedFee(null);
      setMaxAmount("");
    }

    setIsEstimating(false);
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

  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipient(e.target.value);
    setAmount("");
    setEstimatedFee(null);
    setMaxAmount("");
    setInputError({ recipient: null, value: null });
  };

  const handleMaxClick = () => {
    if (!maxAmount) return;
    setAmount(maxAmount);
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
    void estimateFeeAndUpdateMax();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipient]);

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

  function getSplittedAddress(address: string) {
    return splitAddress(address).map((addressPart) => {
      return (
        <span key={addressPart} className="pl-1 first:pl-0">
          {addressPart}
        </span>
      );
    });
  }

  const reviewData = [
    { label: "Action", content: "Sending TOR" },
    {
      label: "To",
      content: getSplittedAddress(recipient),
    },
    { label: "Amount", content: `${amount} TOR` },
    { label: "Transaction fee", content: `${roundedEstimatedFee} TOR` },
  ];

  return (
    <Card className="h-fit w-full animate-fade p-4">
      <form
        onSubmit={handleSubmit}
        ref={formRef}
        className="flex w-full flex-col gap-4"
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
            placeholder="Address"
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
          <div className="flex w-full items-center gap-2">
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

            <Button
              type="button"
              variant="outline"
              onClick={handleMaxClick}
              className="whitespace-nowrap px-4 py-2 disabled:cursor-not-allowed"
              disabled={!recipient || isEstimating}
            >
              Max
            </Button>
          </div>
        </div>

        {inputError.value && (
          <p className="mb-1 mt-2 flex text-left text-base text-red-400">
            {inputError.value}
          </p>
        )}
        {isEstimating && (
          <p className="mt-2 text-sm text-gray-400">Estimating fee...</p>
        )}
        {estimatedFee && (
          <p className="mt-2 text-sm text-gray-400">
            Estimated fee: {roundedEstimatedFee} TOR
          </p>
        )}
        {maxAmount && (
          <span className="text-sm text-muted-foreground">
            Maximum transferable amount:{" "}
            <Button
              variant="link"
              type="button"
              onClick={() => setAmount(maxAmount)}
              className="p-0 text-primary"
            >
              {maxAmount} COMAI
            </Button>
          </span>
        )}
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

        {transactionStatus.status && (
          <TransactionStatus
            status={transactionStatus.status}
            message={transactionStatus.message}
          />
        )}
      </form>
    </Card>
  );
}
