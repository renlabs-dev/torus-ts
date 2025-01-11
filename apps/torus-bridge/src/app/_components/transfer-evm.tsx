"use client";

import { useAccount, useWalletClient } from "wagmi";
import { useCallback, useMemo, useState } from "react";
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
  TransactionStatus,
} from "@torus-ts/ui";
import { smallAddress, toNano } from "@torus-ts/utils/subspace";
import type { SS58Address } from "@torus-ts/subspace";
import { toast } from "@torus-ts/toast-provider";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import Image from "next/image";
import { ArrowLeftRight } from "lucide-react";
import * as wagmi from "wagmi";
import { getChainValuesOnEnv } from "~/config";
import { env } from "~/env";
import { useFreeBalance } from "@torus-ts/query-provider/hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { updateSearchParams } from "~/utils/query-params";

const DEFAULT_MODE = "bridge";

export function TransferEVM() {
  const [amount, setAmount] = useState<string>("");
  const [userInputEthAddr, setUserInputEthAddr] = useState<string>("");
  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      status: null,
      message: null,
      finalized: false,
    },
  );

  const searchParams = useSearchParams();
  const router = useRouter();

  const currentMode = useMemo(() => {
    return (
      (searchParams.get("mode") as "bridge" | "withdraw" | null) ?? DEFAULT_MODE
    );
  }, [searchParams]);

  const toggleMode = () => {
    const newQuery = updateSearchParams(searchParams, {
      from: null,
      to: null,
      mode: currentMode === "bridge" ? "withdraw" : "bridge",
    });
    router.push(`/?${newQuery}`);
  };

  const { transfer, selectedAccount, isInitialized, isAccountConnected, api } =
    useTorus();
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
      setTransactionStatus({
        status: "SUCCESS",
        message: `Transaction sent: ${smallAddress(txHash)}`,
        finalized: true,
      });
      setAmount("");
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

  const fromChain = currentMode === "bridge" ? "Torus" : "Torus EVM";
  const toChain = currentMode === "bridge" ? "Torus EVM" : "Torus";

  const getChainValues = getChainValuesOnEnv(env.NEXT_PUBLIC_CHAIN_ENV);

  const { chainId: torusEvmChainId } = getChainValues("torus");
  const { address: evmAddress } = wagmi.useAccount();

  const torusEvmClient = wagmi.useClient({ chainId: torusEvmChainId });
  if (torusEvmClient == null) throw new Error("Torus EVM client not found");

  const { chain: torusEvmChain } = torusEvmClient;

  const { data: torusEvmBalance } = wagmi.useBalance({
    address: evmAddress,
    chainId: torusEvmChain.id,
  });

  const accountFreeBalance = useFreeBalance(
    api,
    selectedAccount?.address as SS58Address,
  );

  const userAccountFreeBalance = useCallback(() => {
    if (
      !isInitialized ||
      !isAccountConnected ||
      accountFreeBalance.isRefetching
    )
      return null;

    if (accountFreeBalance.data != null) {
      return accountFreeBalance.data;
    }

    return 0n;
  }, [accountFreeBalance, isAccountConnected, isInitialized]);

  const handleMaxClick = useCallback(() => {
    if (currentMode === "bridge") {
      const maxBalance = userAccountFreeBalance();
      if (maxBalance !== null) {
        const maxBalanceString = (Number(maxBalance) / 1e18).toFixed(18);

        setAmount(maxBalanceString.replace(/\.?0+$/, ""));
      }
    } else {
      // withdraw mode
      if (torusEvmBalance?.value) {
        const maxBalanceString = (Number(torusEvmBalance.value) / 1e18).toFixed(
          18,
        );

        setAmount(maxBalanceString.replace(/\.?0+$/, ""));
      }
    }
  }, [currentMode, userAccountFreeBalance, torusEvmBalance]);

  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      <Card className="flex w-full animate-fade flex-col gap-4 space-y-4 p-6 md:w-3/5">
        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="w-full">
              <ChainField name="from" label="From" chainName={fromChain} />
            </div>
            <div className="flex flex-1 flex-col items-center">
              <SwapActionButton onClick={toggleMode} />
            </div>
            <div className="w-full">
              <ChainField name="to" label="To" chainName={toChain} />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount (TORUS)</Label>
          <div className="flex w-full items-center gap-2">
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
            <Button type="button" onClick={handleMaxClick} variant="outline">
              Max
            </Button>
          </div>
        </div>

        {currentMode === "bridge" && (
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

        {currentMode === "withdraw" && selectedAccount && (
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
              {currentMode === "bridge"
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
          {currentMode === "bridge" && (
            <div className="flex items-center justify-between">
              <span>To Address:</span>
              <span className="max-w-[200px] truncate text-zinc-400">
                {smallAddress(userInputEthAddr)}
              </span>
            </div>
          )}
          {currentMode === "withdraw" && selectedAccount && (
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
            onClick={currentMode === "bridge" ? handleBridge : handleWithdraw}
            className="w-full"
            disabled={
              transactionStatus.status === "PENDING" ||
              !amount ||
              (currentMode === "bridge" && !userInputEthAddr) ||
              (currentMode === "withdraw" && !selectedAccount)
            }
          >
            {currentMode === "bridge" ? "Bridge" : "Withdraw"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

interface ChainFieldProps {
  name: string;
  label: string;
  chainName: string;
}

function ChainField({ label, chainName }: ChainFieldProps) {
  const isTorusEVM = chainName === "Torus EVM";
  return (
    <div className="flex w-full flex-col gap-2">
      <Label>{label}</Label>
      <Button
        size="lg"
        variant="outline"
        disabled={true}
        className="flex w-full items-center justify-between p-2 px-0 hover:cursor-default hover:bg-background disabled:opacity-100"
      >
        <div className="max-w-[1.4rem] border-r p-[0.65em] sm:max-w-fit">
          <Image
            src={
              isTorusEVM
                ? "/torus-evm-balance-icon.svg"
                : "/torus-balance-icon.svg"
            }
            alt={label}
            width={28}
            height={28}
          />
        </div>
        <span className="w-full">{chainName}</span>
      </Button>
    </div>
  );
}

function SwapActionButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon" className="h-10 w-10" onClick={onClick}>
      <ArrowLeftRight className="h-4 w-4" />
      <span className="sr-only">Swap chains</span>
    </Button>
  );
}
