"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, LoaderCircle, Replace } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { TransactionResult } from "@torus-ts/ui";
import { toast } from "@torus-ts/providers/use-toast";
import { useTorus } from "@torus-ts/providers/use-torus";
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertTitle,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  ScrollArea,
  TransactionStatus,
} from "@torus-ts/ui";
import { formatToken, smallAddress } from "@torus-ts/utils/subspace";

const formSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number.",
  }),
});

export function Bridge() {
  const {
    accounts,
    balance,
    handleGetWallets,
    handleSelectWallet,
    selectedAccount,
    stakeOut,
    bridge,
  } = useTorus();

  const [isOpen, setIsOpen] = useState(false);

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

  const userStakeWeight = useMemo(() => {
    if (stakeOut != null && selectedAccount != null) {
      const userStakeEntry = stakeOut.perAddr[selectedAccount.address];
      return userStakeEntry ?? 0n;
    }
    return 0n;
  }, [stakeOut, selectedAccount]);

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
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger>
        <Alert className="flex flex-col items-start transition duration-100 hover:bg-accent/50">
          <Replace className="h-5 w-5" />
          <AlertTitle className="font-bold">
            Click here to Bridge your assets to Torus! (30 days left)
          </AlertTitle>
          <AlertDescription>
            You can now bridge your assets from Commune AI to Torus Network for
            a limited period of time.
          </AlertDescription>
        </Alert>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bridge your assets</AlertDialogTitle>
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
                  {smallAddress(selectedAccount.address)})
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
            <DropdownMenuLabel>
              Select a wallet to bridge from
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
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
          <div className="mt-4">
            <div>Selected Wallet: {selectedAccount.meta.name}</div>
            <div>Address: {smallAddress(selectedAccount.address)}</div>
            <div>Balance: {formatToken(balance ?? 0n)} TOR</div>
            <div>Staked: {formatToken(userStakeWeight)} TOR</div>
          </div>
        )}

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
