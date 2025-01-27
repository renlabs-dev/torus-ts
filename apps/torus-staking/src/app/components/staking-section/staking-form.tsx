"use client";

import React, { useEffect, useRef, useState } from "react";
import { isSS58 } from "@torus-ts/subspace";
import { Card, Input, Label, TransactionStatus } from "@torus-ts/ui";
import {
  formatToken,
  fromNano,
  smallAddress,
  toNano,
} from "@torus-ts/utils/subspace";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { AmountButtons } from "./amount-buttons";
import { FeeLabel } from "./fee-label";
import { WalletTransactionReview } from "./wallet-review";
import { ValidatorsList } from "./validators-list";
import { useWallet } from "@torus-ts/features/context/wallet-provider";
import { APRDisplay } from "@torus-ts/features";

const MIN_ALLOWED_STAKE_SAFEGUARD = 500000000000000000n;
const MIN_EXISTENCIAL_BALANCE = 100000000000000000n;
const FEE_BUFFER_PERCENT = 202n;

export function StakingForm() {
  const {
    addStake,
    accountFreeBalance,
    stakeOut,
    accountStakedBy,
    selectedAccount,
    addStakeTransaction,
    estimateFee,
    getExistencialDeposit,
    getMinAllowedStake,
  } = useWallet();

  const [amount, setAmount] = useState<string>("");
  const [validator, setValidator] = useState<string>("");
  const [estimatedFee, setEstimatedFee] = useState<string | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [currentView, setCurrentView] = useState<"form" | "validators">(
    "minAllowedStake",
  );

  const [minAllowedStake, setMinAllowedStake] = useState<bigint>(
    MIN_ALLOWED_STAKE_SAFEGUARD,
  );

  const [inputError, setInputError] = useState<{
    validator: string | null;
    amount: string | null;
  }>({
    validator: null,
    amount: null,
  });

  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      status: null,
      message: null,
      finalized: false,
    },
  );

  const existencialDepositValue =
    getExistencialDeposit() ?? MIN_EXISTENCIAL_BALANCE;

  const handleValidatorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidator(e.target.value);
    setAmount("");
    setEstimatedFee(null);
    setMaxAmount("");
    setInputError({ validator: null, amount: null });
  };

  const handleCallback = (callbackReturn: TransactionResult) => {
    setTransactionStatus(callbackReturn);
    if (callbackReturn.status === "SUCCESS") {
      setAmount("");
      setValidator("");
      setInputError({ validator: null, amount: null });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !validator || inputError.amount || inputError.validator)
      return;

    setTransactionStatus({
      status: "STARTING",
      message: "Starting staking transaction...",
      finalized: false,
    });

    const refetchHandler = async () => {
      await Promise.all([
        stakeOut.refetch(),
        accountStakedBy.refetch(),
        accountFreeBalance.refetch(),
      ]);
    };

    try {
      await addStake({
        validator,
        amount,
        callback: handleCallback,
        refetchHandler,
      });
    } catch (error) {
      console.error("Staking error:", error);
      setTransactionStatus({
        status: "ERROR",
        message: "Failed to stake tokens",
        finalized: true,
      });
    }
  };

  const handleEstimateFee = async (): Promise<bigint | undefined> => {
    if (!validator || !isSS58(validator)) {
      setEstimatedFee(null);
      setMaxAmount("");
      return;
    }

    setIsEstimating(true);
    try {
      const transaction = addStakeTransaction({
        validator,
        amount: "1", // placeholder amount for estimation
      });

      if (!transaction) {
        setInputError((prev) => ({
          ...prev,
          validator: "Invalid transaction",
        }));
        return;
      }

      const fee = await estimateFee(transaction);
      if (fee != null) {
        const adjustedFee = (fee * FEE_BUFFER_PERCENT) / 100n;
        setEstimatedFee(fromNano(adjustedFee));
        return adjustedFee;
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
        amount: "Amount exceeds maximum stakeable amount",
      }));
    } else {
      setInputError((prev) => ({ ...prev, amount: null }));
    }
  };

  const handleAmountChange = (newAmount: string) => {
    const amountStr = newAmount.replace(/[^0-9.]/g, "");
    setAmount(amountStr);

    const stakeAmount = toNano(amountStr);
    if (stakeAmount <= 0n) return;

    if (stakeAmount < minAllowedStake) {
      setInputError((prev) => ({
        ...prev,
        amount: `You must stake at least ${formatToken(minAllowedStake)} TORUS`,
      }));
      return;
    }

    const freeBalance = accountFreeBalance.data ?? 0n;
    const rawFee = estimatedFee ? toNano(estimatedFee) : 0n;

    const newFreeBalance = freeBalance - stakeAmount - rawFee;
    if (newFreeBalance < existencialDepositValue) {
      setInputError((prev) => ({
        ...prev,
        amount: `This amount would go below the existential deposit (${formatToken(
          existencialDepositValue,
        )} TORUS)`,
      }));
      return;
    }

    const maxAmountNano = toNano(maxAmount || "0");
    const userAmount = toNano(amountStr || "0");

    if (userAmount > maxAmountNano) {
      setInputError((prev) => ({
        ...prev,
        amount: "Amount exceeds maximum stakeable balance",
      }));
    } else {
      setInputError((prev) => ({ ...prev, amount: null }));
    }
  };

  useEffect(() => {
    async function fetchFeeAndMax() {
      const fee = await handleEstimateFee();
      handleUpdateMaxAmount(fee);
    }
    void fetchFeeAndMax();
  }, [validator]);

  useEffect(() => {
    async function fetchMinStakeAllowed() {
      try {
        const minStakeFromChain = await getMinAllowedStake().catch(
          () => MIN_ALLOWED_STAKE_SAFEGUARD,
        );
        setMinAllowedStake(
          typeof minStakeFromChain === "bigint"
            ? minStakeFromChain
            : BigInt(minStakeFromChain.toString()),
        );
      } catch (err) {
        console.warn("Using fallback min stake value:", err);
        setMinAllowedStake(MIN_ALLOWED_STAKE_SAFEGUARD);
      }
    }

    // Only fetch if we have a validator selected
    if (validator) {
      void fetchMinStakeAllowed();
    }
  }, [validator, getMinAllowedStake]);

  const formRef = useRef<HTMLFormElement>(null);

  const reviewData = [
    {
      label: "Validator",
      content: validator ? smallAddress(validator, 6) : "Select Validator",
    },
    { label: "Amount", content: `${amount ? amount : 0} TORUS` },
    {
      label: "Fee",
      content: `${estimatedFee ?? "0"} TORUS`,
    },
  ];

  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      {currentView === "validators" ? (
        <ValidatorsList
          listType="all"
          onSelectValidator={(val) => {
            setValidator(val.address);
            setCurrentView("form");
          }}
          onBack={() => setCurrentView("form")}
        />
      ) : (
        <Card className="w-full animate-fade p-6 md:w-3/5">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-2">
              <Label>Validator</Label>
              <div className="flex gap-2">
                <Input
                  value={validator}
                  onChange={handleValidatorChange}
                  placeholder="Validator address"
                  disabled={!selectedAccount}
                />
                <button
                  type="button"
                  onClick={() => setCurrentView("validators")}
                  className="btn-secondary"
                >
                  Browse
                </button>
              </div>
              {inputError.validator && (
                <span className="text-red-500">{inputError.validator}</span>
              )}
              <APRDisplay />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Amount</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Amount to stake"
                disabled={!validator || isEstimating}
              />
              <AmountButtons
                setAmount={handleAmountChange}
                availableFunds={maxAmount}
                disabled={!validator || isEstimating}
              />
              {inputError.amount && (
                <span className="text-red-500">{inputError.amount}</span>
              )}
            </div>

            <FeeLabel estimatedFee={estimatedFee} isEstimating={isEstimating} />

            {transactionStatus.status && (
              <TransactionStatus
                status={transactionStatus.status}
                message={transactionStatus.message}
              />
            )}
          </form>
        </Card>
      )}

      <WalletTransactionReview
        disabled={!amount || !validator || !!inputError.amount || isEstimating}
        formRef={formRef}
        reviewContent={reviewData}
      />
    </div>
  );
}
