"use client";

import { fromNano } from "@torus-ts/subspace/utils";
import { TransactionStatus } from "@torus-ts/ui";
import { ValidatorsList } from "../../validators-list";
import React, { useState } from "react";
import type { GenericActionProps } from "../wallet-actions";
import type { Stake, TransactionResult } from "@torus-ts/providers/types";

export function StakeAction(props: {
  addStake: (stake: Stake) => Promise<void>;
} & GenericActionProps) {
  const [amount, setAmount] = useState<string>("");
  const [recipient, setRecipient] = useState<string>("");
  const [inputError, setInputError] = useState<{
    recipient: string | null;
    value: string | null;
  }>({
    recipient: null,
    value: null,
  });

  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>({
    status: null,
    message: null,
    finalized: false,
  });

  const [currentView, setCurrentView] = useState<"wallet" | "validators">("wallet");

  const freeBalance = fromNano(props.balance?.toString() ?? "0");

  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipient(e.target.value);
    setAmount("");
    setInputError({ recipient: null, value: null });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    if (Number(newAmount) > Number(freeBalance)) {
      setInputError((prev) => ({
        ...prev,
        value: "Amount exceeds your free balance",
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

    void props.addStake({ validator: recipient, amount, callback: handleCallback });
  };

  const handleSelectValidator = (validator: { address: string }) => {
    setRecipient(validator.address);
    setCurrentView("wallet");
  };

  const handleMaxClick = () => {
    setAmount((Number(freeBalance) - 0.000_001).toString());
  };

  return (
    <>
      {currentView === "validators" ? (
        <ValidatorsList
          listType="all"
          onSelectValidator={handleSelectValidator}
          onBack={() => setCurrentView("wallet")}
          userAddress={props.selectedAccount.address}
        />
      ) : (
        <div className="w-full mt-4">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col w-full gap-4 pt-4 animate-fade-down"
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
                  onClick={() => setCurrentView("validators")}
                  className="flex w-fit items-center text-nowrap border border-green-500 bg-green-600/5 px-6 py-2.5 font-semibold text-green-500 transition duration-200 hover:border-green-400 hover:bg-green-500/15"
                >
                  Validators
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
                  placeholder="The amount of COMAI to stake"
                  className="w-full border border-white/20 bg-[#898989]/5 p-2 disabled:cursor-not-allowed disabled:border-gray-600/50 disabled:text-gray-600/50 disabled:placeholder:text-gray-600/50"
                  disabled={!recipient}
                />
                <button
                  type="button"
                  onClick={handleMaxClick}
                  className="px-4 py-2 ml-2 font-semibold text-blue-500 transition duration-200 border border-blue-500 whitespace-nowrap bg-blue-600/5 hover:border-blue-400 hover:bg-blue-500/15 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:bg-transparent disabled:hover:border-gray-600/50 disabled:border-gray-600/50 disabled:text-gray-600/50"
                  disabled={!recipient}
                >
                  Max
                </button>
              </div>
              {inputError.value && (
                <p className="flex mb-1 mt-2 text-base text-left text-red-400">
                  {inputError.value}
                </p>
              )}
            </div>
            <div className="pt-4 mt-4 border-t border-white/20">
              <button
                type="submit"
                disabled={
                  transactionStatus.status === "PENDING" ||
                  !amount ||
                  !recipient ||
                  !!inputError.value
                }
                className="flex w-full justify-center text-nowrap border disabled:border-gray-600/50 disabled:text-gray-600/50  disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:bg-transparent border-green-500 bg-green-600/5 px-6 py-2.5 font-semibold text-green-500 transition duration-200 hover:border-green-400 hover:bg-green-500/15"
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
