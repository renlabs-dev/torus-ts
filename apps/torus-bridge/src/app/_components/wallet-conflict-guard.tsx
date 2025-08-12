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

function isTronLinkInstalled(): boolean {
  if (typeof window === "undefined") return false;
  const maybeWindow = window as unknown as Record<string, unknown>;
  // TronLink typically injects either `tronLink` and/or `tronWeb`
  const hasTronLinkObject = Boolean(maybeWindow.tronLink);
  const hasTronWebObject = Boolean(maybeWindow.tronWeb);
  return hasTronLinkObject || hasTronWebObject;
}

function isCoinbaseWalletInstalled(): boolean {
  // Browser environment check
  if (typeof window === "undefined") {
    return false;
  }

  const win = window as unknown as Record<string, unknown>;

  // Coinbase Wallet often exposes globals
  const hasGlobalFlag = Boolean(
    win.coinbaseWalletExtension ?? win.walletLinkExtension,
  );

  const ethereum = win.ethereum as
    | (Eip1193Provider & Record<string, unknown>)
    | undefined;

  if (!ethereum) {
    return hasGlobalFlag;
  }

  const providerHasCoinbaseFlag = (provider: unknown): boolean => {
    if (!provider || typeof provider !== "object") return false;
    const p = provider as Record<string, unknown>;
    const direct = Boolean(p.isCoinbaseWallet ?? p.isWalletLink);
    const nested = Array.isArray(p.providers)
      ? p.providers.some((sub) => providerHasCoinbaseFlag(sub))
      : false;
    return direct || nested;
  };

  // Single or multiple providers
  const hasFlagOnEthereum = providerHasCoinbaseFlag(ethereum);
  const hasFlagOnAnyProvider = Array.isArray(ethereum.providers)
    ? ethereum.providers.some((p) => providerHasCoinbaseFlag(p))
    : false;

  return hasGlobalFlag || hasFlagOnEthereum || hasFlagOnAnyProvider;
}

function useWalletConflictDetection() {
  const [isReady, setIsReady] = useState(false);
  const [hasPhantom, setHasPhantom] = useState(false);
  const [hasCoinbase, setHasCoinbase] = useState(false);
  const [hasTronLink, setHasTronLink] = useState(false);

  const hasConflict = useMemo(() => {
    const enabledCount = [hasPhantom, hasCoinbase, hasTronLink].filter(
      Boolean,
    ).length;
    return enabledCount >= 2;
  }, [hasPhantom, hasCoinbase, hasTronLink]);

  const detectedWallets = useMemo(() => {
    const names: string[] = [];
    if (hasPhantom) names.push("Phantom");
    if (hasCoinbase) names.push("Coinbase Wallet");
    if (hasTronLink) names.push("TronLink");
    return names;
  }, [hasPhantom, hasCoinbase, hasTronLink]);

  useEffect(() => {
    let isActive = true;
    const detectWallets = () => {
      if (!isActive) return;

      setHasPhantom(phantomWallet().installed ?? false);
      setHasCoinbase(isCoinbaseWalletInstalled());
      setHasTronLink(isTronLinkInstalled());
      setTimeout(() => isActive && setIsReady(true), 300);
    };

    detectWallets();

    return () => {
      isActive = false;
    };
  }, []);

  return { isReady, hasConflict, detectedWallets };
}

function WalletConflictOverlay({
  onCopyExtensionsUrl,
  detectedWallets,
}: {
  onCopyExtensionsUrl: () => void;
  detectedWallets: string[];
}) {
  return (
    <div className="mx-auto max-w-xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Wallet conflict detected</CardTitle>
          <CardDescription>
            Multiple wallet extensions are enabled ({detectedWallets.join(", ")}
            ). This makes it unclear which one should respond and can break the
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
              <li>Disable all but your preferred wallet, then reload.</li>
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
              <li>Find the listed wallet extensions</li>
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
  const { isReady, hasConflict, detectedWallets } =
    useWalletConflictDetection();

  const handleCopyExtensionsUrl = useCallback(async () => {
    await navigator.clipboard.writeText("chrome://extensions");
  }, []);

  if (!isReady) return null;
  if (hasConflict) {
    return (
      <WalletConflictOverlay
        onCopyExtensionsUrl={handleCopyExtensionsUrl}
        detectedWallets={detectedWallets}
      />
    );
  }
  return <>{children}</>;
}
