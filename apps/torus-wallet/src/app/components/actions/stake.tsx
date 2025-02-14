"use client";

import { isSS58 } from "@torus-ts/subspace";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { Button, Card, Input, Label, TransactionStatus } from "@torus-ts/ui";
import {
  formatToken,
  fromNano,
  smallAddress,
  toNano,
} from "@torus-ts/utils/subspace";
import React, { useEffect, useRef, useState } from "react";

import { useWallet } from "~/context/wallet-provider";

import { AmountButtons } from "../amount-buttons";
import { FeeLabel } from "../fee-label";
import { ValidatorsList } from "../validators-list";
import { WalletTransactionReview } from "../wallet-review";

const MIN_ALLOWED_STAKE_SAFEGUARD = 500000000000000000n;
const MIN_EXISTENCIAL_BALANCE = 100000000000000000n;
const FEE_BUFFER_PERCENT = 202n;

export function StakeAction() {
  const {
    addStake,
    accountFreeBalance,
    stakeOut,
    accountStakedBy,
    selectedAccount,
    addStakeTransaction,
    estimateFee,
    getExistencialDeposit,
    minAllowedStake,
  } = useWallet();

  const [amount, setAmount] = useState<string>("");
  const [recipient, setRecipient] = useState<string>("");
  const [estimatedFee, setEstimatedFee] = useState<string | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  const minAllowedStakeData =
    minAllowedStake.data ?? MIN_ALLOWED_STAKE_SAFEGUARD;

  const [maxAmount, setMaxAmount] = useState<string>("");
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

  const existencialDepositValue =
    getExistencialDeposit() ?? MIN_EXISTENCIAL_BALANCE;

  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipient(e.target.value);
    setAmount("");
    setEstimatedFee(null);
    setMaxAmount("");
    setInputError({ recipient: null, value: null });
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

    if (!amount || !recipient || inputError.value || inputError.recipient)
      return;

    const stakeAmount = toNano(amount);
    if (stakeAmount <= 0n) return;

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

  const handleEstimateFee = async (): Promise<bigint | undefined> => {
    if (!recipient) {
      setEstimatedFee(null);
      setMaxAmount("");
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
      const transaction = addStakeTransaction({
        validator: recipient,
        amount: "1", // placeholder amount for estimation
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
        // Add buffer for safety
        const adjustedFee = (fee * FEE_BUFFER_PERCENT) / 100n;
        setEstimatedFee(fromNano(adjustedFee));
        return adjustedFee;
      } else {
        setEstimatedFee(null);
        setMaxAmount("");
      }
    } catch (error) {
      console.error("Error estimating fee:", error);
      setEstimatedFee(null);
      setMaxAmount("");
    } finally {
      setIsEstimating(false);
    }
  };

  const handleUpdateMaxAmount = (fee: bigint | undefined) => {
    if (!fee) return;

    const freeBalance = accountFreeBalance.data ?? 0n;

    const maxAmountRaw = freeBalance - fee - existencialDepositValue;
    const safeMax = maxAmountRaw > 0n ? maxAmountRaw : 0n;

    setMaxAmount(fromNano(safeMax));

    const userAmount = toNano(amount || "0");
    if (userAmount > safeMax) {
      setInputError((prev) => ({
        ...prev,
        value: "Amount exceeds maximum stakable amount",
      }));
    } else {
      setInputError((prev) => ({ ...prev, value: null }));
    }
  };

  const handleAmountChange = (amount: string) => {
    const newAmountStr = amount.replace(/[^0-9.]/g, "");
    setAmount(newAmountStr);

    const maxAmountNano = toNano(maxAmount || "0");
    const userAmount = toNano(newAmountStr || "0");

    const stakeAmount = toNano(newAmountStr);
    if (stakeAmount <= 0n) return;

    if (stakeAmount < minAllowedStakeData) {
      setInputError((prev) => ({
        ...prev,
        value: `You must stake at least ${formatToken(minAllowedStakeData)} TORUS`,
      }));
      return;
    }

    const freeBalance = accountFreeBalance.data ?? 0n;
    const rawFee = estimatedFee ? toNano(estimatedFee) : 0n;

    const newFreeBalance = freeBalance - stakeAmount - rawFee;
    if (newFreeBalance < existencialDepositValue) {
      setInputError((prev) => ({
        ...prev,
        value: `This amount would go below the existential deposit (${formatToken(
          existencialDepositValue,
        )} TORUS). Reduce the stake or top up your balance.`,
      }));
      return;
    }

    if (userAmount > maxAmountNano) {
      setInputError((prev) => ({
        ...prev,
        value: "Amount exceeds maximum stakable balance",
      }));
    } else {
      setInputError((prev) => ({
        ...prev,
        value: null,
      }));
    }
  };

  useEffect(() => {
    async function fetchFeeAndMax() {
      const fee = await handleEstimateFee();
      handleUpdateMaxAmount(fee);
    }
    void fetchFeeAndMax();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipient]);

  useEffect(() => {
    setRecipient("");
    setAmount("");
    setMaxAmount("");
    setEstimatedFee(null);
    setInputError({ recipient: null, value: null });
  }, [selectedAccount?.address]);

  const reviewData = [
    {
      label: "To",
      content: `${recipient ? smallAddress(recipient, 6) : "Allocator Address"}`,
    },
    { label: "Amount", content: `${amount ? amount : 0} TORUS` },
    {
      label: "Fee",
      content: `${amount && selectedAccount?.address ? `${estimatedFee} TORUS` : "-"}`,
    },
  ];

  const formRef = useRef<HTMLFormElement>(null);

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
                Allocator Address
              </Label>
              <div className="flex flex-row gap-2">
                <Input
                  id="stake-recipient"
                  type="text"
                  value={recipient}
                  required
                  onChange={handleRecipientChange}
                  placeholder="Full Allocator address"
                  disabled={!selectedAccount?.address || isEstimating}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={!selectedAccount?.address || isEstimating}
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

            <div className="flex w-full flex-col gap-2">
              <Label htmlFor="stake-amount" className="text-base">
                Value
              </Label>
              <div className="flex w-full flex-col gap-2">
                <Input
                  id="stake-amount"
                  type="number"
                  value={amount}
                  min={fromNano(minAllowedStakeData)}
                  step={0.000000000000000001}
                  required
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="Amount of TORUS"
                  className="disabled:cursor-not-allowed"
                  disabled={!recipient || isEstimating}
                />
                <AmountButtons
                  setAmount={handleAmountChange}
                  availableFunds={maxAmount}
                  disabled={!recipient || isEstimating}
                />
              </div>
              {inputError.value && (
                <span className="-mt-1 mb-1 flex text-left text-sm text-red-400">
                  {inputError.value}
                </span>
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

      {currentView !== "validators" && (
        <WalletTransactionReview
          disabled={
            transactionStatus.status === "PENDING" ||
            !amount ||
            !recipient ||
            isEstimating ||
            !!inputError.value ||
            !!inputError.recipient
          }
          formRef={formRef}
          reviewContent={reviewData}
        />
      )}
    </div>
  );
}
