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
        <div className="flex items-center gap-2">
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
            className="text-nowrap !rounded-md !border !border-white !px-4"
          />
          <Button
            size="lg"
            variant="outline"
            onClick={handleAddUser}
            disabled={suggestUser.isPending || !username}
          >
            {suggestUser.isPending ? "Adding..." : "Add account to swarm"}
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}
