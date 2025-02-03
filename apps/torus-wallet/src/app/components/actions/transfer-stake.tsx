"use client";

import React, { useEffect, useRef, useState } from "react";

import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { Button, Card, Input, Label, TransactionStatus } from "@torus-ts/ui";
import { fromNano, smallAddress, toNano } from "@torus-ts/utils/subspace";

import { useWallet } from "~/context/wallet-provider";
import { AmountButtons } from "../amount-buttons";
import { ValidatorsList } from "../validators-list";
import { WalletTransactionReview } from "../wallet-review";

export function TransferStakeAction() {
  const { accountStakedBy, transferStake, selectedAccount } = useWallet();

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

  const stakedValidators = accountStakedBy.data ?? [];

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
    const recipientAddress = e.target.value;
    setRecipient(recipientAddress);
    return setInputError((prev) => ({ ...prev, recipient: null }));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value.replace(/[^0-9.]/g, "");
    const amountNano = toNano(newAmount || "0");
    const maxAmountNano = toNano(maxAmount ?? "0");

    if (amountNano > maxAmountNano) {
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
    if (callbackReturn.status === "SUCCESS") {
      setAmount("");
      setRecipient("");
      setFromValidator("");

      setInputError({ recipient: null, value: null, fromValidator: null });
    }
  };

  const refetchHandler = async () => {
    await accountStakedBy.refetch();
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const isValidInput =
      amount &&
      recipient &&
      fromValidator &&
      !inputError.value &&
      !inputError.fromValidator &&
      !inputError.recipient &&
      recipient !== fromValidator;

    if (!isValidInput) return;

    void transferStake({
      fromValidator,
      toValidator: recipient,
      amount,
      callback: handleCallback,
      refetchHandler,
    });
  };

  const handleSelectFromValidator = (validator: { address: string }) => {
    setFromValidator(validator.address);
    setCurrentView("wallet");
    setAmount("");

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

  const formRef = useRef<HTMLFormElement>(null);
  const reviewData = [
    {
      label: "From",
      content: `${fromValidator ? smallAddress(fromValidator, 6) : "From Address"}`,
    },
    {
      label: "To",
      content: `${recipient ? smallAddress(recipient, 6) : "To Address"}`,
    },
    { label: "Amount", content: `${amount ? amount : 0} TORUS` },
  ];

  useEffect(() => {
    if (recipient.length > 0 && recipient === fromValidator) {
      return setInputError((prev) => ({
        ...prev,
        recipient: "Recipient cannot be the same as the sender",
      }));
    }
  }, [fromValidator, recipient]);

  useEffect(() => {
    setRecipient("");
    setFromValidator("");
    setAmount("");
    setInputError({ recipient: null, value: null, fromValidator: null });
  }, [selectedAccount?.address]);

  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      {(currentView === "validators" || currentView === "stakedValidators") && (
        <ValidatorsList
          listType={currentView === "validators" ? "all" : "staked"}
          excludeAddress={[fromValidator]}
          onSelectValidator={
            currentView === "stakedValidators"
              ? handleSelectFromValidator
              : handleSelectToValidator
          }
          onBack={() => setCurrentView("wallet")}
        />
      )}
      {currentView === "wallet" && (
        <Card className="w-full animate-fade p-6 md:w-3/5">
          <form
            onSubmit={handleSubmit}
            ref={formRef}
            className="flex w-full flex-col gap-6"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="transfer-from">From Allocator</Label>
              <div className="flex flex-row gap-2">
                <Input
                  id="transfer-from"
                  type="text"
                  value={fromValidator}
                  onChange={handleFromValidatorChange}
                  placeholder="Full Allocator address"
                  className="w-full p-2"
                  disabled={!selectedAccount?.address}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentView("stakedValidators")}
                  className="flex w-fit items-center px-6 py-2.5"
                  disabled={!selectedAccount?.address}
                >
                  Staked Allocators
                </Button>
              </div>
              {inputError.fromValidator && (
                <span className="-mt-1 mb-1 flex text-left text-sm text-red-400">
                  {inputError.fromValidator}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="transfer-to" className="text-base">
                To Allocator
              </Label>
              <div className="flex flex-row gap-2">
                <Input
                  id="transfer-to"
                  type="text"
                  value={recipient}
                  required
                  onChange={handleRecipientChange}
                  placeholder="Full Allocator address"
                  disabled={!selectedAccount?.address}
                  className="w-full p-2"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={!selectedAccount?.address}
                  onClick={() => setCurrentView("validators")}
                  className="flex w-fit items-center px-6 py-2.5"
                >
                  Allocators
                </Button>
              </div>
              {inputError.recipient && (
                <span className="-mt-1 mb-1 flex text-left text-sm text-red-400">
                  {inputError.recipient}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="transfer-amount" className="text-base">
                Value
              </Label>
              <div className="flex w-full flex-col gap-2">
                <Input
                  id="transfer-amount"
                  type="number"
                  value={amount}
                  min={0}
                  step={0.000000001}
                  required
                  onChange={handleAmountChange}
                  placeholder="Amount of TORUS"
                  className="w-full p-2 disabled:cursor-not-allowed"
                  disabled={
                    !fromValidator || !recipient || recipient === fromValidator
                  }
                />

                <AmountButtons
                  setAmount={setAmount}
                  availableFunds={maxAmount ?? "0"}
                  disabled={
                    !fromValidator || !maxAmount || recipient === fromValidator
                  }
                />
              </div>
              {inputError.value && (
                <span className="-mt-1 mb-1 flex text-left text-sm text-red-400">
                  {inputError.value}
                </span>
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
      {currentView === "wallet" && (
        <WalletTransactionReview
          disabled={
            transactionStatus.status === "PENDING" ||
            !amount ||
            !recipient ||
            !fromValidator ||
            !!inputError.value ||
            recipient === fromValidator
          }
          formRef={formRef}
          reviewContent={reviewData}
        />
      )}
    </div>
  );
}
