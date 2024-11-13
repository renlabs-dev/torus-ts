"use client";

import { useMemo, useState } from "react";
import { CreditCard, LoaderCircle, Replace } from "lucide-react";

import type { InjectedAccountWithMeta } from "@torus-ts/ui";
import { useTorus } from "@torus-ts/providers/use-torus";
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ScrollArea,
} from "@torus-ts/ui";
import { formatToken, smallAddress } from "@torus-ts/utils";

export function Bridge() {
  const {
    accounts,
    balance,
    handleGetWallets,
    handleSelectWallet,
    selectedAccount,
    stakeOut,
  } = useTorus();
  const [bridgeAccount, setBridgeAccount] =
    useState<InjectedAccountWithMeta | null>(null);

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

    setBridgeAccount(accountExists);
  };

  const userStakeWeight = useMemo(() => {
    if (stakeOut != null && bridgeAccount != null) {
      const userStakeEntry = stakeOut.perAddr[bridgeAccount.address];
      return userStakeEntry ?? 0n;
    }
    return 0n;
  }, [stakeOut, bridgeAccount]);

  return (
    <AlertDialog>
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
              {bridgeAccount ? (
                <span>
                  {bridgeAccount.meta.name} (
                  {smallAddress(bridgeAccount.address)})
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CreditCard size={17} />
                  Select Wallet
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className={cn("w-64 border border-muted")}>
            <DropdownMenuLabel>
              Select a wallet to bridge from
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className={cn("max-h-48 overflow-y-auto")}>
              <DropdownMenuRadioGroup
                value={bridgeAccount?.address ?? ""}
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

        {bridgeAccount && (
          <div className="mt-4">
            <p>Selected Wallet: {bridgeAccount.meta.name}</p>
            <p>Address: {smallAddress(bridgeAccount.address)}</p>
            <p>Balance: {formatToken(balance ?? 0n)} TOR</p>
            <p>Staked: {formatToken(userStakeWeight)} TOR</p>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={!bridgeAccount}>
            Bridge Assets
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
