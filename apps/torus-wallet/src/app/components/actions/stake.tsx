"use client";

import React, { useMemo, useRef, useState } from "react";
import { BN } from "@polkadot/util";

import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { useTorus } from "@torus-ts/torus-provider";
import { Button, Card, Input, Label, TransactionStatus } from "@torus-ts/ui";
import { fromNano, smallAddress, toNano } from "@torus-ts/utils/subspace";

import { AmountButtons } from "../amount-buttons";
import { ValidatorsList } from "../validators-list";
import { WalletTransactionReview } from "../wallet-review";

export function StakeAction() {
  const { addStake, balance } = useTorus();
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

  const freeBalance = fromNano(balance?.toString() ?? "0");

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

    void addStake({
      validator: recipient,
      amount,
      callback: handleCallback,
    });
  };

  const handleSelectValidator = (validator: { address: string }) => {
    setRecipient(validator.address);
    setCurrentView("wallet");
  };

  const maxAmount = useMemo(() => {
    const balanceBn = new BN(toNano(freeBalance));
    const adjustedErrorMargin = new BN(toNano(0.000_001));
    const maxAmountBN = balanceBn.sub(adjustedErrorMargin);
    return maxAmountBN.isNeg() ? "0" : fromNano(maxAmountBN.toString());
  }, [freeBalance]);

  // const handleMaxClick = () => {
  //   setAmount(maxAmount.toString());
  // };

  const formRef = useRef<HTMLFormElement>(null);
  const reviewData = [
    {
      label: "To",
      content: `${recipient ? smallAddress(recipient, 6) : "Validator Address"}`,
    },
    { label: "Amount", content: `${amount ? amount : 0} TOR` },
  ];

  // function MaxAmountLabel() {
  //   if (freeBalance && recipient) {
  //     return (
  //       <span>
  //         Maximum transferable amount:{" "}
  //         <Button
  //           variant="link"
  //           type="button"
  //           onClick={handleMaxClick}
  //           className="m-0 h-5 p-0 text-sm text-primary"
  //         >
  //           {Number(freeBalance) - 0.000_001} TOR
  //         </Button>
  //       </span>
  //     );
  //   }
  //   return (
  //     <span className="flex gap-2">Maximum transferable amount: 0 TOR</span>
  //   );
  // }

  return (
    <div className="l flex w-full flex-col gap-4 md:flex-row">
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
                  placeholder="The full address of the validator"
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
                  placeholder="The amount of COMAI to stake"
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
                <p className="mb-1 mt-2 flex text-left text-base text-red-400">
                  {inputError.value}
                </p>
              )}
            </div>

            {/* <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
              <MaxAmountLabel />
            </div> */}

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
