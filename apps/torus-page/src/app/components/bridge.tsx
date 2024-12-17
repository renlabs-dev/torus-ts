"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRightLeft,
  CreditCard,
  Info,
  LoaderCircle,
  Lock,
  LockOpen,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { toast } from "@torus-ts/providers/use-toast";
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
  cn,
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
  FormLabel,
  FormMessage,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Input,
  ScrollArea,
  TransactionStatus,
} from "@torus-ts/ui";
import { formatToken, smallAddress } from "@torus-ts/utils/subspace";

import { usePage } from "~/context/page-provider";
import { UnstakeAction } from "./unstake";

const formSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number.",
  }),
});

export function Bridge() {
  const {
    accounts,
    selectedAccount,
    accountFreeBalance,
    accountStakedBalance,
    accountBridgedBalance,

    handleGetWallets,
    handleSelectWallet,

    bridge,
    removeStake,

    bridgedBalances,
  } = usePage();

  const router = useRouter();
  const searchParams = useSearchParams();

  let bridgedBalancesSum = 0n;

  if (bridgedBalances.data) {
    const balancesMap = bridgedBalances.data[0];
    for (const balance of balancesMap.values()) {
      bridgedBalancesSum += balance;
    }
  }

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const bridgeParam = searchParams.get("bridge");
    if (bridgeParam === "open" && !isOpen) {
      setIsOpen(true);
    } else if (bridgeParam !== "open" && isOpen) {
      setIsOpen(false);
    }
  }, [searchParams, isOpen]);

  const setIsOpenAndUpdateURL = (open: boolean) => {
    setIsOpen(open);
    const newSearchParams = new URLSearchParams(searchParams);
    if (open) {
      newSearchParams.set("bridge", "open");
    } else {
      newSearchParams.delete("bridge");
    }
    router.push(`?${newSearchParams.toString()}`, { scroll: false });
  };

  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      status: null,
      message: null,
      finalized: false,
    },
  );

  const handleCallback = (callbackReturn: TransactionResult) => {
    setTransactionStatus(callbackReturn);

    if (
      callbackReturn.status === "SUCCESS" ||
      callbackReturn.status === "ERROR"
    ) {
      form.reset();
      setIsOpen(false);
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

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting transaction",
    });
    try {
      await bridge({ amount: data.amount, callback: handleCallback });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error(`Error bridging assets`);
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: "Insufficient balance",
      });
      // Close the modal on error
      setIsOpen(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpenAndUpdateURL}>
      <AlertDialogTrigger className="mt-6 flex w-fit flex-col items-center gap-2 overflow-hidden rounded-md border border-border bg-card p-3 px-4">
        <span>
          <span className="underline">Click here</span> to Bridge your assets to
          Torus.
        </span>
        <span className="text-sm">
          (Bridge Closes: 1/1/25, 1:00 PM UTC) / Total Bridged:{" "}
          {formatToken(bridgedBalancesSum)} TOR
        </span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex w-full items-center justify-between">
            <span>Bridge your assets</span>
            <HoverCard>
              <HoverCardTrigger asChild>
                <Info className="h-5 w-5" />
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <p className="text-sm">
                  Bridge your COMAI assets to the Torus Network. This will allow
                  you to use your COMAI assets on the Torus Network,{" "}
                  <Link
                    href="/bridge"
                    target="_blank"
                    className="text-primary underline"
                  >
                    Learn more
                  </Link>
                  .
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
          <DropdownMenuContent className={cn("border border-muted")}>
            <ScrollArea className={cn("overflow-y-auto")}>
              <DropdownMenuRadioGroup
                value={selectedAccount?.address ?? ""}
                onValueChange={handleWalletSelection}
              >
                {!accounts && (
                  <span className={cn("flex items-center gap-1.5 px-1.5 py-2")}>
                    <LoaderCircle className={cn("rotate animate-spin")} />
                    Loading wallets...
                  </span>
                )}
                {accounts?.map((account) => (
                  <DropdownMenuRadioItem
                    key={account.address}
                    value={account.address}
                  >
                    <div className={cn("flex flex-col items-center gap-2")}>
                      <span
                        className={cn(
                          "flex flex-col items-start justify-start gap-1",
                        )}
                      >
                        <span>{account.meta.name}</span>
                        <span className={cn("text-xs text-muted-foreground")}>
                          {smallAddress(account.address)}
                        </span>
                      </span>
                    </div>
                  </DropdownMenuRadioItem>
                ))}
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
        <Card className="mb-2 px-4">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-b-0">
              <AccordionTrigger>Want to unstake your balance?</AccordionTrigger>
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount to Bridge</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter the amount of COMAI you want to bridge.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AlertDialogFooter>
              <div className="flex w-full items-center justify-between">
                <div className="mb-1">
                  {transactionStatus.status && (
                    <TransactionStatus
                      status={transactionStatus.status}
                      message={transactionStatus.message}
                    />
                  )}
                </div>
                <div className="flex gap-2">
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <Button type="submit" disabled={!selectedAccount}>
                    Bridge Assets
                  </Button>
                </div>
              </div>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
