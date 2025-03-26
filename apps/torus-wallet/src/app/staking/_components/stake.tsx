"use client";

import { AmountButtons } from "../../components/amount-buttons";
import type { FeeLabelHandle } from "../../components/fee-label";
import { FeeLabel } from "../../components/fee-label";
import type { ReviewTransactionDialogHandle } from "../../components/review-transaction-dialog";
import { ReviewTransactionDialog } from "../../components/review-transaction-dialog";
import { ValidatorsList } from "../../components/validators-list";
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
import { computeFeeData } from "~/utils/helpers";
import {
  doesNotExceedMaxStake,
  isAboveExistentialDeposit,
  isAmountPositive,
  meetsMinimumStake,
} from "~/utils/validators";

const MIN_ALLOWED_STAKE_SAFEGUARD = 500000000000000000n;
const MIN_EXISTENCIAL_BALANCE = 100000000000000000n;
const FEE_BUFFER_PERCENT = 225n;

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
  const { toast } = useToast();

  const minAllowedStakeData =
    minAllowedStake.data ?? MIN_ALLOWED_STAKE_SAFEGUARD;
  const existencialDepositValue =
    getExistencialDeposit() ?? MIN_EXISTENCIAL_BALANCE;

  const feeRef = useRef<FeeLabelHandle>(null);

  const maxAmountRef = useRef<string>("");

  const stakeActionFormSchema = useMemo(() => {
    return z.object({
      recipient: z
        .string()
        .nonempty({ message: "Allocator address is required" })
        .refine(isSS58, { message: "Invalid allocator address" }),
      amount: z
        .string()
        .nonempty({ message: "Stake amount is required" })
        .refine(isAmountPositive, { message: "Amount must be greater than 0" })
        .refine((value) => meetsMinimumStake(value, minAllowedStakeData), {
          message: `You must stake at least ${formatToken(minAllowedStakeData)} TORUS`,
        })
        .refine(
          (value) =>
            isAboveExistentialDeposit(
              value,
              feeRef.current?.getEstimatedFee() ?? "0",
              accountFreeBalance.data ?? 0n,
              existencialDepositValue,
            ),
          {
            message: `This amount would go below the existential deposit (${formatToken(existencialDepositValue)} TORUS). Reduce the stake or top up your balance.`,
          },
        )
        .refine(
          (value) =>
            doesNotExceedMaxStake(
              value,
              feeRef.current?.getEstimatedFee() ?? "0",
              accountFreeBalance.data ?? 0n,
              existencialDepositValue,
            ),
          { message: "Amount exceeds maximum stakable balance" },
        ),
    });
  }, [accountFreeBalance.data, minAllowedStakeData, existencialDepositValue]);

  const form = useForm<z.infer<typeof stakeActionFormSchema>>({
    resolver: zodResolver(stakeActionFormSchema),
    defaultValues: {
      recipient: "",
      amount: "",
    },
    mode: "onTouched",
  });

  const { reset, setValue, trigger, getValues } = form;

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

  const reviewDialogRef = useRef<ReviewTransactionDialogHandle>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleEstimateFee = useCallback(async () => {
    feeRef.current?.setLoading(true);
    try {
      const transaction = addStakeTransaction({
        validator: env("NEXT_PUBLIC_TORUS_ALLOCATOR_ADDRESS"),
        amount: "1",
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
        const { feeStr, maxTransferable } = computeFeeData(
          fee,
          FEE_BUFFER_PERCENT,
          accountFreeBalance.data ?? 0n,
        );
        feeRef.current?.updateFee(feeStr);
        maxAmountRef.current = fromNano(
          maxTransferable - existencialDepositValue,
        );
      } else {
        feeRef.current?.updateFee(null);
        maxAmountRef.current = "";
      }
    } catch (error) {
      console.error("Error estimating fee:", error);
      feeRef.current?.updateFee(null);
      maxAmountRef.current = "";
    } finally {
      feeRef.current?.setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    accountFreeBalance.data,
    addStakeTransaction,
    estimateFee,
    existencialDepositValue,
  ]);

  useEffect(() => {
    if (!selectedAccount?.address || currentView === "validators") return;
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

  const onSubmit = async (values: z.infer<typeof stakeActionFormSchema>) => {
    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting transaction...",
    });
    await addStake({
      validator: values.recipient,
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
    setValue("recipient", checkSS58(validator.address));
    setCurrentView("wallet");
    await trigger("recipient");
  };

  const reviewData = () => {
    const { recipient, amount } = getValues();
    return [
      {
        label: "To",
        content: recipient ? smallAddress(recipient, 6) : "Allocator Address",
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
      {currentView === "validators" ? (
        <ValidatorsList
          listType="all"
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
                name="recipient"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Allocator Address</FormLabel>
                    <div className="flex flex-row gap-2">
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Full Allocator address"
                          disabled={!selectedAccount?.address}
                        />
                      </FormControl>
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
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="Amount of TORUS"
                          min={fromNano(minAllowedStakeData)}
                          step="0.000000000000000001"
                          disabled={!selectedAccount?.address}
                        />
                      </FormControl>
                      <AmountButtons
                        setAmount={async (value) => {
                          await handleAmountChange(value);
                        }}
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
      {currentView !== "validators" && (
        <ReviewTransactionDialog
          ref={reviewDialogRef}
          formRef={formRef}
          reviewContent={reviewData}
        />
      )}
    </div>
  );
}
