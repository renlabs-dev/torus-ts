"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { isSS58 } from "@torus-network/sdk";
import { useGetTorusPrice } from "@torus-ts/query-provider/hooks";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { Button } from "@torus-ts/ui/components/button";
import { Card } from "@torus-ts/ui/components/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";
import { TransactionStatus } from "@torus-ts/ui/components/transaction-status";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { fromNano, toNano } from "@torus-ts/utils/subspace";
import { ArrowLeftRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useWallet } from "~/context/wallet-provider";
import { env } from "~/env";
import {
  computeFeeData,
  convertUSDToTorus,
  convertTORUSToUSD,
} from "~/utils/helpers";
import { isWithinTransferLimit } from "~/utils/validators";
import { AmountButtons } from "../../components/amount-buttons";
import type { FeeLabelHandle } from "../../components/fee-label";
import { FeeLabel } from "../../components/fee-label";
import type { ReviewTransactionDialogHandle } from "../../components/review-transaction-dialog";
import { ReviewTransactionDialog } from "../../components/review-transaction-dialog";

const FEE_BUFFER_PERCENT = 102n;

const createSendActionFormSchema = (
  accountFreeBalance: bigint | null,
  feeRef: React.RefObject<FeeLabelHandle | null>,
) =>
  z.object({
    recipient: z
      .string()
      .nonempty({ message: "Recipient address is required" })
      .refine(isSS58, { message: "Invalid recipient address" }),
    amount: z
      .string()
      .nonempty({ message: "Amount is required" })
      .refine((amount) => toNano(amount) > 0n, {
        message: "Amount must be greater than 0",
      })
      .refine(
        (amount) =>
          isWithinTransferLimit(
            amount,
            feeRef.current?.getEstimatedFee() ?? "0",
            accountFreeBalance ?? 0n,
          ),
        { message: "Amount exceeds maximum transferable amount" },
      ),
  });

