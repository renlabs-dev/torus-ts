"use client";

import { useAccount, useWalletClient } from "wagmi";
import { useState } from "react";
import { convertH160ToSS58, withdrawFromTorusEvm } from "@torus-ts/subspace";
import { useTorus } from "@torus-ts/torus-provider";
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui";
import { toNano } from "@torus-ts/utils/subspace";
import type { SS58Address } from "@torus-ts/subspace";
import { toast } from "@torus-ts/toast-provider";

export function TransferEVM() {
  const [mode, setMode] = useState<"bridge" | "withdraw">("bridge");
  const [amount, setAmount] = useState<string>("");
  const [userInputEthAddr, setUserInputEthAddr] = useState<string>("");

  const { transfer, selectedAccount } = useTorus();
  const { data: walletClient } = useWalletClient();
  const { chain, address } = useAccount();

  const evmSS58Addr = userInputEthAddr
    ? convertH160ToSS58(userInputEthAddr)
    : "";
  const amountRems = amount ? toNano(parseFloat(amount)) : BigInt(0);

  async function handleBridge() {
    if (!amount || !evmSS58Addr) return;
    await transfer({
      amount: amount,
      to: evmSS58Addr,
      refetchHandler: () => Promise.resolve(),
    });
  }

  async function handleWithdraw() {
    if (
      !amount ||
      walletClient == null ||
      chain == null ||
      selectedAccount == null
    ) {
      throw new Error("Invalid state for withdrawal");
    }
    const txHash = await withdrawFromTorusEvm(
      walletClient,
      chain,
      selectedAccount.address as SS58Address,
      amountRems,
    );
    console.log("Transaction sent:", txHash);
  }

  const handleSelfClick = () => {
    if (address) {
      setUserInputEthAddr(address);
    } else {
      toast.warn("No account found. Is your wallet connected?");
    }
  };

  return (
    <Card>
      <CardContent>
        <div className="mt-6 space-y-4">
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

          <div>
            <Label htmlFor="amount">Amount (TOR)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>

          {mode === "bridge" && (
            <div>
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
                <Button
                  type="button"
                  onClick={handleSelfClick}
                  variant="outline"
                >
                  Self
                </Button>
              </div>
              {/* {evmSS58Addr && (
                <div>
                  <Label>Converted SS58 Address</Label>
                  <div className="text-sm text-gray-500">{evmSS58Addr}</div>
                </div>
              )} */}
            </div>
          )}

          {mode === "withdraw" && selectedAccount && (
            <div>
              <Label>Withdrawing to</Label>
              <div className="text-sm text-gray-500">
                {selectedAccount.address}
              </div>
            </div>
          )}

          <Button
            onClick={mode === "bridge" ? handleBridge : handleWithdraw}
            className="w-full"
            disabled={
              !amount ||
              (mode === "bridge" && !userInputEthAddr) ||
              (mode === "withdraw" && !selectedAccount)
            }
          >
            {mode === "bridge" ? "Bridge" : "Withdraw"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
