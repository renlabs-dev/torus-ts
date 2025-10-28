"use client";

import type { SS58Address } from "@torus-network/sdk/types";
import {
  useCachedStakeOut,
  useFreeBalance,
} from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@torus-ts/ui/components/empty";
import { WalletDropdown } from "@torus-ts/ui/components/wallet-dropdown/wallet-dropdown";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { env } from "~/env";
import { api } from "~/trpc/react";
import { UserRoundPlus } from "lucide-react";

interface AddProphetProps {
  username: string;
  onSuccess?: () => void;
}

export function AddProphet({ username, onSuccess }: AddProphetProps) {
  const { toast } = useToast();
  const suggestUser = api.twitterUser.suggestUser.useMutation({
    onSuccess: () => {
      toast({
        title: "User suggested",
        description: `@${username} has been to be added to the swarm queue.`,
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddUser = () => {
    suggestUser.mutate({ username });
  };

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

  return (
    <Empty className="!p-1">
      <EmptyHeader>
        <EmptyTitle>No Predictor Found</EmptyTitle>
        <EmptyDescription>
          This account is not yet part of the Prediction Swarm. Add them to
          start viewing their predictions.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex w-full flex-col items-center gap-2">
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

          {/* Separator with text */}
          <div className="relative flex w-full items-center">
            <div className="border-border flex-1 border-t" />
            <span className="text-muted-foreground px-3 text-xs">THEN</span>
            <div className="border-border flex-1 border-t" />
          </div>

          <Button
            size="lg"
            variant="outline"
            onClick={handleAddUser}
            className="h-10 w-full"
            disabled={suggestUser.isPending || !username || !isAccountConnected}
          >
            <UserRoundPlus className="h-12 w-12" />
            {suggestUser.isPending ? "Adding..." : "Add account to swarm"}
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}
