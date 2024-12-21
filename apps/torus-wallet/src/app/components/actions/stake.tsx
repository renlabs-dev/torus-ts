"use client";

import React, { useMemo, useRef, useState } from "react";

import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { Button, Card, Input, Label, TransactionStatus } from "@torus-ts/ui";
import { formatToken, smallAddress, toNano } from "@torus-ts/utils/subspace";

import { useWallet } from "~/context/wallet-provider";
import { AmountButtons } from "../amount-buttons";
import { ValidatorsList } from "../validators-list";
import { WalletTransactionReview } from "../wallet-review";

export function StakeAction() {
  const { addStake, accountFreeBalance, stakeOut, accountStakedBy } =
    useWallet();
  const [amount, setAmount] = useState<string>("");
  const [recipient, setRecipient] = useState<string>("");
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

  const [currentView, setCurrentView] = useState<"wallet" | "validators">(
    "wallet",
  );

  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipient(e.target.value);
    setAmount("");
    setInputError({ recipient: null, value: null });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value.replace(/[^0-9.]/g, "");
    const amountNano = toNano(newAmount || "0");
    const maxAmountNano = toNano(maxAmount || "0");

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
      setInputError({ recipient: null, value: null });
    }
  };

  const refetchHandler = async () => {
    await Promise.all([
      stakeOut.refetch(),
      accountStakedBy.refetch(),
      accountFreeBalance.refetch(),
    ]);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const isValidInput = amount && recipient && !inputError.value;
    if (!isValidInput) return;

    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting transaction",
    });

    void addStake({
      validator: recipient,
      amount,
      callback: handleCallback,
      refetchHandler,
    });
  };

  const handleSelectValidator = (validator: { address: string }) => {
    setRecipient(validator.address);
    setCurrentView("wallet");
  };

  const maxAmount = useMemo(() => {
    const balance = accountFreeBalance.data ?? 0n;
    const adjustedErrorMargin = 1_000n; // 0.000001 TOR as error margin

    const maxAmount = balance - adjustedErrorMargin;
    return maxAmount > 0 ? formatToken(maxAmount) : "0";
  }, [accountFreeBalance.data]);

  const formRef = useRef<HTMLFormElement>(null);
  const reviewData = [
    {
      label: "To",
      content: `${recipient ? smallAddress(recipient, 6) : "Validator Address"}`,
    },
    { label: "Amount", content: `${amount ? amount : 0} TOR` },
  ];

  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      {currentView === "validators" ? (
        <ValidatorsList
          listType="all"
          onSelectValidator={handleSelectValidator}
          onBack={() => setCurrentView("wallet")}
        />
      ) : (
        <Card className="w-full animate-fade p-6 md:w-3/5">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="flex w-full flex-col gap-6"
          >
            <div className="flex w-full flex-col gap-2">
              <Label htmlFor="stake-recipient" className="text-base">
                Validator Address
              </Label>
              <div className="flex flex-row gap-2">
                <Input
                  id="stake-recipient"
                  type="text"
                  value={recipient}
                  required
                  onChange={handleRecipientChange}
                  placeholder="Full validator address"
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
                <span className="-mt-1 mb-1 flex text-left text-sm text-red-400">
                  {inputError.recipient}
                </span>
              )}
            </div>

            <div className="flex w-full flex-col gap-2">
              <Label htmlFor="stake-amount" className="text-base">
                Value
              </Label>
              <div className="flex w-full flex-col gap-2">
                <Input
                  id="stake-amount"
                  type="number"
                  value={amount}
                  required
                  onChange={handleAmountChange}
                  placeholder="Amount of TOR"
                  className="disabled:cursor-not-allowed"
                  disabled={!recipient}
                />

                <AmountButtons
                  setAmount={setAmount}
                  availableFunds={maxAmount}
                  disabled={!recipient}
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
      {currentView !== "validators" && (
        <WalletTransactionReview
          disabled={
            transactionStatus.status === "PENDING" ||
            !amount ||
            !recipient ||
            !!inputError.value
          }
          formRef={formRef}
          reviewContent={reviewData}
        />
      )}
    </div>
  );
}
