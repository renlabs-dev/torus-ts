"use client";

import { smallAddress } from "@torus-network/torus-utils/torus/address";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import { CheckCircle, Wallet } from "lucide-react";
import { useDualWallet } from "../hooks/use-fast-bridge-dual-wallet";
import type { SimpleBridgeDirection } from "./fast-bridge-types";

interface DualWalletConnectorProps {
  direction: SimpleBridgeDirection;
}

export function DualWalletConnector({ direction }: DualWalletConnectorProps) {
  const { connectionState, areWalletsReady, getConnectionStatus, chainIds } =
    useDualWallet();

  const connectionStatus = getConnectionStatus();
  const walletsReady = areWalletsReady(direction);

  const getChainName = (chainId: number) => {
    if (chainId === chainIds.base) {
      return "Base";
    }

    if (chainId === chainIds.torusEvm) {
      return "Torus EVM";
    }

    return "Unknown";
  };

  const getDirectionDescription = () => {
    if (direction === "base-to-native") {
      return "Transfer Base TORUS → Native TORUS";
    }

    return "Transfer Native TORUS → Base TORUS";
  };

  const getStatusIndicatorColor = () => {
    if (connectionState.torusWallet.isConnected) {
      return "bg-green-500";
    }

    return "bg-gray-300";
  };

  const getEvmStatusIndicatorColor = () => {
    if (connectionState.evmWallet.isConnected) {
      return "bg-green-500";
    }

    return "bg-gray-300";
  };

  const getConnectionStatusMessage = () => {
    if (connectionStatus === "connecting") {
      return "Connecting wallets...";
    }

    if (connectionStatus === "partially_connected") {
      return "Connect remaining wallet to continue";
    }

    return "Connect both wallets to continue";
  };

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
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${getStatusIndicatorColor()}`}
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
            {connectionState.torusWallet.isConnected && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${getEvmStatusIndicatorColor()}`}
            />
            <div>
              <p className="font-medium">
                {connectionState.evmWallet.isConnected &&
                connectionState.evmWallet.chainId
                  ? getChainName(connectionState.evmWallet.chainId)
                  : "EVM"}{" "}
                Wallet
              </p>
              <p className="text-muted-foreground text-sm">
                {connectionState.evmWallet.isConnected
                  ? `Connected: ${smallAddress(connectionState.evmWallet.address || "")}`
                  : "Not connected"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {connectionState.evmWallet.isConnected && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>
        </div>

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
                  {getConnectionStatusMessage()}
                </span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
