"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRightLeft,
  Cable,
  CreditCard,
  Info,
  LoaderCircle,
  Lock,
  LockOpen,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { toast } from "@torus-ts/toast-provider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Input,
  NoWalletExtensionDisplay,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TransactionStatus,
} from "@torus-ts/ui";
import {
  formatToken,
  fromNano,
  smallAddress,
  toNano,
} from "@torus-ts/utils/subspace";

import { usePage } from "~/context/page-provider";
import { UnstakeAction } from "./unstake";
import { AmountButtons } from "./amount-buttons";
import { FeeLabel } from "./fee-label";
import Link from "next/link";

const formSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number.",
  }),
});

export function Bridge() {
  const {
    accountBridgedBalance,
    accountFreeBalance,
    accounts,
    accountStakedBalance,
    bridge,
    bridgeWithdraw,
    bridgedBalances,
    handleGetWallets,
    handleSelectWallet,
    removeStake,
    selectedAccount,
  } = usePage();

  const [amount, setAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [valueInputError, setValueInputError] = useState<string | null>(null);
  const estimatedFee = "0.0000001000";

  const [activeTab, setActiveTab] = useState("bridge");

  const router = useRouter();
  const searchParams = useSearchParams();
  const viewMode = searchParams.get("bridge");

  const alreadyBridgedBalance = useMemo(() => {
    if (!bridgedBalances.data) return null;

    let bridgedBalancesSum = 0n;
    const balancesMap = bridgedBalances.data[0];
    for (const balance of balancesMap.values()) {
      bridgedBalancesSum += balance;
    }
    return bridgedBalancesSum;
  }, [bridgedBalances.data]);

  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      status: null,
      message: null,
      finalized: false,
    },
  );

  const handleCallback = (callbackReturn: TransactionResult) => {
    setTransactionStatus(callbackReturn);

    if (callbackReturn.status === "SUCCESS") {
      form.reset();
      setValueInputError(null);
    }
  };

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
    },
  });

  const handleGetAccounts = async () => {
    if (accounts?.length === 0) {
      await handleGetWallets();
    }
  };

  const handleWalletSelection = (accountAddress: string) => {
    const accountExists = accounts?.find(
      (account) => account.address === accountAddress,
    );

    if (!accountExists) {
      console.error("Account not found");
      return;
    }

    if (selectedAccount && selectedAccount.address === accountExists.address) {
      console.log("Account already selected");
      return;
    }

    handleSelectWallet(accountExists);
  };

  const handleAmountChange = (value: string) => {
    const newAmount = value.replace(/[^0-9.]/g, "");

    const amountNano = toNano(newAmount || "0");
    const estimatedFeeNano = toNano(estimatedFee);
    const balance =
      activeTab === "bridge"
        ? (accountFreeBalance.data ?? 0n) - estimatedFeeNano
        : (accountBridgedBalance.data ?? 0n);
    const maxAmountNano = balance > 0n ? balance : 0n;

    if (amountNano > maxAmountNano) {
      setValueInputError("Amount exceeds maximum transferable amount");
    } else {
      setValueInputError(null);
    }

    setAmount(newAmount);
  };

  const handleUpdateMaxAmount = (fee: bigint | undefined) => {
    if (!fee) return;
    const balance =
      activeTab === "bridge"
        ? (accountFreeBalance.data ?? 0n) - fee
        : (accountBridgedBalance.data ?? 0n);
    const maxAmount = balance > 0 ? balance : 0n;

    setMaxAmount(fromNano(maxAmount));

    const amountNano = toNano(amount || "0");
    if (amountNano > maxAmount) {
      setValueInputError("Amount exceeds maximum transferable amount");
    } else {
      setValueInputError(null);
    }
  };

  const refetchHandler = async () => {
    await Promise.all([
      accountFreeBalance.refetch(),
      accountBridgedBalance.refetch(),
      bridgedBalances.refetch(),
    ]);
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting transaction",
    });
    try {
      if (activeTab === "bridge") {
        await bridge({
          amount: data.amount,
          callback: handleCallback,
          refetchHandler,
        });
      } else {
        await bridgeWithdraw({
          amount: data.amount,
          callback: handleCallback,
          refetchHandler,
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error(`Error bridging assets`);
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: "Insufficient balance",
      });
    }
  };

  useEffect(() => {
    if (!accountFreeBalance.data) return;
    handleUpdateMaxAmount(toNano(estimatedFee));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountFreeBalance.data]);

  useEffect(() => {
    const amountValue = form.getValues("amount");
    handleAmountChange(amountValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch("amount")]);

  return (
    <div className="mb-6 flex flex-col gap-2">
      <AlertDialog
        onOpenChange={(isOpen: boolean) =>
          router.push(isOpen ? `/?bridge=open` : "/?bridge=closed")
        }
        open={viewMode === "open"}
      >
        <AlertDialogTrigger className="flex w-fit animate-fade flex-row items-center gap-3 overflow-hidden rounded-md border border-border bg-card p-3 px-4 transition duration-300 animate-delay-[1500ms] hover:bg-accent/30">
          <div className="flex select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/30 to-muted/50 p-4 no-underline outline-none focus:shadow-md">
            <Cable className="h-6 w-6 animate-pulse" />
          </div>
          <div className="flex flex-col items-start gap-1">
            <span>
              <span className="underline">Click here</span> to Bridge your
              assets to Torus.
            </span>
            <span className="text-sm">
              Bridge Closes: 12/31/24, 11:11 PM UTC / Total Bridged:{" "}
              {alreadyBridgedBalance
                ? `${formatToken(alreadyBridgedBalance)} COMAI `
                : "Loading..."}
            </span>
          </div>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex w-full items-center justify-between">
              <span>Bridge your assets</span>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    More Info / CLI Guide
                    <Info className="h-5 w-5 animate-pulse" />
                  </span>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <p className="mb-2 text-sm text-muted-foreground">
                    Information
                  </p>
                  <p className="mb-2 text-sm">
                    This bridge will migrate your COMAI tokens to the Torus
                    Network, while burning the COMAI on the Commune Mainnet.
                    After the bridge closes at the end of 2024, you won't be
                    able to bridge back anymore.
                  </p>
                  <p className="mb-2 text-sm text-muted-foreground">
                    CLI Guide
                  </p>
                  <p className="text-sm">
                    If you want a different approach, you can use the{" "}
                    <Link
                      target="_blank"
                      href="https://github.com/renlabs-dev/communex"
                      className="underline"
                    >
                      CLI
                    </Link>{" "}
                    through the{" "}
                    <span className="rounded-md bg-accent p-0.5">bridge</span>{" "}
                    and{" "}
                    <span className="rounded-md bg-accent p-0.5">
                      bridge_withdraw
                    </span>{" "}
                    methods (Remember to update your CLI to the latest version).
                  </p>
                </HoverCardContent>
              </HoverCard>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Select the wallet you want to bridge assets from:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <DropdownMenu onOpenChange={handleGetAccounts}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {selectedAccount ? (
                  <span>
                    {selectedAccount.meta.name} (
                    {smallAddress(selectedAccount.address, 12)})
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CreditCard size={17} />
                    Select Wallet
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border border-muted">
              <ScrollArea className="overflow-y-auto">
                <DropdownMenuRadioGroup
                  value={selectedAccount?.address ?? ""}
                  onValueChange={handleWalletSelection}
                >
                  {!accounts && (
                    <span className="flex items-center gap-1.5 px-1.5 py-2">
                      <LoaderCircle className="rotate animate-spin" />
                      Loading wallets...
                    </span>
                  )}

                  {accounts?.map((account) => (
                    <DropdownMenuRadioItem
                      key={account.address}
                      value={account.address}
                      disabled={account.address === selectedAccount?.address}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span className="flex flex-col items-start justify-start gap-1">
                          <span>{account.meta.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {smallAddress(account.address)}
                          </span>
                        </span>
                      </div>
                    </DropdownMenuRadioItem>
                  ))}

                  {accounts?.length === 0 && <NoWalletExtensionDisplay />}
                </DropdownMenuRadioGroup>
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          {selectedAccount && (
            <div className="flex justify-between gap-2">
              <Card className="flex w-full flex-col items-center gap-2 p-3">
                <div className="flex flex-row items-center gap-1">
                  <LockOpen className="h-3 w-3" />{" "}
                  <p className="text-sm">Balance</p>
                </div>
                <p className="text-xs">
                  {formatToken(accountFreeBalance.data ?? 0n)} COMAI
                </p>
              </Card>
              <Card className="flex w-full flex-col items-center gap-2 p-3">
                <div className="flex flex-row items-center gap-1">
                  <Lock className="h-3 w-3" /> <p className="text-sm">Staked</p>
                </div>
                <p className="text-xs">
                  {formatToken(accountStakedBalance ?? 0n)} COMAI
                </p>
              </Card>
              <Card className="flex w-full flex-col items-center gap-2 p-3">
                <div className="flex flex-row items-center gap-1">
                  <ArrowRightLeft className="h-3 w-3" />{" "}
                  <p className="text-sm">Bridged</p>
                </div>
                <p className="text-xs">
                  {formatToken(accountBridgedBalance.data ?? 0n)} TOR
                </p>
              </Card>
            </div>
          )}

          <Card
            className={`mb-2 px-4 ${
              accountStakedBalance && accountStakedBalance > 0n ? "" : "hidden"
            }`}
          >
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-b-0">
                <AccordionTrigger>
                  Want to unstake your balance?
                </AccordionTrigger>
                <AccordionContent>
                  <UnstakeAction
                    removeStake={removeStake}
                    balance={accountFreeBalance.data}
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    selectedAccount={selectedAccount!}
                    userStakeWeight={accountStakedBalance}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
          <Tabs
            defaultValue="bridge"
            className="w-full rounded-md border border-border p-4"
            onValueChange={setActiveTab}
          >
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="bridge">Bridge</TabsTrigger>
              <TabsTrigger value="bridge-withdraw">Bridge Withdraw</TabsTrigger>
            </TabsList>
            <TabsContent value="bridge">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="z-50 space-y-8"
                >
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex gap-1">
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0.00"
                              {...field}
                              disabled={!(toNano(maxAmount) > 0n)}
                            />
                          </FormControl>
                          <AmountButtons
                            setAmount={(amount) =>
                              form.setValue("amount", amount)
                            }
                            availableFunds={maxAmount}
                            disabled={
                              !selectedAccount || !(toNano(maxAmount) > 0n)
                            }
                          />
                        </div>
                        {valueInputError && (
                          <span className="-mt-1 mb-1 flex text-left text-sm text-red-400">
                            {valueInputError}
                          </span>
                        )}
                        <FormMessage />
                        <FormDescription className="flex flex-col gap-2">
                          Enter the amount of COMAI you want to bridge.
                        </FormDescription>
                        <AlertDialogFooter>
                          <div className="mt-6 flex w-full items-center justify-between">
                            <div className="mb-1 mr-2.5">
                              {transactionStatus.status && (
                                <TransactionStatus
                                  status={transactionStatus.status}
                                  message={transactionStatus.message}
                                />
                              )}
                              {!transactionStatus.status && (
                                <FeeLabel
                                  isEstimating={false}
                                  estimatedFee={estimatedFee}
                                />
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <AlertDialogCancel className="mt-0">
                                Cancel
                              </AlertDialogCancel>
                              <Button type="submit" disabled={!selectedAccount}>
                                Bridge Assets
                              </Button>
                            </div>
                          </div>
                        </AlertDialogFooter>
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="bridge-withdraw">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(async (data) => {
                    setTransactionStatus({
                      status: "STARTING",
                      finalized: false,
                      message: "Starting transaction",
                    });
                    try {
                      await bridgeWithdraw({
                        amount: data.amount,
                        callback: handleCallback,
                        refetchHandler,
                      });
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (error) {
                      toast.error(`Error withdrawing bridged assets`);
                      setTransactionStatus({
                        status: "ERROR",
                        finalized: true,
                        message: "Insufficient bridged balance",
                      });
                    }
                  })}
                  className="z-50 space-y-8"
                >
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex gap-1">
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0.00"
                              {...field}
                              disabled={!(toNano(maxAmount) > 0n)}
                            />
                          </FormControl>
                          <AmountButtons
                            setAmount={(amount) =>
                              form.setValue("amount", amount)
                            }
                            availableFunds={fromNano(
                              accountBridgedBalance.data ?? 0n,
                            )}
                            disabled={
                              !selectedAccount || !(toNano(maxAmount) > 0n)
                            }
                          />
                        </div>
                        {valueInputError && (
                          <span className="-mt-1 mb-1 flex text-left text-sm text-red-400">
                            {valueInputError}
                          </span>
                        )}
                        <FormMessage />
                        <FormDescription className="flex flex-col gap-2">
                          Enter the amount of bridged TOR you want to withdraw.
                        </FormDescription>
                        <AlertDialogFooter>
                          <div className="mt-6 flex w-full items-center justify-between">
                            <div className="mb-1 mr-2.5">
                              {transactionStatus.status && (
                                <TransactionStatus
                                  status={transactionStatus.status}
                                  message={transactionStatus.message}
                                />
                              )}
                              {!transactionStatus.status && (
                                <FeeLabel
                                  isEstimating={false}
                                  estimatedFee={estimatedFee}
                                />
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <AlertDialogCancel className="mt-0">
                                Cancel
                              </AlertDialogCancel>
                              <Button type="submit" disabled={!selectedAccount}>
                                Withdraw Assets
                              </Button>
                            </div>
                          </div>
                        </AlertDialogFooter>
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </AlertDialogContent>
      </AlertDialog>
      <span className="flex justify-center text-sm text-zinc-400">
        v0 mainnet launch on january 3rd
      </span>
    </div>
  );
}
