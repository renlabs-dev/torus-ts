"use client";

import React, { useCallback, useEffect, useState } from "react";
import { BN } from "@polkadot/util";

import type { TransactionResult, Transfer } from "@torus-ts/ui/types";
import { useTorus } from "@torus-ts/providers/use-torus";
import { TransactionStatus } from "@torus-ts/ui";
import { fromNano, toNano } from "@torus-ts/utils/subspace";

import type { GenericActionProps } from "../wallet-actions";

export function SendAction(
  props: {
    transfer: (transfer: Transfer) => Promise<void>;
  } & GenericActionProps,
) {
  const [amount, setAmount] = useState<string>("");
  const [estimatedFee, setEstimatedFee] = useState<string | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [recipient, setRecipient] = useState<string>("");
  const { estimateFee } = useTorus();

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
    const adjustedFeeBN = feeBN.muln(110).divn(100); // Increase fee by 10%
    const maxAmountBN = balanceBN.sub(adjustedFeeBN);
    return maxAmountBN.isNeg() ? "0" : fromNano(maxAmountBN.toString());
  }, []);

  const estimateFeeAndUpdateMax = async () => {
    if (!recipient) {
      setEstimatedFee(null);
      setMaxAmount("");
      return;
    }

    setIsEstimating(true);
    try {
      const fee = await estimateFee(recipient, "0");
      if (fee) {
        const feeStr = fromNano(fee.toString());
        setEstimatedFee(feeStr);

        const newMaxAmount = calculateMaxAmount(
          fromNano(props.balance?.toString() ?? "0"),
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
    const handleCallback = (callbackReturn: TransactionResult) => {
      setTransactionStatus(callbackReturn);
    };

    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting transaction...",
    });

    const isValidInput = amount && recipient && !inputError.value;

    if (!isValidInput) return;

    void props.transfer({ to: recipient, amount, callback: handleCallback });
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

  return (
    <div className="mt-4 w-full">
      <form
        onSubmit={handleSubmit}
        className="flex w-full animate-fade-down flex-col gap-4 pt-4"
      >
        <div className="w-full">
          <span className="text-base">To Address</span>
          <input
            type="text"
            value={recipient}
            required
            onChange={handleRecipientChange}
            placeholder="The full address of the recipient"
            className="w-full border border-white/20 bg-[#898989]/5 p-2"
          />
          {inputError.recipient && (
            <p className="-mt-2 mb-1 flex text-left text-base text-red-400">
              {inputError.recipient}
            </p>
          )}
        </div>
        <div className="w-full">
          <p className="text-base">Value</p>
          <div className="flex w-full gap-1">
            <input
              type="number"
              value={amount}
              max={parseFloat(maxAmount)}
              required
              onChange={handleAmountChange}
              placeholder="The amount of COMAI to send"
              className="w-full border border-white/20 bg-[#898989]/5 p-2 disabled:cursor-not-allowed disabled:border-gray-600/50 disabled:text-gray-600/50 disabled:placeholder:text-gray-600/50"
              disabled={!recipient || isEstimating}
            />
            <button
              type="button"
              onClick={handleMaxClick}
              className="ml-2 whitespace-nowrap border border-blue-500 bg-blue-600/5 px-4 py-2 font-semibold text-blue-500 transition duration-200 hover:border-blue-400 hover:bg-blue-500/15 disabled:cursor-not-allowed disabled:border-gray-600/50 disabled:bg-transparent disabled:text-gray-600/50 disabled:hover:border-gray-600/50 disabled:hover:bg-transparent"
              disabled={!recipient || isEstimating}
            >
              Max
            </button>
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
              Estimated fee: {(Number(estimatedFee) * 1.1).toFixed(9)} COMAI
            </p>
          )}
          {maxAmount && (
            <button
              onClick={() => setAmount(maxAmount)}
              type="button"
              className="mt-2 text-sm text-gray-400"
            >
              Maximum transferable amount:{" "}
              <span className="text-green-500">{maxAmount} COMAI</span>
            </button>
          )}
        </div>
        <div className="mt-4 border-t border-white/20 pt-4">
          <button
            type="submit"
            disabled={
              transactionStatus.status === "PENDING" ||
              !amount ||
              !recipient ||
              isEstimating ||
              !!inputError.value
            }
            className="flex w-full justify-center text-nowrap border border-green-500 bg-green-600/5 px-6 py-2.5 font-semibold text-green-500 transition duration-200 hover:border-green-400 hover:bg-green-500/15 disabled:cursor-not-allowed disabled:border-gray-600/50 disabled:bg-transparent disabled:text-gray-600/50 disabled:hover:bg-transparent"
          >
            Start Transaction
          </button>
        </div>
      </form>
      {transactionStatus.status && (
        <TransactionStatus
          status={transactionStatus.status}
          message={transactionStatus.message}
        />
      )}
    </div>
  );
}
