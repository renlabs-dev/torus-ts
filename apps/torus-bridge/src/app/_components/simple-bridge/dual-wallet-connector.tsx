"use client";

import { smallAddress } from "@torus-network/torus-utils/torus/address";
import { Button } from "@torus-ts/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import { AlertTriangle, CheckCircle, Wallet } from "lucide-react";
import { useCallback } from "react";
import { useSwitchChain } from "wagmi";
import { useDualWallet } from "./hooks/use-dual-wallet";
import type { SimpleBridgeDirection } from "./simple-bridge-types";

interface DualWalletConnectorProps {
  direction: SimpleBridgeDirection;
}

export function DualWalletConnector({ direction }: DualWalletConnectorProps) {
  const {
    connectionState,
    connectEvmWallet,
    isOnOptimalChain,
    getRequiredChainId,
    areWalletsReady,
    getConnectionStatus,
    chainIds,
  } = useDualWallet();

  const { switchChain } = useSwitchChain();
  // Safe checks to prevent crashes
  const connectionStatus = getConnectionStatus();
  const walletsReady = areWalletsReady(direction);
  const requiredChainId = getRequiredChainId(direction);
  const isOnCorrectChain = isOnOptimalChain(direction);

  const handleSwitchChain = useCallback(() => {
    if (requiredChainId) {
      switchChain({ chainId: requiredChainId });
    }
  }, [switchChain, requiredChainId]);

  const getChainName = (chainId: number) => {
    if (chainId === chainIds.base) return "Base";
    if (chainId === chainIds.torusEvm) return "Torus EVM";
    return "Unknown";
  };

  const getDirectionDescription = () => {
    switch (direction) {
      case "base-to-native":
        return "Transfer Base TORUS → Native TORUS";
      case "native-to-base":
        return "Transfer Native TORUS → Base TORUS";
      default:
        return "Simple Bridge Transfer";
    }
  };

  // Note: walletsReady state is handled by the parent component

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Connect Wallets
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          {getDirectionDescription()}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Torus Native Wallet */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${
                connectionState.torusWallet.isConnected
                  ? "bg-green-500"
                  : "bg-gray-300"
              }`}
            />
            <div>
              <p className="font-medium">Torus Native Wallet</p>
              <p className="text-muted-foreground text-sm">
                {connectionState.torusWallet.isConnected
                  ? `Connected: ${smallAddress(connectionState.torusWallet.address || "")}`
                  : "Not connected"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {connectionState.torusWallet.isConnected ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled={connectionState.torusWallet.isConnecting}
              >
                {connectionState.torusWallet.isConnecting
                  ? "Connecting..."
                  : "Connect"}
              </Button>
            )}
          </div>
        </div>

        {/* EVM Wallet (Base/Torus EVM) */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${
                connectionState.evmWallet.isConnected && isOnCorrectChain
                  ? "bg-green-500"
                  : connectionState.evmWallet.isConnected
                    ? "bg-yellow-500"
                    : "bg-gray-300"
              }`}
            />
            <div>
              <p className="font-medium">
                {getChainName(requiredChainId)} Wallet
              </p>
              <p className="text-muted-foreground text-sm">
                {connectionState.evmWallet.isConnected
                  ? `Connected: ${smallAddress(connectionState.evmWallet.address || "")}`
                  : "Not connected"}
              </p>
              {connectionState.evmWallet.isConnected && !isOnCorrectChain && (
                <p className="text-sm text-yellow-600">
                  ⚠ Wrong network - switch to {getChainName(requiredChainId)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {connectionState.evmWallet.isConnected && isOnCorrectChain ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : connectionState.evmWallet.isConnected ? (
              <Button onClick={handleSwitchChain} variant="outline" size="sm">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Switch Network
              </Button>
            ) : (
              <Button
                onClick={connectEvmWallet}
                variant="outline"
                size="sm"
                disabled={connectionState.evmWallet.isConnecting}
              >
                {connectionState.evmWallet.isConnecting
                  ? "Connecting..."
                  : "Connect"}
              </Button>
            )}
          </div>
        </div>

        {/* Connection Status Summary */}
        <div className="bg-muted/50 mt-6 rounded-lg p-4">
          <div className="flex items-center gap-2">
            {walletsReady ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-600">
                  Ready to proceed with transfer
                </span>
              </>
            ) : (
              <>
                <div className="h-5 w-5 animate-pulse rounded-full bg-gray-400" />
                <span className="text-muted-foreground">
                  {connectionStatus === "connecting"
                    ? "Connecting wallets..."
                    : connectionStatus === "partially_connected"
                      ? "Connect remaining wallet to continue"
                      : "Connect both wallets to continue"}
                </span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
