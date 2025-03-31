"use client";

import {
  convertH160ToSS58,
  waitForTransactionReceipt,
  withdrawFromTorusEvm,
} from "@torus-network/sdk";
import type { SS58Address } from "@torus-network/sdk";
import { useFreeBalance } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { Button } from "@torus-ts/ui/components/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@torus-ts/ui/components/card";
import { Input } from "@torus-ts/ui/components/input";
import { Label } from "@torus-ts/ui/components/label";
import { TransactionStatus } from "@torus-ts/ui/components/transaction-status";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { smallAddress, toNano } from "@torus-network/torus-utils/subspace";
import { getChainValuesOnEnv } from "~/config";
import { initWagmi } from "~/context/evm-wallet-provider";
import { env } from "~/env";
import { useMultiProvider } from "~/hooks/use-multi-provider";
import { updateSearchParams } from "~/utils/query-params";
import { ArrowLeftRight } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useBalance,
  useClient,
  useSwitchChain,
  useWalletClient,
} from "wagmi";

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
  const multiProvider = useMultiProvider();
  const { toast } = useToast();

  const { transfer, selectedAccount, isInitialized, isAccountConnected, api } =
    useTorus();
  const { data: walletClient } = useWalletClient();
  const { chain, address } = useAccount();
  const { switchChain } = useSwitchChain();

  const getChainValues = getChainValuesOnEnv(
    env("NEXT_PUBLIC_TORUS_CHAIN_ENV"),
  );
  const { chainId: torusEvmChainId } = getChainValues("torus");

  const { address: evmAddress } = useAccount();
  const torusEvmClient = useClient({ chainId: torusEvmChainId });

  const { data: torusEvmBalance, refetch: refetchTorusEvmBalance } = useBalance(
    {
      address: evmAddress,
      chainId: torusEvmChainId,
    },
  );

  const accountFreeBalance = useFreeBalance(
    api,
    selectedAccount?.address as SS58Address,
  );

  const currentMode = useMemo(() => {
    return (
      (searchParams.get("mode") as "bridge" | "withdraw" | null) ?? DEFAULT_MODE
    );
  }, [searchParams]);

  const { wagmiConfig } = useMemo(
    () => initWagmi(multiProvider),
    [multiProvider],
  );

  const evmSS58Addr = useMemo(
    () => (userInputEthAddr ? convertH160ToSS58(userInputEthAddr) : ""),
    [userInputEthAddr],
  );

  const amountRems = useMemo(
    () => (amount ? toNano(parseFloat(amount)) : BigInt(0)),
    [amount],
  );

  const userAccountFreeBalance = useCallback(() => {
    if (
      !isInitialized ||
      !isAccountConnected ||
      accountFreeBalance.isRefetching
    )
      return null;
    return accountFreeBalance.data ?? 0n;
  }, [accountFreeBalance, isAccountConnected, isInitialized]);

  useEffect(() => {
    if (!torusEvmClient) {
      console.error("Torus EVM client not found");
    }
  }, [torusEvmClient]);

  const refetchHandler = useCallback(async () => {
    await Promise.all([refetchTorusEvmBalance(), accountFreeBalance.refetch()]);
  }, [refetchTorusEvmBalance, accountFreeBalance]);

  const handleCallback = useCallback((callbackReturn: TransactionResult) => {
    setTransactionStatus(callbackReturn);
    if (callbackReturn.status === "SUCCESS") {
      setAmount("");
      setUserInputEthAddr("");
    }
  }, []);

  const handleBridge = useCallback(async () => {
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
        refetchHandler,
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
  }, [amount, evmSS58Addr, transfer, refetchHandler, handleCallback]);

  const handleWithdraw = useCallback(async () => {
    if (
      !amount ||
      walletClient == null ||
      chain == null ||
      selectedAccount == null
    ) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: "Please try again later.",
      });
      return;
    }
    if (chain.id !== torusEvmChainId) {
      try {
        switchChain({ chainId: torusEvmChainId });
        toast({
          title: "Wait, you were connected to the wrong network.",
          description:
            "We switched you to Torus. Please try to withdraw again.",
        });
        return;
      } catch {
        toast({
          title: "Uh oh! Something went wrong.",
          description: "Failed to switch network.",
        });
        return;
      }
    }
    setTransactionStatus({
      status: "STARTING",
      message: "Transaction in progress, sign in your wallet",
      finalized: false,
    });
    try {
      const txHash = await withdrawFromTorusEvm(
        walletClient,
        chain,
        selectedAccount.address as SS58Address,
        amountRems,
        refetchHandler,
      );
      setTransactionStatus({
        status: "SUCCESS",
        message: `Transaction included in the blockchain!`,
        finalized: true,
      });

      toast({
        title: "Loading...",
        description: renderWaitingForValidation(txHash),
      });
      await waitForTransactionReceipt(wagmiConfig, {
        hash: txHash,
        confirmations: 2,
      });
      toast({
        title: "Success!",
        description: renderSuccessfulyFinalized(txHash),
      });

      setAmount("");
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setTransactionStatus({
        status: "ERROR",
        message: "Something went wrong with your transaction",
        finalized: true,
      });
    } finally {
      await refetchHandler();
      setTransactionStatus({
        status: null,
        message: null,
        finalized: false,
      });
    }
  }, [
    amount,
    walletClient,
    chain,
    selectedAccount,
    torusEvmChainId,
    switchChain,
    amountRems,
    refetchHandler,
    wagmiConfig,
    toast,
  ]);

  const handleSelfClick = useCallback(() => {
    if (address) {
      setUserInputEthAddr(address);
    } else {
      toast({
        title: "Uh oh! Something went wrong.",
        description: "No account found. Is your wallet connected?",
      });
    }
  }, [address, toast]);

  const handleMaxClick = useCallback(() => {
    if (currentMode === "bridge") {
      let maxBalance = userAccountFreeBalance();
      if (maxBalance !== null) {
        maxBalance = maxBalance - 1n * BigInt(1e18);
        const maxBalanceString = (Number(maxBalance) / 1e18).toFixed(18);
        setAmount(maxBalanceString.replace(/\.?0+$/, ""));
      }
    } else {
      if (torusEvmBalance?.value) {
        const paddedAmount = torusEvmBalance.value - 1n * BigInt(1e16);
        const maxBalanceString = (Number(paddedAmount) / 1e18).toFixed(18);
        setAmount(maxBalanceString.replace(/\.?0+$/, ""));
      }
    }
  }, [currentMode, userAccountFreeBalance, torusEvmBalance]);

  const toggleMode = useCallback(() => {
    const newQuery = updateSearchParams(searchParams, {
      from: null,
      to: null,
      mode: currentMode === "bridge" ? "withdraw" : "bridge",
    });
    router.push(`/?${newQuery}`);
  }, [currentMode, router, searchParams]);

  const fromChain = currentMode === "bridge" ? "Torus" : "Torus EVM";
  const toChain = currentMode === "bridge" ? "Torus EVM" : "Torus";

  return (
    <div className="flex w-full flex-col gap-4 md:flex-row">
      <Card className="animate-fade flex w-full flex-col gap-4 space-y-4 p-6 md:w-3/5">
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
              disabled={!selectedAccount?.address}
            />
            <Button
              type="button"
              onClick={handleMaxClick}
              variant="outline"
              disabled={!selectedAccount?.address}
            >
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
                disabled={!selectedAccount?.address}
                className="flex-grow"
              />
              <Button
                type="button"
                onClick={handleSelfClick}
                variant="outline"
                disabled={!selectedAccount?.address}
              >
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
      <Card className="animate-fade flex w-full flex-col justify-between p-6 md:w-2/5">
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
        className="hover:bg-background flex w-full items-center justify-between p-2 px-0 hover:cursor-default disabled:opacity-100"
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

const divStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  color: "hsl(240 5% 64.9%)",
};

const linkStyle: CSSProperties = {
  color: "white",
  textDecoration: "underline",
  fontSize: "0.875rem",
  cursor: "pointer",
};

export const renderWaitingForValidation = (hash: string) => (
  <div style={divStyle}>
    <p>Validating transaction in block.</p>
    <a
      style={linkStyle}
      target="_blank"
      href={`https://blockscout.torus.network/tx/${hash}`}
    >
      View on block explorer
    </a>
  </div>
);

export const renderSuccessfulyFinalized = (hash: string) => (
  <div style={divStyle}>
    <p>Transfer completed successfully</p>
    <a
      style={linkStyle}
      target="_blank"
      href={`https://blockscout.torus.network/tx/${hash}`}
    >
      View on block explorer
    </a>
  </div>
);
