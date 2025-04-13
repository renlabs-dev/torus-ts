"use client";

import type { ActionButton } from "@torus-ts/ui/components/wallet-actions-base";
import { WalletActionsBase } from "@torus-ts/ui/components/wallet-actions-base";
import { updateSearchParams } from "~/utils/query-params";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
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

const DEFAULT_TAB = tabs[0];

function WalletOptions() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentTab = searchParams.get("tab");

  const activeTab = useMemo(() => {
    return tabs.find((tab) => tab.params === currentTab) ?? DEFAULT_TAB;
  }, [currentTab]);

  const handleTabChange = useCallback(
    (value: string) => {
      // improve this @rodrigooler
      const updates = {
        tab: value,
        ...(value === "torus"
          ? { from: null, to: null, mode: "bridge" }
          : value === "base"
            ? { mode: null, from: "base", to: "torus" }
            : {}),
      };

      const newQuery = updateSearchParams(searchParams, updates);
      router.push("/?" + newQuery);
    },
    [searchParams, router],
  );

  useEffect(() => {
    if (!currentTab || !tabs.some((tab) => tab.params === currentTab)) {
      if (DEFAULT_TAB && !!DEFAULT_TAB.params) {
        handleTabChange(DEFAULT_TAB.params);
      }
    }
  }, [currentTab, handleTabChange]);

  return (
    <WalletActionsBase
      buttons={tabs}
      onTabChange={handleTabChange}
      currentTab={activeTab?.params ?? ""}
      className="animate-fade flex w-full flex-col gap-4"
    />
  );
}

export function WalletActions() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") as "wallet" | null;

  const routeComponents = Object.freeze({
    wallet: <WalletOptions />,
    // bridge: <BridgeAction />,
  });

  return routeComponents[view ?? "wallet"];
}

export default WalletActions;
