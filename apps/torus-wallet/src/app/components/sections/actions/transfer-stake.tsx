"use client";

import React, { useState } from "react";

import type {
  TransactionResult,
  TransferStake,
} from "@torus-ts/providers/types";
import { useTorus } from "@torus-ts/providers/use-torus";
import { fromNano } from "@torus-ts/utils";
import { TransactionStatus } from "@torus-ts/ui";

import type { GenericActionProps } from "../wallet-actions";
import { ValidatorsList } from "../../validators-list";

export function TransferStakeAction(
  props: {
    transferStake: (transfer: TransferStake) => Promise<void>;
  } & GenericActionProps,
) {
  const [amount, setAmount] = useState<string>("");
  const [fromValidator, setFromValidator] = useState<string>("");
  const [recipient, setRecipient] = useState<string>("");
  const [inputError, setInputError] = useState<{
    fromValidator: string | null;
    recipient: string | null;
    value: string | null;
  }>({
    fromValidator: null,
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

  const [currentView, setCurrentView] = useState<
    "wallet" | "validators" | "stakedValidators"
  >("wallet");

  const [maxAmount, setMaxAmount] = useState<string | null>(null);
  const { userTotalStaked } = useTorus();

  const stakedValidators = userTotalStaked ?? [];

  const handleFromValidatorChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const address = e.target.value;
    setFromValidator(address);
    setAmount("");
    setInputError((prev) => ({ ...prev, fromValidator: null, value: null }));

    const validator = stakedValidators.find(
      (v: { address: string; stake: bigint }) => v.address === address,
    );
    if (validator) {
      const stakedAmount = fromNano(validator.stake);
      setMaxAmount(stakedAmount);
    } else {
      setMaxAmount(null);
    }
  };

  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipient(e.target.value);
    setInputError((prev) => ({ ...prev, recipient: null }));
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const handleCallback = (callbackReturn: TransactionResult) => {
      setTransactionStatus(callbackReturn);
    };

    const isValidInput =
      amount &&
      recipient &&
      fromValidator &&
      !inputError.value &&
      !inputError.fromValidator &&
      !inputError.recipient;

    if (!isValidInput) return;

    void props.transferStake({
      fromValidator,
      toValidator: recipient,
      amount,
      callback: handleCallback,
    });
  };

  const handleSelectFromValidator = (validator: { address: string }) => {
    setFromValidator(validator.address);
    setCurrentView("wallet");
    const validatorData = stakedValidators.find(
      (v: { address: string; stake: bigint }) =>
        v.address === validator.address,
    );
    if (validatorData) {
      const stakedAmount = fromNano(validatorData.stake);
      setMaxAmount(stakedAmount);
    } else {
      setMaxAmount(null);
    }
  };

  const handleSelectToValidator = (validator: { address: string }) => {
    setRecipient(validator.address);
    setCurrentView("wallet");
  };

  const handleMaxClick = () => {
    if (maxAmount) {
      setAmount(maxAmount);
    }
  };

  return (
    <>
      {(currentView === "validators" || currentView === "stakedValidators") && (
        <ValidatorsList
          listType={currentView === "validators" ? "all" : "staked"}
          onSelectValidator={
            currentView === "stakedValidators"
              ? handleSelectFromValidator
              : handleSelectToValidator
          }
          onBack={() => setCurrentView("wallet")}
          userAddress={props.selectedAccount.address}
        />
      )}
      {currentView === "wallet" && (
        <div className="mt-4 w-full">
          <form
            onSubmit={handleSubmit}
            className="flex w-full animate-fade-down flex-col gap-4 pt-4"
          >
            <div className="w-full">
              <p className="text-base">From Validator</p>
              <div className="flex flex-row gap-3">
                <input
                  type="text"
                  value={fromValidator}
                  onChange={handleFromValidatorChange}
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
              {inputError.fromValidator && (
                <p className="-mt-2 mb-1 flex text-left text-base text-red-400">
                  {inputError.fromValidator}
                </p>
              )}
            </div>

            <div className="w-full">
              <span className="text-base">To Validator</span>
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
                  placeholder="The amount of COMAI to transfer"
                  className="w-full border border-white/20 bg-[#898989]/5 p-2 disabled:cursor-not-allowed disabled:border-gray-600/50 disabled:text-gray-600/50 disabled:placeholder:text-gray-600/50"
                  disabled={!fromValidator}
                />
                {maxAmount && (
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
                  !fromValidator ||
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
