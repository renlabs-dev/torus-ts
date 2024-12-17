"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { BN } from "@polkadot/util";

import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { isSS58 } from "@torus-ts/subspace";
import { useTorus } from "@torus-ts/torus-provider";
import { Card, Input, Label, Skeleton, TransactionStatus } from "@torus-ts/ui";
import { fromNano, smallAddress, toNano } from "@torus-ts/utils/subspace";

import { AmountButtons } from "../amount-buttons";
import { WalletTransactionReview } from "../wallet-review";

export function SendAction() {
  const { estimateFee, balance } = useTorus();

  const [amount, setAmount] = useState<string>("");
  const [estimatedFee, setEstimatedFee] = useState<string | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [maxAmount, setMaxAmount] = useState<string>("");
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

  const calculateMaxAmount = useCallback((balance: string, fee: string) => {
    const balanceBN = new BN(toNano(balance));
    const feeBN = new BN(toNano(fee));
    const adjustedFeeBN = feeBN.muln(1.1); // Increase fee by 10%
    const maxAmountBN = balanceBN.sub(adjustedFeeBN);
    return maxAmountBN.isNeg() ? "0" : fromNano(maxAmountBN.toString());
  }, []);

  const estimateFeeAndUpdateMax = async () => {
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
      const fee = await estimateFee(recipient, "0");
      if (fee) {
        const feeStr = fromNano(fee.toString());
        setEstimatedFee(feeStr);

        const newMaxAmount = calculateMaxAmount(
          fromNano(balance?.toString() ?? "0"),
          feeStr,
        );
        setMaxAmount(newMaxAmount);

        if (amount && Number(amount) > Number(newMaxAmount)) {
          setInputError((prev) => ({
            ...prev,
            value: "Amount exceeds maximum transferable amount",
          }));
        } else {
          setInputError((prev) => ({ ...prev, value: null }));
        }
      } else {
        setEstimatedFee(null);
        setMaxAmount("");
      }
    } catch (error) {
      console.error("Error estimating fee:", error);
      setEstimatedFee(null);
      setMaxAmount("");
    }

    setIsEstimating(false);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    if (maxAmount && Number(newAmount) > Number(maxAmount)) {
      setInputError((prev) => ({
        ...prev,
        value: "Amount exceeds maximum transferable amount",
      }));
    } else {
      setInputError((prev) => ({ ...prev, value: null }));
    }
    setAmount(newAmount);
  };

  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipient(e.target.value);
    setAmount("");
    setEstimatedFee(null);
    setMaxAmount("");
    setInputError({ recipient: null, value: null });
  };

  // const handleMaxClick = () => {
  //   if (!maxAmount) return;
  //   setAmount(maxAmount);
  // };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // const handleCallback = (callbackReturn: TransactionResult) => {
    //   setTransactionStatus(callbackReturn);
    // };

    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting transaction...",
    });

    console.log("submitting transaction");
    // const isValidInput = amount && recipient && !inputError.value;

    // if (!isValidInput) return;

    // void transfer({ to: recipient, amount, callback: handleCallback });
  };

  useEffect(() => {
    void estimateFeeAndUpdateMax();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipient]);

  useEffect(() => {
    if (amount) {
      if (Number(amount) > Number(maxAmount)) {
        setInputError((prev) => ({
          ...prev,
          value: "Amount exceeds maximum transferable amount",
        }));
      } else {
        setInputError((prev) => ({ ...prev, value: null }));
      }
    }
  }, [amount, maxAmount]);

  const formRef = useRef<HTMLFormElement>(null);
  const roundedEstimatedFee = (Number(estimatedFee) * 1.1).toFixed(9);

  function FeeLabel() {
    if (isEstimating) {
      return <Skeleton className="h-5 w-64" />;
    }
    if (estimatedFee) {
      return <span>Estimated fee: {roundedEstimatedFee} TOR</span>;
    }
    return <span>Estimated fee: 0 TOR</span>;
  }

  // function MaxAmountLabel() {
  //   if (isEstimating) {
  //     return <Skeleton className="h-5 w-72" />;
  //   }
  //   if (maxAmount) {
  //     return (
  //       <span>
  //         Maximum transferable amount:{" "}
  //         <Button
  //           variant="link"
  //           type="button"
  //           onClick={() => setAmount(maxAmount)}
  //           className="m-0 h-5 p-0 text-sm text-primary"
  //         >
  //           {maxAmount} TOR
  //         </Button>
  //       </span>
  //     );
  //   }
  //   return (
  //     <span className="flex gap-2">Maximum transferable amount: 0 TOR</span>
  //   );
  // }

  const reviewData = [
    {
      label: "To",
      content: `${recipient ? smallAddress(recipient, 6) : "Recipient Address"}`,
    },
    { label: "Amount", content: `${amount ? amount : 0} TOR` },
    {
      label: "Fee",
      content: `${roundedEstimatedFee} TOR`,
    },
  ];

  return (
    <div className="l flex w-full flex-col gap-4 md:flex-row">
      <Card className="w-full animate-fade p-6 md:w-3/5">
        <form
          onSubmit={handleSubmit}
          ref={formRef}
          className="flex w-full flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="send-recipient" className="">
              To
            </Label>
            <Input
              id="send-recipient"
              type="text"
              value={recipient}
              required
              onChange={handleRecipientChange}
              placeholder="Address"
            />
          </div>
          {inputError.recipient && (
            <p className="-mt-2 mb-1 flex text-left text-base text-red-400">
              {inputError.recipient}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="send-amount" className="text-base">
              Amount
            </Label>
            <div className="flex w-full flex-col gap-2">
              <Input
                id="send-amount"
                type="number"
                value={amount}
                max={maxAmount}
                required
                onChange={handleAmountChange}
                placeholder="0.1"
                className="disabled:cursor-not-allowed"
                disabled={!recipient || isEstimating}
              />
              <AmountButtons
                setAmount={setAmount}
                availableFunds={maxAmount}
                disabled={!recipient || isEstimating}
              />
            </div>
          </div>

          {inputError.value && (
            <p className="mb-1 mt-2 flex text-left text-base text-red-400">
              {inputError.value}
            </p>
          )}

          <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
            <FeeLabel />
            {/* <MaxAmountLabel /> */}
          </div>

          {transactionStatus.status && (
            <TransactionStatus
              status={transactionStatus.status}
              message={transactionStatus.message}
            />
          )}
        </form>
      </Card>
      <WalletTransactionReview
        disabled={
          transactionStatus.status === "PENDING" ||
          !amount ||
          !recipient ||
          isEstimating ||
          !!inputError.value
        }
        formRef={formRef}
        reviewContent={reviewData}
      />
    </div>
  );
}
