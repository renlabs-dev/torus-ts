"use client";

import { WalletActionsBase, ActionButton } from "@torus-ts/ui/components/wallet-common";
import { updateSearchParams } from "~/utils/query-params";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { TransferEVM } from "../transfer-evm";
import { TransferToken } from "../transfer-token";

const tabs: ActionButton[] = [
  {
    text: "Torus ⟷ Torus EVM",
    component: <TransferEVM />,
    params: "torus",
  },
  {
    text: "Torus EVM ⟷ Base",
    component: <TransferToken />,
    params: "base",
  },
];

const defaultTab = tabs[0];

function WalletOptions() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentTab = searchParams.get("tab");

  const handleTabChange = (value: string) => {
    const updates: Record<string, string | null> = {};

    updates.tab = value;
    if (value === "torus") {
      updates.from = null;
      updates.to = null;
      updates.mode = "bridge";
    } else if (value === "base") {
      updates.mode = null;
      updates.from = "base";
      updates.to = "torus";
    }

    const newQuery = updateSearchParams(searchParams, updates);
    router.push("/?" + newQuery);
  };

  useEffect(() => {
    if (!currentTab || !tabs.some((view) => view.params === currentTab)) {
      handleTabChange(defaultTab.params as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab, router, searchParams]);

  return (
    <WalletActionsBase 
      buttons={tabs}
      onTabChange={handleTabChange}
      currentTab={tabs.find((tab) => tab.params === currentTab)?.params ?? defaultTab.params}
      className="animate-fade flex w-full flex-col gap-4"
    />
  );
}

export function WalletActions() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") as "wallet" | null;

  const routeComponents = {
    wallet: <WalletOptions />,
    // bridge: <BridgeAction />,
  };

  return routeComponents[view ?? "wallet"];
}

export default WalletActions;
