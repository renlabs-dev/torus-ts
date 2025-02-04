"use client";

import React, { useEffect, useRef, useState } from "react";

import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { Button, Card, Input, Label, TransactionStatus } from "@torus-ts/ui";
import { fromNano, smallAddress, toNano } from "@torus-ts/utils/subspace";

import { useWallet } from "~/context/wallet-provider";
import { AmountButtons } from "../amount-buttons";
import { ValidatorsList } from "../validators-list";
import { WalletTransactionReview } from "../wallet-review";
import { isSS58 } from "@torus-ts/subspace";
import { FeeLabel } from "../fee-label";

export function UnstakeAction() {
  const {
    accountFreeBalance,
    accountStakedBy,
    removeStake,
    selectedAccount,
    removeStakeTransaction,
    stakeOut,
    estimateFee,
  } = useWallet();

  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [estimatedFee, setEstimatedFee] = useState<string | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [enoughBalanceToUnstake, setEnoughBalanceToUnstake] =
    useState<boolean>(false);

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

  const stakedValidators = accountStakedBy.data ?? [];

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
      message: "Starting transaction...",
    });

    void removeStake({
      validator: recipient,
      amount,
      callback: handleCallback,
      refetchHandler,
    });
  };

  const handleEstimateFee = async (): Promise<bigint | undefined> => {
    if (!recipient) {
      setEstimatedFee(null);
      return;
    }

    if (!isSS58(recipient)) {
      setInputError((prev) => ({
        ...prev,
        recipient: "Invalid recipient address",
      }));
      return;
    }

    setIsEstimating(true);
    try {
      const transaction = removeStakeTransaction({
        validator: recipient,
        amount: "0",
      });
      if (!transaction) {
        setInputError((prev) => ({
          ...prev,
          recipient: "Invalid transaction",
        }));
        return;
      }
      const fee = await estimateFee(transaction);
      if (fee != null) {
        const adjustedFee = (fee * 100n) / 100n;

        setEstimatedFee(fromNano(adjustedFee));
        return adjustedFee;
      } else {
        setEstimatedFee(null);
      }
    } catch (error) {
      console.error("Error estimating fee:", error);
      setEstimatedFee(null);
    } finally {
      setIsEstimating(false);
    }
  };

  const checkEnoughBalanceToUnstake = (fee: bigint) => {
    const freeBalance = accountFreeBalance.data ?? 0n;
    const freeBalanceAfterFees = freeBalance - fee;

    if (freeBalanceAfterFees < 0n) {
      setInputError((prev) => ({
        ...prev,
        value: "Insufficient free balance to pay fees",
      }));
      setEnoughBalanceToUnstake(false);
    } else {
      setEnoughBalanceToUnstake(true);
    }
  };

  useEffect(() => {
    async function fetchFee() {
      await handleEstimateFee();
    }
    void fetchFee();
  }, [recipient]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    checkEnoughBalanceToUnstake(toNano(estimatedFee ?? "0"));
  }, [estimatedFee, accountFreeBalance.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const formRef = useRef<HTMLFormElement>(null);
  const reviewData = [
    {
      label: "From",
      content: `${recipient ? smallAddress(recipient, 6) : "From Address"}`,
    },
    { label: "Amount", content: `${amount ? amount : 0} TORUS` },
    {
      label: "Fee",
      content: `${amount && selectedAccount?.address ? `${estimatedFee} TORUS` : "-"}`,
    },
  ];

  useEffect(() => {
    setRecipient("");
    setAmount("");
    setInputError({ recipient: null, value: null });
  }, [selectedAccount?.address]);

  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      {currentView === "stakedValidators" ? (
        <ValidatorsList
          listType="staked"
          onSelectValidator={handleSelectValidator}
          onBack={() => setCurrentView("wallet")}
        />
      ) : (
        <Card className="w-full animate-fade p-6 md:w-3/5">
          <form
            onSubmit={handleSubmit}
            ref={formRef}
            className="flex w-full flex-col gap-6"
          >
            <div className="flex w-full flex-col gap-2">
              <Label htmlFor="unstake-recipient">Allocator Address</Label>
              <div className="flex flex-col gap-2 md:flex-row">
                <Input
                  id="unstake-recipient"
                  type="text"
                  value={recipient}
                  required
                  onChange={handleRecipientChange}
                  disabled={!selectedAccount?.address}
                  placeholder="Full Allocator address"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={!selectedAccount?.address}
                  onClick={() => setCurrentView("stakedValidators")}
                >
                  Staked Allocators
                </Button>
              </div>
              {inputError.recipient && (
                <span className="-mt-1 mb-1 flex text-left text-sm text-red-400">
                  {inputError.recipient}
                </span>
              )}
            </div>
            <div className="flex w-full flex-col gap-2">
              <Label htmlFor="unstake-amount">Value</Label>
              <div className="flex w-full flex-col gap-2">
                <Input
                  id="unstake-amount"
                  type="number"
                  value={amount}
                  min={0}
                  step={0.000000000000000001}
                  required
                  onChange={handleAmountChange}
                  placeholder="Amount of TORUS"
                  className="w-full p-2 disabled:cursor-not-allowed"
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
            <FeeLabel
              estimatedFee={estimatedFee}
              isEstimating={isEstimating}
              accountConnected={!!selectedAccount}
            />

            {transactionStatus.status && (
              <TransactionStatus
                status={transactionStatus.status}
                message={transactionStatus.message}
              />
            )}
          </form>
        </Card>
      )}
      {currentView !== "stakedValidators" && (
        <WalletTransactionReview
          disabled={
            transactionStatus.status === "PENDING" ||
            !amount ||
            !recipient ||
            toNano(amount) > toNano(stakedAmount ?? "0") ||
            !!inputError.value
            // TODO FIX THIS CONDITION: !enoughBalanceToUnstake
          }
          formRef={formRef}
          reviewContent={reviewData}
        />
      )}
    </div>
  );
}
