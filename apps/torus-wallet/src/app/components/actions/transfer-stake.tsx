"use client";

import { AmountButtons } from "../amount-buttons";
import type { FeeLabelHandle } from "../fee-label";
import { FeeLabel } from "../fee-label";
import type { ReviewTransactionDialogHandle } from "../review-transaction-dialog";
import { ReviewTransactionDialog } from "../review-transaction-dialog";
import { ValidatorsList } from "../validators-list";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkSS58, isSS58 } from "@torus-ts/subspace";
import { toast } from "@torus-ts/toast-provider";
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
import { ALLOCATOR_ADDRESS } from "~/consts";
import { useWallet } from "~/context/wallet-provider";
import { isAmountPositive, meetsMinimumStake } from "~/utils/validators";

const MIN_ALLOWED_STAKE_SAFEGUARD = 500000000000000000n;
const MIN_EXISTENCIAL_BALANCE = 100000000000000000n;

export function TransferStakeAction() {
  const {
    accountStakedBy,
    transferStake,
    selectedAccount,
    accountFreeBalance,
    minAllowedStake,
    transferStakeTransaction,
    estimateFee,
    getExistencialDeposit,
  } = useWallet();

  const minAllowedStakeData =
    minAllowedStake.data ?? MIN_ALLOWED_STAKE_SAFEGUARD;

  const existencialDepositValue =
    getExistencialDeposit() ?? MIN_EXISTENCIAL_BALANCE;

  const maxAmountRef = useRef<string>("");
  const stakedValidators = useMemo(
    () => accountStakedBy.data ?? [],
    [accountStakedBy.data],
  );

  const transferStakeSchema = z
    .object({
      fromValidator: z
        .string()
        .nonempty({ message: "From Allocator is required" })
        .refine(isSS58, { message: "Invalid address" }),
      toValidator: z
        .string()
        .nonempty({ message: "To Allocator is required" })
        .refine(isSS58, { message: "Invalid address" }),
      amount: z
        .string()
        .nonempty({ message: "Amount is required" })
        .refine(isAmountPositive, {
          message: "Amount must be greater than 0",
        })
        .refine(
          (val) =>
            maxAmountRef.current
              ? toNano(val) <= toNano(maxAmountRef.current)
              : true,
          { message: "Amount exceeds maximum transferable amount" },
        )
        .refine((value) => meetsMinimumStake(value, minAllowedStakeData), {
          message: `You must unstake at least ${formatToken(minAllowedStakeData)} TORUS`,
        })
        .refine(
          () =>
            (accountFreeBalance.data ?? 0n) -
              toNano(feeRef.current?.getEstimatedFee() ?? "0") >=
            existencialDepositValue,
          {
            message: `This transaction fee would make your account go below the existential deposit (${formatToken(existencialDepositValue)} TORUS). Top up your balance before moving your stake.`,
          },
        ),
    })
    .refine((data) => data.fromValidator !== data.toValidator, {
      message: "Recipient cannot be the same as sender",
      path: ["toValidator"],
    });

  const form = useForm<z.infer<typeof transferStakeSchema>>({
    resolver: zodResolver(transferStakeSchema),
    defaultValues: {
      fromValidator: "",
      toValidator: "",
      amount: "",
    },
    mode: "onTouched",
  });

  const {
    reset,
    setValue,
    trigger,
    getValues,
    watch,
    formState: { errors },
  } = form;

  const reviewDialogRef = useRef<ReviewTransactionDialogHandle>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const { unsubscribe } = watch((values, info) => {
      if (
        info.name === "fromValidator" &&
        isSS58(String(values.fromValidator))
      ) {
        const validator = stakedValidators.find(
          (v: { address: string; stake: bigint }) =>
            v.address === values.fromValidator,
        );
        if (validator) {
          const stakedAmount = fromNano(validator.stake);
          maxAmountRef.current = stakedAmount;
        } else {
          maxAmountRef.current = "";
        }
      }
    });
    return () => {
      setValue("amount", "");
      unsubscribe();
    };
  }, [accountStakedBy.data, watch, setValue, stakedValidators]);

  const handleEstimateFee = useCallback(async () => {
    feeRef.current?.setLoading(true);
    try {
      const transaction = transferStakeTransaction({
        fromValidator: ALLOCATOR_ADDRESS,
        toValidator: ALLOCATOR_ADDRESS,
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
  }, [estimateFee, transferStakeTransaction]);

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

  const feeRef = useRef<FeeLabelHandle>(null);

  const handleCallback = (callbackReturn: TransactionResult) => {
    setTransactionStatus(callbackReturn);
    if (callbackReturn.status === "SUCCESS") {
      reset();
    }
  };

  const refetchHandler = async () => {
    await accountStakedBy.refetch();
  };

  const onSubmit = async (values: z.infer<typeof transferStakeSchema>) => {
    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting transaction...",
    });
    await transferStake({
      fromValidator: values.fromValidator,
      toValidator: values.toValidator,
      amount: values.amount,
      callback: handleCallback,
      refetchHandler,
    });
  };

  const handleAmountChange = async (newAmount: string) => {
    setValue("amount", newAmount);
    await trigger("amount");
  };

  const handleSelectFromValidator = async (validator: { address: string }) => {
    setValue("fromValidator", checkSS58(validator.address));
    setCurrentView("wallet");
    const validatorData = stakedValidators.find(
      (v: { address: string; stake: bigint }) =>
        v.address === validator.address,
    );
    if (validatorData) {
      maxAmountRef.current = fromNano(validatorData.stake);
    } else {
      maxAmountRef.current = "";
    }
    await trigger("fromValidator");
  };

  const handleSelectToValidator = async (validator: { address: string }) => {
    setValue("toValidator", checkSS58(validator.address));
    setCurrentView("wallet");
    await trigger("toValidator");
  };

  const reviewData = () => {
    const { fromValidator, toValidator, amount } = getValues();
    return [
      {
        label: "From",
        content: fromValidator
          ? smallAddress(fromValidator, 6)
          : "From Address",
      },
      {
        label: "To",
        content: toValidator ? smallAddress(toValidator, 6) : "To Address",
      },
      {
        label: "Amount",
        content: `${amount || 0} TORUS`,
      },
    ];
  };

  const handleReviewClick = async () => {
    const isValid = await trigger();
    if (isValid) {
      reviewDialogRef.current?.openDialog();
    }
  };

  useEffect(() => {
    if (!selectedAccount?.address || currentView !== "wallet") return;
    void handleEstimateFee();
  }, [handleEstimateFee, selectedAccount?.address, currentView]);

  useEffect(() => {
    reset();
    maxAmountRef.current = "";
  }, [selectedAccount?.address, reset]);

  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      {(currentView === "validators" || currentView === "stakedValidators") && (
        <ValidatorsList
          listType={currentView === "validators" ? "all" : "staked"}
          excludeAddress={() => getValues("fromValidator")}
          onSelectValidator={
            currentView === "stakedValidators"
              ? handleSelectFromValidator
              : handleSelectToValidator
          }
          onBack={() => setCurrentView("wallet")}
        />
      )}
      {currentView === "wallet" && (
        <Card className="animate-fade w-full p-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              ref={formRef}
              className="flex w-full flex-col gap-6"
            >
              <FormField
                control={form.control}
                name="fromValidator"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>From Allocator</FormLabel>
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
                        onClick={() => setCurrentView("stakedValidators")}
                        className="flex w-fit items-center px-6 py-2.5"
                      >
                        Staked Allocators
                      </Button>
                    </div>
                    <FormMessage>{errors.fromValidator?.message}</FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="toValidator"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>To Allocator</FormLabel>
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
                    <FormMessage>{errors.toValidator?.message}</FormMessage>
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
                          disabled={!selectedAccount?.address}
                        />
                      </FormControl>
                      <AmountButtons
                        setAmount={handleAmountChange}
                        availableFunds={maxAmountRef.current || "0"}
                        disabled={
                          !(toNano(maxAmountRef.current) > 0n) ||
                          !selectedAccount?.address
                        }
                      />
                    </div>
                    <FormMessage>{errors.amount?.message}</FormMessage>
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
      {currentView === "wallet" && (
        <ReviewTransactionDialog
          ref={reviewDialogRef}
          formRef={formRef}
          reviewContent={reviewData}
        />
      )}
    </div>
  );
}
