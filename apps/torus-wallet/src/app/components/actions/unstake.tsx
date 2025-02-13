"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  Input,
  Button,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  TransactionStatus,
} from "@torus-ts/ui";
import {
  fromNano,
  toNano,
  smallAddress,
  formatToken,
} from "@torus-ts/utils/subspace";
import { checkSS58, isSS58 } from "@torus-ts/subspace";
import { useWallet } from "~/context/wallet-provider";
import { AmountButtons } from "../amount-buttons";
import { ValidatorsList } from "../validators-list";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { FeeLabel } from "../send-fee-label";
import { ALLOCATOR_ADDRESS } from "~/consts";
import type { ReviewTransactionDialogHandle } from "../review-transaction-dialog";
import { ReviewTransactionDialog } from "../review-transaction-dialog";
import {
  isAboveExistentialDeposit,
  isAmountPositive,
  meetsMinimumStake,
} from "~/utils/validators";
import { toast } from "@torus-ts/toast-provider";

interface StakedValidator {
  address: string;
  stake: bigint;
}

const MIN_ALLOWED_STAKE_SAFEGUARD = 500000000000000000n;
const MIN_EXISTENCIAL_BALANCE = 100000000000000000n;

export function UnstakeAction() {
  const {
    removeStake,
    accountStakedBy,
    accountFreeBalance,
    removeStakeTransaction,
    stakeOut,
    estimateFee,
    selectedAccount,
    minAllowedStake,
    getExistencialDeposit,
  } = useWallet();

  const minAllowedStakeData =
    minAllowedStake.data ?? MIN_ALLOWED_STAKE_SAFEGUARD;
  const existencialDepositValue =
    getExistencialDeposit() ?? MIN_EXISTENCIAL_BALANCE;

  const [stakedAmount, setStakedAmount] = useState<bigint | null>(null);

  const unstakeActionFormSchema = useMemo(() => {
    return z
      .object({
        validator: z
          .string()
          .nonempty({ message: "Validator address is required" })
          .refine(isSS58, { message: "Invalid validator address" }),
        amount: z
          .string()
          .nonempty({ message: "Unstake amount is required" })
          .refine(isAmountPositive, {
            message: "Amount must be greater than 0",
          })
          .refine((value) => meetsMinimumStake(value, minAllowedStakeData), {
            message: `You must unstake at least ${formatToken(minAllowedStakeData)} TORUS`,
          })
          .refine(
            () =>
              (accountFreeBalance.data ?? 0n) -
                toNano(feeRef.current?.getEstimatedFee() ?? "0") >=
              existencialDepositValue,
            {
              message: `This transaction fee would make your account go below the existential deposit (${formatToken(existencialDepositValue)} TORUS). Top up your balance before unstaking.`,
            },
          ),
      })
      .superRefine((data, ctx) => {
        if (stakedAmount !== null) {
          if (toNano(data.amount) > stakedAmount) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Amount exceeds staked amount",
              path: ["amount"],
            });
          }
        }
      });
  }, [
    accountFreeBalance.data,
    existencialDepositValue,
    minAllowedStakeData,
    stakedAmount,
  ]);

  const form = useForm<z.infer<typeof unstakeActionFormSchema>>({
    resolver: zodResolver(unstakeActionFormSchema),
    defaultValues: { validator: "", amount: "" },
    mode: "onTouched",
  });
  const { reset, setValue, trigger, watch, getValues } = form;

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

  const feeRef = useRef<{
    updateFee: (newFee: string | null) => void;
    setLoading: (loading: boolean) => void;
    getEstimatedFee: () => string | null;
    isLoading: boolean;
  }>(null);

  const maxAmountRef = useRef<string>("");

  const reviewDialogRef = useRef<ReviewTransactionDialogHandle>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const { unsubscribe } = watch((values, info) => {
      if (info.name === "validator" && isSS58(String(values.validator))) {
        const staked = (accountStakedBy.data ?? ([] as StakedValidator[])).find(
          (v) => v.address === values.validator,
        );
        if (staked) {
          setStakedAmount(staked.stake);
          maxAmountRef.current = fromNano(staked.stake);
        } else {
          setStakedAmount(null);
          maxAmountRef.current = "";
        }
      }
    });
    return () => {
      unsubscribe();
    };
  }, [accountStakedBy.data, watch]);

  const handleEstimateFee = useCallback(async () => {
    feeRef.current?.setLoading(true);
    try {
      const transaction = removeStakeTransaction({
        validator: ALLOCATOR_ADDRESS,
        amount: "0",
      });
      if (!transaction) {
        toast.error("Error creating transaction for estimating fee.");
        return;
      }
      const fee = await estimateFee(transaction);
      if (fee != null) {
        feeRef.current?.updateFee(fromNano(fee));
      } else {
        feeRef.current?.updateFee(null);
      }
    } catch (error) {
      console.error("Error estimating fee:", error);
      feeRef.current?.updateFee(null);
    } finally {
      feeRef.current?.setLoading(false);
    }
  }, [estimateFee, removeStakeTransaction]);

  useEffect(() => {
    if (!selectedAccount?.address || currentView !== "wallet") return;
    void handleEstimateFee();
  }, [handleEstimateFee, selectedAccount?.address, currentView]);

  useEffect(() => {
    reset();
    feeRef.current?.updateFee(null);
  }, [selectedAccount?.address, reset]);

  const refetchHandler = async () => {
    await Promise.all([
      stakeOut.refetch(),
      accountStakedBy.refetch(),
      accountFreeBalance.refetch(),
    ]);
  };

  const handleCallback = (callbackReturn: TransactionResult) => {
    setTransactionStatus(callbackReturn);
    if (callbackReturn.status === "SUCCESS") {
      reset();
    }
  };

  const onSubmit = async (values: z.infer<typeof unstakeActionFormSchema>) => {
    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting transaction...",
    });
    await removeStake({
      validator: values.validator,
      amount: values.amount,
      callback: handleCallback,
      refetchHandler,
    });
  };

  const handleAmountChange = async (newAmount: string) => {
    setValue("amount", newAmount);
    await trigger("amount");
  };

  const handleSelectValidator = async (validator: { address: string }) => {
    setValue("validator", checkSS58(validator.address));
    setCurrentView("wallet");
    await trigger("validator");
  };

  const reviewData = () => {
    const { validator, amount } = getValues();
    return [
      {
        label: "Validator",
        content: validator ? smallAddress(validator, 6) : "Validator Address",
      },
      {
        label: "Amount",
        content: `${amount || 0} TORUS`,
      },
      {
        label: "Fee",
        content: `${feeRef.current?.getEstimatedFee() ?? "-"} TORUS`,
      },
    ];
  };

  const handleReviewClick = async () => {
    const isValid = await trigger();
    if (isValid) {
      reviewDialogRef.current?.openDialog();
    }
  };

  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      {currentView === "stakedValidators" ? (
        <ValidatorsList
          listType="staked"
          onSelectValidator={handleSelectValidator}
          onBack={() => setCurrentView("wallet")}
        />
      ) : (
        <Card className="w-full animate-fade p-6">
          <Form {...form}>
            <form
              ref={formRef}
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex w-full flex-col gap-6"
            >
              <FormField
                control={form.control}
                name="validator"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel>Validator Address</FormLabel>
                    <div className="flex flex-row gap-2">
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Full Validator address"
                          disabled={!selectedAccount?.address}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!selectedAccount?.address}
                        onClick={() => setCurrentView("stakedValidators")}
                        className="flex w-fit items-center px-6 py-2.5"
                      >
                        Staked Allocators
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="Amount to unstake"
                        min="0"
                        step="0.000000000000000001"
                        disabled={feeRef.current?.isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <AmountButtons
                setAmount={async (value) => await handleAmountChange(value)}
                availableFunds={maxAmountRef.current}
                disabled={
                  !(toNano(maxAmountRef.current) > 0n) ||
                  !selectedAccount?.address
                }
              />
              <FeeLabel ref={feeRef} accountConnected={!!selectedAccount} />
              {transactionStatus.status && (
                <TransactionStatus
                  status={transactionStatus.status}
                  message={transactionStatus.message}
                />
              )}
              <Button
                type="button"
                onClick={handleReviewClick}
                disabled={!selectedAccount?.address}
              >
                Review Transaction
              </Button>
            </form>
          </Form>
        </Card>
      )}
      {currentView !== "stakedValidators" && (
        <ReviewTransactionDialog
          ref={reviewDialogRef}
          formRef={formRef}
          reviewContent={reviewData}
        />
      )}
    </div>
  );
}
