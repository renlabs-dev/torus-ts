"use client";

import React, { useRef, useState } from "react";

import type { Stake, TransactionResult } from "@torus-ts/torus-provider/types";
import { useTorus } from "@torus-ts/providers/use-torus";
import { Button, Card, Input, Label, TransactionStatus } from "@torus-ts/ui";
import { fromNano, smallAddress } from "@torus-ts/utils/subspace";

import { ValidatorsList } from "../validators-list";
import { WalletTransactionReview } from "../wallet-review";

export function UnstakeAction() {
  const { userTotalStaked } = useTorus();

  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [inputError, setInputError] = useState<{
    recipient: string | null;
    value: string | null;
  }>({
    recipient: null,
    value: null,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const stakedValidators = userTotalStaked ?? [];

  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setRecipient(address);
    setAmount("");
    setInputError({ recipient: null, value: null });
    const validator = stakedValidators.find(
      (v: { address: string; stake: bigint }) => v.address === address,
    );
    if (validator) {
      setStakedAmount(fromNano(validator.stake));
    } else {
      setStakedAmount(null);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    if (stakedAmount && Number(newAmount) > Number(stakedAmount)) {
      setInputError((prev) => ({
        ...prev,
        value: "Amount exceeds staked amount for this validator",
      }));
    } else {
      setInputError((prev) => ({ ...prev, value: null }));
    }
    setAmount(newAmount);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // const handleCallback = (callbackReturn: TransactionResult) => {
    //   setTransactionStatus(callbackReturn);
    // };

    // const isValidInput = amount && recipient && !inputError.value;

    // if (!isValidInput) return;

    // void removeStake({
    //   validator: recipient,
    //   amount,
    //   callback: handleCallback,
    // });
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

  const handleMaxClick = () => {
    if (stakedAmount) {
      setAmount(stakedAmount);
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
    <div className="l flex w-full flex-col gap-4 md:flex-row">
      <Card className="w-full animate-fade p-6 md:w-3/5">
        {currentView === "stakedValidators" ? (
          <ValidatorsList
            listType="staked"
            onSelectValidator={handleSelectValidator}
            onBack={() => setCurrentView("wallet")}
          />
        ) : (
          <form
            onSubmit={handleSubmit}
            ref={formRef}
            className="flex w-full flex-col gap-4"
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
                  placeholder="The full address of the validator"
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
                <span className="text-red-400">{inputError.recipient}</span>
              )}
            </div>
            <div className="flex w-full flex-col gap-2">
              <Label htmlFor="unstake-amount">Value</Label>
              <div className="flex w-full gap-2">
                <Input
                  id="unstake-amount"
                  type="number"
                  value={amount}
                  min={0}
                  required
                  onChange={handleAmountChange}
                  placeholder="The amount of COMAI to unstake"
                  className="w-full p-2 disabled:cursor-not-allowed"
                  disabled={!recipient}
                />
                {stakedAmount && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleMaxClick}
                    className="px-4 py-2"
                  >
                    Max
                  </Button>
                )}
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
        )}
      </Card>
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
    </div>
  );
}
