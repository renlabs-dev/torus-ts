"use client";

import React, { useRef, useState } from "react";

import type {
  TransactionResult,
  TransferStake,
} from "@torus-ts/torus-provider/types";
import { useTorus } from "@torus-ts/torus-provider";
import { TransactionStatus } from "@torus-ts/ui";
import { fromNano } from "@torus-ts/utils/subspace";

import { ValidatorsList } from "../validators-list";
import { WalletTransactionReview } from "../wallet-review";

export function TransferStakeAction() {
  const { userTotalStaked, transferStake } = useTorus();

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

    void transferStake({
      fromValidator,
      toValidator: recipient,
      amount,
      callback: handleCallback,
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

  const handleMaxClick = () => {
    if (maxAmount) {
      setAmount(maxAmount);
    }
  };

  function getSplittedAddress(address: string) {
    return splitAddress(address).map((addressPart) => {
      return (
        <span key={addressPart} className="pl-1 first:pl-0">
          {addressPart}
        </span>
      );
    });
  }

  const formRef = useRef<HTMLFormElement>(null);
  const reviewData = [
    { label: "Action", content: "Unstaking TOR" },
    { label: "From", content: getSplittedAddress(fromValidator) },
    { label: "To", content: getSplittedAddress(recipient) },
    { label: "Amount", content: `${amount} TOR` },
  ];

  return (
    <div className="l flex w-full flex-col gap-4 md:flex-row">
      <Card className="w-full animate-fade p-6 md:w-3/5">
        {(currentView === "validators" ||
          currentView === "stakedValidators") && (
          <ValidatorsList
            listType={currentView === "validators" ? "all" : "staked"}
            onSelectValidator={
              currentView === "stakedValidators"
                ? handleSelectFromValidator
                : handleSelectToValidator
            }
            onBack={() => setCurrentView("wallet")}
          />
        )}
        {currentView === "wallet" && (
          <form
            onSubmit={handleSubmit}
            ref={formRef}
            className="flex w-full flex-col gap-4"
          >
            <div className="w-full">
              <Label htmlFor="transfer-from">From Validator</Label>
              <div className="flex flex-row gap-2">
                <Input
                  id="transfer-from"
                  type="text"
                  value={fromValidator}
                  onChange={handleFromValidatorChange}
                  placeholder="The full address of the validator"
                  className="w-full p-2"
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
              {inputError.fromValidator && (
                <p className="-mt-2 mb-1 flex text-left text-base text-red-400">
                  {inputError.fromValidator}
                </p>
              )}
            </div>

            <div className="w-full">
              <Label htmlFor="transfer-to" className="text-base">
                To Validator
              </Label>
              <div className="flex flex-row gap-2">
                <Input
                  id="transfer-to"
                  type="text"
                  value={recipient}
                  required
                  onChange={handleRecipientChange}
                  placeholder="The full address of the validator"
                  className="w-full p-2"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentView("validators")}
                  className="flex w-fit items-center px-6 py-2.5"
                >
                  Validators
                </Button>
              </div>
              {inputError.recipient && (
                <p className="-mt-2 mb-1 flex text-left text-base text-red-400">
                  {inputError.recipient}
                </p>
              )}
            </div>

            <div className="w-full">
              <Label htmlFor="transfer-amount" className="text-base">
                Value
              </Label>
              <div className="flex w-full gap-2">
                <Input
                  id="transfer-amount"
                  type="number"
                  value={amount}
                  required
                  onChange={handleAmountChange}
                  placeholder="The amount of COMAI to transfer"
                  className="w-full p-2 disabled:cursor-not-allowed"
                  disabled={!fromValidator}
                />
                {maxAmount && (
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
          !fromValidator ||
          !!inputError.value
        }
        formRef={formRef}
        reviewContent={reviewData}
      />
    </div>
  );
}
