"use client";

import { SwarmMemory } from "@torus-network/torus-utils/swarm-memory-client";
import { useTorus } from "@torus-ts/torus-provider";
import * as React from "react";

interface SwarmMemoryContextType {
  client: SwarmMemory | null;
  isInitializing: boolean;
  initError: string | null;
}

const SwarmMemoryContext = React.createContext<SwarmMemoryContextType | null>(
  null,
);

interface SwarmMemoryProviderProps {
  children: React.ReactNode;
  baseUrl?: string;
}

export function SwarmMemoryProvider({
  children,
  baseUrl,
}: SwarmMemoryProviderProps) {
  const { selectedAccount, torusApi, isAccountConnected } = useTorus();
  const [client, setClient] = React.useState<SwarmMemory | null>(null);
  const [isInitializing, setIsInitializing] = React.useState(false);
  const [initError, setInitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function initClient() {
      if (!selectedAccount || !torusApi.web3FromAddress || !isAccountConnected) {
        setClient(null);
        return;
      }

      setIsInitializing(true);
      setInitError(null);

      try {
        const injector = await torusApi.web3FromAddress(selectedAccount.address);

        if (cancelled) return;

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!injector.signer) {
          throw new Error("Wallet injector does not have a signer");
        }

        const swarmClient = SwarmMemory.fromInjector({
          injectedSigner: injector.signer,
          address: selectedAccount.address,
          baseUrl,
        });

        setClient(swarmClient);
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Failed to initialize SwarmMemory client";
          setInitError(message);
          console.error("SwarmMemory client initialization error:", error);
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    }

    void initClient();

    return () => {
      cancelled = true;
    };
  }, [selectedAccount, torusApi, isAccountConnected, baseUrl]);

  return (
    <SwarmMemoryContext.Provider
      value={{
        client,
        isInitializing,
        initError,
      }}
    >
      {children}
    </SwarmMemoryContext.Provider>
  );
}

export function useSwarmMemory(): SwarmMemoryContextType {
  const context = React.useContext(SwarmMemoryContext);
  if (context === null) {
    throw new Error("useSwarmMemory must be used within a SwarmMemoryProvider");
  }
  return context;
}
