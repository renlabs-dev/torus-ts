"use client";

import {
  convertH160ToSS58,
  waitForTransactionReceipt,
  withdrawFromTorusEvm,
} from "@torus-network/sdk/evm";
import type { SS58Address } from "@torus-network/sdk";
import { smallAddress, toNano } from "@torus-network/torus-utils/subspace";
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
import type { Config } from "wagmi";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

const DEFAULT_MODE = "bridge";

export function TransferEVM() {
  // Create a flag to track client-side rendering
  const [hasMounted, setHasMounted] = useState(false);

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

  // Safe way to get mode param without causing hydration errors
  const [mode, setMode] = useState<"bridge" | "withdraw">(DEFAULT_MODE);

  // Initialize wagmiConfig after component mount - explicitly define the type
  const [wagmiConfig, setWagmiConfig] = useState<Config | null>(null);

  // This effect runs only once on client-side after mounting
  useEffect(() => {
    setHasMounted(true);

    // Now it's safe to access search params
    const modeParam = searchParams.get("mode") as "bridge" | "withdraw" | null;
    setMode(modeParam ?? DEFAULT_MODE);

    // Initialize wagmi configuration after mount
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (multiProvider) {
      const [wagmiErr, wagmiInit] = trySync(() => initWagmi(multiProvider));
      if (wagmiErr !== undefined) {
        console.error("Failed to initialise wagmi:", wagmiErr);
        toast.error("Wallet initialisation failed, please refresh.");
      } else {
        setWagmiConfig(wagmiInit.wagmiConfig);
      }
    }
  }, [multiProvider, searchParams, toast]);

  // Update mode when search params change (after initial mount)
  useEffect(() => {
    if (hasMounted) {
      const modeParam = searchParams.get("mode") as
        | "bridge"
        | "withdraw"
        | null;
      setMode(modeParam ?? DEFAULT_MODE);
    }
  }, [hasMounted, searchParams]);

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
    if (hasMounted && !torusEvmClient) {
      console.error("Torus EVM client not found");
    }
  }, [hasMounted, torusEvmClient]);

  useEffect(() => {
    if (
      mode === "withdraw" &&
      chain &&
      chain.id !== torusEvmChainId &&
      hasMounted
    ) {
      switchChain({ chainId: torusEvmChainId });
    }
  }, [mode, chain, torusEvmChainId, hasMounted, switchChain]);

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

    const [error] = await tryAsync(
      transfer({
        amount: amount,
        to: evmSS58Addr,
        refetchHandler,
        callback: handleCallback,
      }),
    );

    if (error !== undefined) {
      console.error("Error during bridge transfer:", error);
      setTransactionStatus({
        status: "ERROR",
        message: "Something went wrong with your transaction",
        finalized: true,
      });
    }
  }, [amount, evmSS58Addr, transfer, refetchHandler, handleCallback]);

  const handleWithdraw = useCallback(async () => {
    // Check for required values
    if (
      !amount ||
      !walletClient ||
      !chain ||
      !selectedAccount ||
      !wagmiConfig
    ) {
      toast.error("Please try again later.");
      return;
    }

    if (chain.id !== torusEvmChainId) {
      toast({
        title: "Switching networks...",
        description: "Please wait while we switch to the Torus EVM network.",
      });
      return;
    }

    setTransactionStatus({
      status: "STARTING",
      message: "Transaction in progress, sign in your wallet",
      finalized: false,
    });

    // Withdraw from Torus EVM
    const [withdrawError, txHash] = await tryAsync(
      withdrawFromTorusEvm(
        walletClient,
        chain,
        selectedAccount.address as SS58Address,
        amountRems,
        refetchHandler,
      ),
    );

    if (withdrawError !== undefined) {
      console.error("Error withdrawing from Torus EVM:", withdrawError);
      setTransactionStatus({
        status: "ERROR",
        message: "Something went wrong with your transaction",
        finalized: true,
      });

      // Still perform refetch and reset transaction status
      const [refetchError] = await tryAsync(refetchHandler());
      if (refetchError !== undefined) {
        console.error("Error refetching after failed withdraw:", refetchError);
      }

      setTransactionStatus({
        status: null,
        message: null,
        finalized: false,
      });

      return;
    }

    setTransactionStatus({
      status: "SUCCESS",
      message: `Transaction included in the blockchain!`,
      finalized: true,
    });

    toast({
      title: "Loading...",
      description: renderWaitingForValidation(txHash),
    });

    // Wait for transaction receipt
    const [receiptError] = await tryAsync(
      waitForTransactionReceipt(wagmiConfig, {
        hash: txHash,
        confirmations: 2,
      }),
    );

    if (receiptError !== undefined) {
      console.error("Error waiting for transaction receipt:", receiptError);
      toast.error("Failed to confirm transaction.");
    } else {
      toast({
        title: "Success!",
        description: renderSuccessfulyFinalized(txHash),
      });

      setAmount("");
    }

    // Always refetch and reset transaction status
    const [finalRefetchError] = await tryAsync(refetchHandler());
    if (finalRefetchError !== undefined) {
      console.error("Error during final refetch:", finalRefetchError);
    }

    setTransactionStatus({
      status: null,
      message: null,
      finalized: false,
    });
  }, [
    amount,
    walletClient,
    chain,
    selectedAccount,
    torusEvmChainId,
    amountRems,
    refetchHandler,
    wagmiConfig,
    toast,
  ]);

  const handleSelfClick = useCallback(() => {
    if (address) {
      setUserInputEthAddr(address);
    } else {
      toast.error("No account found. Is your wallet connected?");
    }
  }, [address, toast]);

  const handleMaxClick = useCallback(() => {
    if (mode === "bridge") {
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
  }, [mode, userAccountFreeBalance, torusEvmBalance]);

  const toggleMode = useCallback(() => {
    const newQuery = updateSearchParams(searchParams, {
      from: null,
      to: null,
      mode: mode === "bridge" ? "withdraw" : "bridge",
    });
    router.push(`/?${newQuery}`);
  }, [mode, router, searchParams]);

  const fromChain = mode === "bridge" ? "Torus" : "Torus EVM";
  const toChain = mode === "bridge" ? "Torus EVM" : "Torus";

  // Don't render until mounted on client side to avoid hydration errors
  if (!hasMounted) {
    return null;
  }

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

        {mode === "withdraw" && selectedAccount && (
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
        className="hover:bg-background flex w-full items-center justify-between p-2 px-0
          hover:cursor-default disabled:opacity-100"
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
      rel="noreferrer"
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
      rel="noreferrer"
    >
      View on block explorer
    </a>
  </div>
);
