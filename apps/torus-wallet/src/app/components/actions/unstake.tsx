"use client";

import React, { useRef, useState } from "react";

import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { Button, Card, Input, Label, TransactionStatus } from "@torus-ts/ui";
import { fromNano, smallAddress, toNano } from "@torus-ts/utils/subspace";

import { useWallet } from "~/context/wallet-provider";
import { AmountButtons } from "../amount-buttons";
import { ValidatorsList } from "../validators-list";
import { WalletTransactionReview } from "../wallet-review";

export function UnstakeAction() {
  const { accountStakedBy, removeStake } = useWallet();

  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
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

  const [currentView, setCurrentView] = useState<"wallet" | "stakedValidators">(
    "wallet",
  );

  const [stakedAmount, setStakedAmount] = useState<string | null>(null);

  const stakedValidators = accountStakedBy.data ?? [];

  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setRecipient(address);
    setAmount("");
    setInputError({ recipient: null, value: null });
    const validator = stakedValidators.find(
      (v: { address: string; stake: bigint }) => v.address === address,
    );
    console.log(validator?.stake);
    if (validator) {
      setStakedAmount(fromNano(validator.stake));
    } else {
      setStakedAmount(null);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value.replace(/[^0-9.]/g, "");
    const amountNano = toNano(newAmount || "0");
    const maxAmount = toNano(stakedAmount ?? "0");

    if (amountNano > maxAmount) {
      setInputError((prev) => ({
        ...prev,
        value: "Amount exceeds maximum transferable amount",
      }));
    } else {
      setInputError((prev) => ({ ...prev, value: null }));
    }

    setAmount(newAmount);
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

    void removeStake({
      validator: recipient,
      amount,
      callback: handleCallback,
    });
  };

  const handleSelectValidator = (validator: { address: string }) => {
    setRecipient(validator.address);
    setCurrentView("wallet");
    setAmount("");
    const validatorData = stakedValidators.find(
      (v: { address: string; stake: bigint }) =>
        v.address === validator.address,
    );
    if (validatorData) {
      setStakedAmount(fromNano(validatorData.stake));
    } else {
      setStakedAmount(null);
    }
  };

  const formRef = useRef<HTMLFormElement>(null);
  const reviewData = [
    {
      label: "To",
      content: `${recipient ? smallAddress(recipient, 6) : "Recipient Address"}`,
    },
    { label: "Amount", content: `${amount ? amount : 0} TOR` },
  ];
  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      {currentView === "stakedValidators" ? (
        <ValidatorsList
          listType="staked"
          onSelectValidator={handleSelectValidator}
          onBack={() => setCurrentView("wallet")}
        />
      ) : (
        <Card className="w-full animate-fade p-6 md:w-3/5">
          <form
            onSubmit={handleSubmit}
            ref={formRef}
            className="flex w-full flex-col gap-6"
          >
            <div className="flex w-full flex-col gap-2">
              <Label htmlFor="unstake-recipient">Validator Address</Label>
              <div className="flex flex-row gap-2">
                <Input
                  id="unstake-recipient"
                  type="text"
                  value={recipient}
                  required
                  onChange={handleRecipientChange}
                  placeholder="Full validator address"
                  className="w-full border border-white/20 bg-[#898989]/5 p-2"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentView("stakedValidators")}
                  className="flex w-fit items-center px-6 py-2.5"
                >
                  Staked Validators
                </Button>
              </div>
              {inputError.recipient && (
                <span className="-mt-1 mb-1 flex text-left text-sm text-red-400">
                  {inputError.recipient}
                </span>
              )}
            </div>
            <div className="flex w-full flex-col gap-2">
              <Label htmlFor="unstake-amount">Value</Label>
              <div className="flex w-full flex-col gap-2">
                <Input
                  id="unstake-amount"
                  type="number"
                  value={amount}
                  min={0}
                  step={0.000000001}
                  required
                  onChange={handleAmountChange}
                  placeholder="Amount of TOR"
                  className="w-full p-2 disabled:cursor-not-allowed"
                  disabled={!recipient}
                />

                <AmountButtons
                  setAmount={setAmount}
                  availableFunds={stakedAmount ?? "0"}
                  disabled={!recipient || !stakedAmount}
                />
              </div>
              {inputError.value && (
                <p className="mb-1 mt-2 flex text-left text-base text-red-400">
                  {inputError.value}
                </p>
              )}
            </div>

            {transactionStatus.status && (
              <TransactionStatus
                status={transactionStatus.status}
                message={transactionStatus.message}
              />
            )}
          </form>
        </Card>
      )}
      {currentView !== "stakedValidators" && (
        <WalletTransactionReview
          disabled={
            transactionStatus.status === "PENDING" ||
            !amount ||
            !recipient ||
            (stakedAmount &&
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              amount > stakedAmount) ||
            !!inputError.value
          }
          formRef={formRef}
          reviewContent={reviewData}
        />
      )}
    </div>
  );
}
