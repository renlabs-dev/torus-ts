"use client";

import type { SS58Address } from "@torus-network/sdk/types";
import {
  useCachedStakeOut,
  useFreeBalance,
} from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@torus-ts/ui/components/dialog";
import { WalletDropdown } from "@torus-ts/ui/components/wallet-dropdown/wallet-dropdown";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { env } from "~/env";
import { api } from "~/trpc/react";
import { UserRoundPlus } from "lucide-react";
import Link from "next/link";

interface AddAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
}

export function AddAccountModal({
  open,
  onOpenChange,
  username,
}: AddAccountModalProps) {
  const { toast } = useToast();
  const suggestUser = api.twitterUser.suggestUser.useMutation({
    onSuccess: () => {
      toast({
        title: "User suggested",
        description: (
          <div>
            <p>@{username} has been added to the swarm queue.</p>
            <Link
              href="/scraper-queue"
              className="text-primary mt-1 inline-block text-sm underline"
            >
              Track it here →
            </Link>
          </div>
        ),
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const {
    accounts,
    api: torusApi,
    handleGetWallets,
    handleLogout,
    handleSelectWallet,
    isInitialized,
    selectedAccount,
    isAccountConnected,
  } = useTorus();

  const accountFreeBalance = useFreeBalance(
    torusApi,
    selectedAccount?.address as SS58Address,
  );

  const stakeOut = useCachedStakeOut(env("NEXT_PUBLIC_TORUS_CACHE_URL"));

  const handleAddUser = () => {
    suggestUser.mutate({ username });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add @{username} to Swarm</DialogTitle>
          <DialogDescription>
            Connect your wallet and add this account to the prediction swarm
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Wallet Connection */}
          <div className="border-button-border flex h-10 w-full justify-center border">
            <WalletDropdown
              balance={accountFreeBalance.data}
              stakeOut={stakeOut.data}
              accounts={accounts}
              isInitialized={isInitialized}
              selectedAccount={selectedAccount}
              handleLogout={handleLogout}
              handleGetWallets={handleGetWallets}
              handleSelectWallet={handleSelectWallet}
              torusChainEnv={env("NEXT_PUBLIC_TORUS_CHAIN_ENV")}
              className="text-nowrap !rounded-md"
            />
          </div>

          {/* Separator */}
          <div className="relative flex w-full items-center">
            <div className="border-border flex-1 border-t" />
            <span className="text-muted-foreground px-3 text-xs">THEN</span>
            <div className="border-border flex-1 border-t" />
          </div>

          {/* Add Button */}
          <Button
            size="lg"
            variant="default"
            onClick={handleAddUser}
            className="h-10 w-full"
            disabled={suggestUser.isPending || !isAccountConnected}
          >
            <UserRoundPlus className="mr-2 h-5 w-5" />
            {suggestUser.isPending ? "Adding..." : "Add account to swarm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