export function SendAction() {
  const {
    estimateFee,
    accountFreeBalance,
    transfer,
    selectedAccount,
    transferTransaction,
  } = useWallet();
  const { toast } = useToast();
  const { data: usdPrice = 0 } = useGetTorusPrice();

  const feeRef = useRef<FeeLabelHandle>(null);
  const maxAmountRef = useRef<string>("");
  const formRef = useRef<HTMLFormElement>(null);
  const reviewDialogRef = useRef<ReviewTransactionDialogHandle>(null);

  const [inputType, setInputType] = useState<"TORUS" | "USD">("TORUS");
  const [displayAmount, setDisplayAmount] = useState<string>("");

  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      status: null,
      message: null,
      finalized: false,
    },
  );

  const sendActionFormSchema = createSendActionFormSchema(
    accountFreeBalance.data ?? null,
    feeRef,
  );

  const form = useForm<z.infer<typeof sendActionFormSchema>>({
    resolver: zodResolver(sendActionFormSchema),
    defaultValues: {
      recipient: "",
      amount: "",
    },
    mode: "onTouched",
  });

  const { reset, setValue, getValues, trigger, watch } = form;

  const handleEstimateFee = useCallback(async () => {
    feeRef.current?.setLoading(true);
    try {
      const transaction = transferTransaction({
        to: env("NEXT_PUBLIC_TORUS_ALLOCATOR_ADDRESS"),
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
        const { feeStr, maxTransferable } = computeFeeData(
          fee,
          FEE_BUFFER_PERCENT,
          accountFreeBalance.data ?? 0n,
        );
        feeRef.current?.updateFee(feeStr);
        maxAmountRef.current = fromNano(maxTransferable);
      } else {
        feeRef.current?.updateFee(null);
        maxAmountRef.current = "";
      }
    } catch (error) {
      console.error("Error estimating fee:", error);
      feeRef.current?.updateFee(null);
    } finally {
      feeRef.current?.setLoading(false);
    }
  }, [accountFreeBalance.data, estimateFee, transferTransaction, toast]);

  const handleAmountChange = async (amount: string) => {
    if (inputType === "USD") {
      const torusAmount = convertUSDToTorus(amount, usdPrice);
      setValue("amount", torusAmount);
      setDisplayAmount(amount);
    } else {
      const usdAmount = convertTORUSToUSD(amount, usdPrice);
      setValue("amount", amount);
      setDisplayAmount(usdAmount);
    }
    await trigger("amount");
  };

  const handleCurrencySwitch = () => {
    const currentAmount = watch("amount");

    if (inputType === "TORUS") {
      const usdAmount = convertTORUSToUSD(currentAmount, usdPrice);
      setDisplayAmount(usdAmount);
      setInputType("USD");
      setValue("amount", convertUSDToTorus(usdAmount, usdPrice));
    } else {
      const torusAmount = convertUSDToTorus(displayAmount, usdPrice);
      setDisplayAmount(convertTORUSToUSD(torusAmount, usdPrice));
      setInputType("TORUS");
      setValue("amount", torusAmount);
    }
  };

  const handleCallback = (callbackReturn: TransactionResult) => {
    setTransactionStatus(callbackReturn);
    if (callbackReturn.status === "SUCCESS") {
      reset();
      setDisplayAmount("");
    }
  };

  const refetchHandler = async () => {
    await accountFreeBalance.refetch();
  };

  const onSubmit = async (values: z.infer<typeof sendActionFormSchema>) => {
    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting transaction...",
    });
    await transfer({
      to: values.recipient,
      amount: values.amount,
      callback: handleCallback,
      refetchHandler,
    });
  };

  useEffect(() => {
    if (!selectedAccount?.address) return;
    void handleEstimateFee();
  }, [handleEstimateFee, selectedAccount?.address]);

  useEffect(() => {
    reset();
    setDisplayAmount("");
    feeRef.current?.updateFee(null);
  }, [selectedAccount?.address, reset]);

  const reviewData = () => {
    const { recipient, amount } = getValues();
    return [
      { label: "To", content: recipient },
      { label: "Amount", content: `${amount} TORUS` },
      { label: "Fee", content: `${feeRef.current?.getEstimatedFee()} TORUS` },
    ];
  };

  const handleReviewClick = async () => {
    const isValid = await trigger();
    if (isValid) {
      reviewDialogRef.current?.openDialog();
    }
  };

  return (
    <div className="l flex w-full flex-col gap-4 md:flex-row">
      <Card className="animate-fade w-full p-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            ref={formRef}
            className="flex w-full flex-col gap-6"
          >
            <FormField
              control={form.control}
              name="recipient"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Receiver address</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={`eg. 5CoS1L...2tCACxf4n`}
                      disabled={!selectedAccount?.address}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col md:flex-row gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="flex flex-col w-full md:w-1/2">
                    <FormLabel>Amount to send ({inputType})</FormLabel>
                    <div className="flex flex-col gap-2">
                      <FormControl>
                        <Input
                          {...field}
                          value={
                            inputType === "TORUS" ? field.value : displayAmount
                          }
                          onChange={(e) => handleAmountChange(e.target.value)}
                          placeholder={`Amount of ${inputType}`}
                          disabled={!selectedAccount?.address}
                          type="number"
                          label={inputType === "TORUS" ? "TOR" : "USD"}
                        />
                      </FormControl>

                      <FormMessage />

                      <AmountButtons
                        setAmount={handleAmountChange}
                        availableFunds={maxAmountRef.current}
                        disabled={
                          !(toNano(maxAmountRef.current) > 0n) ||
                          !selectedAccount?.address
                        }
                        inputType={inputType}
                        usdPrice={usdPrice}
                      />
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex flex-row md:flex-col justify-center items-center lg:-mt-6">
                <Button
                  className="text-3xl border-none bg-transparent font-normal text-[#A1A1AA]"
                  type="button"
                  variant="outline"
                  onClick={handleCurrencySwitch}
                >
                  <ArrowLeftRight size={16} />
                </Button>
              </div>

              <FormField
                control={form.control}
                name="amount"
                render={() => (
                  <FormItem className="flex flex-col w-full md:w-1/2 justify-center lg:-mt-5">
                    <div className="flex flex-col gap-2">
                      <FormControl>
                        <Input
                          value={
                            inputType === "TORUS"
                              ? displayAmount
                              : form.watch("amount")
                          }
                          disabled={true}
                          label={inputType !== "TORUS" ? "TOR" : "USD"}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FeeLabel ref={feeRef} accountConnected={!!selectedAccount} />

            {transactionStatus.status && (
              <TransactionStatus
                status={transactionStatus.status}
                message={transactionStatus.message}
              />
            )}

            <Button
              type="button"
              variant="outline"
              onClick={handleReviewClick}
              disabled={!selectedAccount?.address}
            >
              Review & Submit Send Transaction
            </Button>
          </form>
        </Form>
      </Card>

      <ReviewTransactionDialog
        ref={reviewDialogRef}
        formRef={formRef}
        reviewContent={reviewData}
      />
    </div>
  );
}
