"use client";

import { AmountButtons } from "../amount-buttons";
import type { FeeLabelHandle } from "../fee-label";
import { FeeLabel } from "../fee-label";
import type { ReviewTransactionDialogHandle } from "../review-transaction-dialog";
import { ReviewTransactionDialog } from "../review-transaction-dialog";
import { ValidatorsList } from "../validators-list";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkSS58, isSS58 } from "@torus-ts/subspace";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { Button } from "@torus-ts/ui/components/button";
import { Card } from "@torus-ts/ui/components/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";
import { TransactionStatus } from "@torus-ts/ui/components/transaction-status";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import {
  formatToken,
  fromNano,
  smallAddress,
  toNano,
} from "@torus-ts/utils/subspace";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useWallet } from "~/context/wallet-provider";
import { env } from "~/env";
import { isAmountPositive, meetsMinimumStake } from "~/utils/validators";

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
  const { toast } = useToast();

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

  const feeRef = useRef<FeeLabelHandle>(null);

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
        validator: env("NEXT_PUBLIC_TORUS_ALLOCATOR_ADDRESS"),
        amount: "0",
      });
      if (!transaction) {
        toast({
          title: "Uh oh! Something went wrong.",
          description: "Error creating transaction for estimating fee.",
        });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <Card className="animate-fade w-full p-6">
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
                  <FormItem className="flex flex-col">
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
                  <FormItem className="flex flex-col">
                    <FormLabel>Amount</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl className="flex items-center gap-2">
                        <Input
                          {...field}
                          type="number"
                          placeholder="Amount to unstake"
                          min="0"
                          step="0.000000000000000001"
                          disabled={!selectedAccount?.address}
                        />
                      </FormControl>
                      <AmountButtons
                        setAmount={async (value) =>
                          await handleAmountChange(value)
                        }
                        availableFunds={maxAmountRef.current}
                        disabled={
                          !(toNano(maxAmountRef.current) > 0n) ||
                          !selectedAccount?.address
                        }
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
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
