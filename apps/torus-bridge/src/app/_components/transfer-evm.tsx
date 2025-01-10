"use client";

import { useAccount, useWalletClient } from "wagmi";
import { useState } from "react";
import { convertH160ToSS58, withdrawFromTorusEvm } from "@torus-ts/subspace";
import { useTorus } from "@torus-ts/torus-provider";
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TransactionStatus,
} from "@torus-ts/ui";
import { smallAddress, toNano } from "@torus-ts/utils/subspace";
import type { SS58Address } from "@torus-ts/subspace";
import { toast } from "@torus-ts/toast-provider";
import type { TransactionResult } from "@torus-ts/torus-provider/types";

export function TransferEVM() {
  const [mode, setMode] = useState<"bridge" | "withdraw">("bridge");
  const [amount, setAmount] = useState<string>("");
  const [userInputEthAddr, setUserInputEthAddr] = useState<string>("");
  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      status: null,
      message: null,
      finalized: false,
    },
  );

  const { transfer, selectedAccount } = useTorus();
  const { data: walletClient } = useWalletClient();
  const { chain, address } = useAccount();

  const evmSS58Addr = userInputEthAddr
    ? convertH160ToSS58(userInputEthAddr)
    : "";
  const amountRems = amount ? toNano(parseFloat(amount)) : BigInt(0);

  const handleCallback = (callbackReturn: TransactionResult) => {
    setTransactionStatus(callbackReturn);
    if (callbackReturn.status === "SUCCESS") {
      setAmount("");
      setUserInputEthAddr("");
    }
  };

  async function handleBridge() {
    if (!amount || !evmSS58Addr) return;
    setTransactionStatus({
      status: "PENDING",
      message: "Accept the transaction in your wallet",
      finalized: false,
    });
    try {
      await transfer({
        amount: amount,
        to: evmSS58Addr,
        refetchHandler: () => Promise.resolve(),
        callback: handleCallback,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setTransactionStatus({
        status: "ERROR",
        message: "Something went wrong with your transaction",
        finalized: true,
      });
    }
  }

  async function handleWithdraw() {
    if (
      !amount ||
      walletClient == null ||
      chain == null ||
      selectedAccount == null
    ) {
      toast.error("Invalid state for withdrawal");
      return;
    }
    setTransactionStatus({
      status: "PENDING",
      message: "Accept the transaction in your wallet",
      finalized: false,
    });
    try {
      const txHash = await withdrawFromTorusEvm(
        walletClient,
        chain,
        selectedAccount.address as SS58Address,
        amountRems,
      );
      console.log("Transaction sent:", txHash);
      setTransactionStatus({
        status: "SUCCESS",
        message: `Transaction sent: ${txHash}`,
        finalized: true,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setTransactionStatus({
        status: "ERROR",
        message: "Something went wrong with your transaction",
        finalized: true,
      });
    }
  }

  const handleSelfClick = () => {
    if (address) {
      setUserInputEthAddr(address);
    } else {
      toast.warn("No account found. Is your wallet connected?");
    }
  };

  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      <Card className="flex w-full animate-fade flex-col gap-4 space-y-4 p-6 md:w-3/5">
        <div className="space-y-2">
          <Label htmlFor="action">Select Action</Label>
          <Select
            value={mode}
            onValueChange={(value) => setMode(value as "bridge" | "withdraw")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bridge">Add funds to Torus EVM</SelectItem>
              <SelectItem value="withdraw">
                Withdraw funds from Torus EVM
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount (TORUS)</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
          />
        </div>

        {mode === "bridge" && (
          <div className="space-y-2">
            <Label htmlFor="eth-address">Ethereum Address</Label>
            <div className="flex w-full items-center gap-2">
              <Input
                id="eth-address"
                type="text"
                value={userInputEthAddr}
                onChange={(e) => setUserInputEthAddr(e.target.value)}
                placeholder="Enter Ethereum address"
                className="flex-grow"
              />
              <Button type="button" onClick={handleSelfClick} variant="outline">
                Self
              </Button>
            </div>
          </div>
        )}

        {mode === "withdraw" && selectedAccount && (
          <div>
            <Label>Withdrawing to:</Label>
            <div className="text-sm text-gray-500">
              {selectedAccount.address}
            </div>
          </div>
        )}
      </Card>
      <Card className="flex w-full animate-fade flex-col justify-between p-6 md:w-2/5">
        <CardHeader className="px-0 pt-0">Review Transaction</CardHeader>
        <CardContent className="space-y-2 p-0 text-sm">
          <div className="flex items-center justify-between">
            <span>Transaction</span>
            <span className="text-zinc-400">
              {mode === "bridge"
                ? "Bridge to Torus EVM"
                : "Withdraw from Torus EVM"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Amount:</span>
            <span className="text-zinc-400">
              {Number(amount) > 0 ? amount : "0"} TORUS
            </span>
          </div>
          {mode === "bridge" && (
            <div className="flex items-center justify-between">
              <span>To Address:</span>
              <span className="max-w-[200px] truncate text-zinc-400">
                {smallAddress(userInputEthAddr)}
              </span>
            </div>
          )}
          {mode === "withdraw" && selectedAccount && (
            <div className="flex items-center justify-between">
              <span>From Address:</span>
              <span className="max-w-[200px] truncate text-zinc-400">
                {smallAddress(selectedAccount.address)}
              </span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex w-full flex-col gap-3 px-0 pb-0 pt-6">
          {transactionStatus.status && (
            <TransactionStatus
              status={transactionStatus.status}
              message={transactionStatus.message}
            />
          )}
          <Button
            onClick={mode === "bridge" ? handleBridge : handleWithdraw}
            className="w-full"
            disabled={
              transactionStatus.status === "PENDING" ||
              !amount ||
              (mode === "bridge" && !userInputEthAddr) ||
              (mode === "withdraw" && !selectedAccount)
            }
          >
            {mode === "bridge" ? "Bridge" : "Withdraw"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
