"use client";

import React, { useState } from "react";

import type { Stake, TransactionResult } from "@torus-ts/providers/types";
import { useTorus } from "@torus-ts/providers/use-torus";
import { fromNano } from "@torus-ts/utils";
import { TransactionStatus } from "@torus-ts/ui";

import type { GenericActionProps } from "../wallet-actions";
import { ValidatorsList } from "../../validators-list";

export function UnstakeAction(
  props: {
    removeStake: (stake: Stake) => Promise<void>;
  } & GenericActionProps,
) {
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
  const { userTotalStaked } = useTorus();

  const stakedValidators = userTotalStaked ?? [];

  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setRecipient(address);
    setAmount("");
    setInputError({ recipient: null, value: null });
    const validator = stakedValidators.find(
      (v: { address: string; stake: string }) => v.address === address,
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

    const handleCallback = (callbackReturn: TransactionResult) => {
      setTransactionStatus(callbackReturn);
    };

    const isValidInput = amount && recipient && !inputError.value;

    if (!isValidInput) return;

    void props.removeStake({
      validator: recipient,
      amount,
      callback: handleCallback,
    });
  };

  const handleSelectValidator = (validator: { address: string }) => {
    setRecipient(validator.address);
    setCurrentView("wallet");
    const validatorData = stakedValidators.find(
      (v: { address: string; stake: string }) =>
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

  return (
    <>
      {currentView === "stakedValidators" ? (
        <ValidatorsList
          listType="staked"
          onSelectValidator={handleSelectValidator}
          onBack={() => setCurrentView("wallet")}
          userAddress={props.selectedAccount.address}
        />
      ) : (
        <div className="mt-4 w-full">
          <form
            onSubmit={handleSubmit}
            className="flex w-full animate-fade-down flex-col gap-4 pt-4"
          >
            <div className="w-full">
              <span className="text-base">Validator Address</span>
              <div className="flex flex-row gap-3">
                <input
                  type="text"
                  value={recipient}
                  required
                  onChange={handleRecipientChange}
                  placeholder="The full address of the validator"
                  className="w-full border border-white/20 bg-[#898989]/5 p-2"
                />
                <button
                  type="button"
                  onClick={() => setCurrentView("stakedValidators")}
                  className="flex w-fit items-center text-nowrap border border-green-500 bg-green-600/5 px-6 py-2.5 font-semibold text-green-500 transition duration-200 hover:border-green-400 hover:bg-green-500/15"
                >
                  Staked Validators
                </button>
              </div>
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
                  required
                  onChange={handleAmountChange}
                  placeholder="The amount of COMAI to unstake"
                  className="w-full border border-white/20 bg-[#898989]/5 p-2 disabled:cursor-not-allowed disabled:border-gray-600/50 disabled:text-gray-600/50 disabled:placeholder:text-gray-600/50"
                  disabled={!recipient}
                />
                {stakedAmount && (
                  <button
                    type="button"
                    onClick={handleMaxClick}
                    className="ml-2 whitespace-nowrap border border-blue-500 bg-blue-600/5 px-4 py-2 font-semibold text-blue-500 transition duration-200 hover:border-blue-400 hover:bg-blue-500/15"
                  >
                    Max
                  </button>
                )}
              </div>
              {inputError.value && (
                <p className="mb-1 mt-2 flex text-left text-base text-red-400">
                  {inputError.value}
                </p>
              )}
            </div>
            <div className="mt-4 border-t border-white/20 pt-4">
              <button
                type="submit"
                disabled={
                  transactionStatus.status === "PENDING" ||
                  !amount ||
                  !recipient ||
                  (stakedAmount &&
                    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                    amount > stakedAmount) ||
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
      )}
    </>
  );
}
