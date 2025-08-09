"use client";

import { phantomWallet } from "@rainbow-me/rainbowkit/wallets";
import { Button } from "@torus-ts/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import type { PropsWithChildren } from "react";
import { useEffect, useMemo, useState, useCallback } from "react";

interface Eip1193Provider {
  isCoinbaseWallet?: boolean;
  providers?: Eip1193Provider[];
}

function isCoinbaseWalletInstalled(): boolean {
  // Check if we're in a browser environment
  if (typeof window === "undefined" || !window.ethereum) {
    return false;
  }

  const ethereum = window.ethereum as unknown as Eip1193Provider;

  // Handle single provider case
  if (!ethereum.providers) {
    return Boolean(ethereum.isCoinbaseWallet);
  }

  // Handle multiple providers case
  const providers = ethereum.providers;
  if (!Array.isArray(providers)) {
    return false;
  }

  return providers.some((provider: unknown) => {
    if (!provider || typeof provider !== "object") {
      return false;
    }

    const typedProvider = provider as Record<string, unknown>;

    // Check nested providers (some wallets wrap other wallets)
    if (Array.isArray(typedProvider.providers)) {
      return typedProvider.providers.some((subProvider: unknown) => {
        if (!subProvider || typeof subProvider !== "object") {
          return false;
        }
        return Boolean(
          (subProvider as Record<string, unknown>).isCoinbaseWallet,
        );
      });
    }

    // Check direct provider
    return Boolean(typedProvider.isCoinbaseWallet);
  });
}

function useWalletConflictDetection() {
  const [isReady, setIsReady] = useState(false);
  const [hasPhantom, setHasPhantom] = useState(false);
  const [hasCoinbase, setHasCoinbase] = useState(false);

  const hasConflict = useMemo(
    () => hasPhantom && hasCoinbase,
    [hasPhantom, hasCoinbase],
  );

  useEffect(() => {
    let isActive = true;
    const detectWallets = () => {
      if (!isActive) return;

      setHasPhantom(phantomWallet().installed ?? false);
      setHasCoinbase(isCoinbaseWalletInstalled());
      setTimeout(() => isActive && setIsReady(true), 300);
    };

    detectWallets();

    return () => {
      isActive = false;
    };
  }, []);

  return { isReady, hasConflict };
}

function WalletConflictOverlay({
  onCopyExtensionsUrl,
}: {
  onCopyExtensionsUrl: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Wallet conflict detected</CardTitle>
          <CardDescription>
            Two wallet extensions are enabled (Phantom and Coinbase Wallet).
            This makes it unclear which one should respond and can break the
            Bridge.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="font-semibold">What’s happening</p>
            <p className="text-sm text-muted-foreground">
              With both wallets active, they compete to handle account requests
              (for example, eth_accounts). This is a known wallet-provider issue
              and is being worked on upstream.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Quick fix</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Keep only one wallet extension enabled at a time.</li>
              <li>
                If you want to use{" "}
                <span className="font-medium">Coinbase Wallet</span>, disable
                Phantom. If you want{" "}
                <span className="font-medium">Phantom</span>, disable Coinbase
                Wallet. Then reload this page.
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">
              How to disable an extension (Chrome/Brave/Edge)
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
              <li>
                Open{" "}
                <button
                  className="text-blue-500 hover:underline"
                  onClick={onCopyExtensionsUrl}
                >
                  chrome://extensions
                </button>{" "}
                (click to copy)
              </li>
              <li>Find “Phantom” or “Coinbase Wallet”</li>
              <li>Toggle it off (or remove)</li>
              <li>Reload this page</li>
            </ol>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => location.reload()}
          >
            Reload
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function WalletConflictGuard({ children }: PropsWithChildren) {
  const { isReady, hasConflict } = useWalletConflictDetection();

  const handleCopyExtensionsUrl = useCallback(async () => {
    await navigator.clipboard.writeText("chrome://extensions");
  }, []);

  if (!isReady) return null;
  if (hasConflict) {
    return (
      <WalletConflictOverlay onCopyExtensionsUrl={handleCopyExtensionsUrl} />
    );
  }
  return <>{children}</>;
}
