"use client";

import React, { useEffect, useState } from "react";

import type { InjectedAccountWithMeta } from "@torus-ts/torus-provider";
import type { Stake, TransactionResult } from "@torus-ts/torus-provider/types";
import { Button, Input, TransactionStatus } from "@torus-ts/ui";
import { formatToken, fromNano, toNano } from "@torus-ts/utils/subspace";

import { usePage } from "~/context/page-provider";
import { ValidatorsList } from "./validators-list";
import { AmountButtons } from "./amount-buttons";

export interface GenericActionProps {
  balance: bigint | undefined;
  selectedAccount: InjectedAccountWithMeta;
  userStakeWeight: bigint | undefined;
}

export function UnstakeAction(
  props: {
    removeStake: (stake: Stake) => Promise<void>;
  } & GenericActionProps,
) {
  const { accountStakingTo, accountFreeBalance, stakeOut, selectedAccount } =
    usePage();

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

  const stakedValidators = accountStakingTo.data ?? [];

  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setRecipient(address);
    setAmount("");
    setInputError({ recipient: null, value: null });
    const validator = stakedValidators.find(
      (v: { address: string; stake: bigint }) => v.address === address,
    );
    if (validator) {
      setStakedAmount(formatToken(validator.stake));
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

  const refetchHandler = async () => {
    await Promise.all([
      accountFreeBalance.refetch(),
      accountStakingTo.refetch(),
      stakeOut.refetch(),
    ]);
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
      refetchHandler,
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

  useEffect(() => {
    setRecipient("");
    setAmount("");
    setInputError({ recipient: null, value: null });
  }, [selectedAccount?.address]);

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
            className={
              "flex w-full animate-fade-down flex-col gap-4 px-0.5 pt-4"
            }
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
            {transactionStatus.status && (
              <TransactionStatus
                status={transactionStatus.status}
                message={transactionStatus.message}
              />
            )}
          </form>
        </div>
      )}
    </>
  );
}
