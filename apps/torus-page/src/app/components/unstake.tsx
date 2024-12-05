"use client";

import React, { useState } from "react";

import type {
  InjectedAccountWithMeta,
  Stake,
  TransactionResult,
} from "@torus-ts/ui/types";
import { useTorus } from "@torus-ts/providers/use-torus";
import { Button, Input, TransactionStatus } from "@torus-ts/ui";
import { fromNano } from "@torus-ts/utils/subspace";

import { ValidatorsList } from "./validators-list";

export interface GenericActionProps {
  balance: bigint | undefined;
  selectedAccount: InjectedAccountWithMeta;
  userStakeWeight: bigint | null;
}

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
    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting transaction",
    });

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
        <div className="w-full">
          <form
            onSubmit={handleSubmit}
            className="flex w-full animate-fade-down flex-col gap-4 pt-4"
          >
            <div className="w-full">
              <div className="flex flex-row gap-3">
                <Input
                  type="text"
                  value={recipient}
                  required
                  onChange={handleRecipientChange}
                  placeholder="Validador address"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentView("stakedValidators")}
                >
                  Staked Validators
                </Button>
              </div>
              {inputError.recipient && (
                <p className="-mt-2 mb-1 flex text-left text-base text-red-400">
                  {inputError.recipient}
                </p>
              )}
            </div>
            <div className="w-full">
              <div className="flex w-full gap-1">
                <Input
                  type="number"
                  value={amount}
                  required
                  onChange={handleAmountChange}
                  placeholder="The amount of COMAI to unstake"
                  disabled={!recipient}
                />
                {stakedAmount && (
                  <Button
                    type="button"
                    onClick={handleMaxClick}
                    variant="outline"
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

            <Button
              type="submit"
              disabled={
                transactionStatus.status === "PENDING" ||
                !amount ||
                !recipient ||
                !stakedAmount ||
                // (stakedAmount &&
                //   // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                //   amount > stakedAmount) ||
                !!inputError.value
              }
            >
              Start Transaction
            </Button>
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
