"use client";

import { useTorus } from "@torus-ts/torus-provider";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useCallback, useMemo } from "react";
import type { SS58Address } from "@torus-network/sdk/types";
import type { WalletConnectionState, SimpleBridgeDirection } from "../simple-bridge-types";
import { getChainValuesOnEnv } from "~/config";
import { env } from "~/env";

export function useDualWallet() {
  // Torus Native wallet connection
  const {
    selectedAccount: torusAccount,
    isAccountConnected: isTorusConnected,
    isInitialized: isTorusInitialized,
  } = useTorus();

  // EVM wallet connection (for Base and Torus EVM)
  const { address: evmAddress, isConnected: isEvmConnected, chainId } = useAccount();
  const { connect, connectors, isPending: isEvmConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  // Chain configuration
  const getChainValues = getChainValuesOnEnv(
    env("NEXT_PUBLIC_TORUS_CHAIN_ENV"),
  );
  const { chainId: torusEvmChainId } = getChainValues("torus");
  const { chainId: baseChainId } = getChainValues("base");

  // Compute connection state using useMemo to prevent unnecessary re-renders
  const connectionState = useMemo<WalletConnectionState>(() => {
    const torusConnected = isTorusConnected && !!torusAccount;
    const evmConnected = isEvmConnected && !!evmAddress;

    return {
      torusWallet: {
        isConnected: torusConnected,
        address: torusAccount?.address as SS58Address,
        isConnecting: false, // Simplified: Torus handles its own connection state
      },
      evmWallet: {
        isConnected: evmConnected,
        address: evmAddress,
        chainId,
        isConnecting: isEvmConnecting && !evmConnected, // Only connecting if not already connected
      },
    };
  }, [
    isTorusConnected,
    torusAccount,
    isEvmConnected,
    evmAddress,
    chainId,
    isEvmConnecting,
  ]);

  const connectEvmWallet = useCallback(() => {
    console.log("connectEvmWallet called", { isEvmConnected, connectorsCount: connectors.length });

    // Simple approach: just find and connect to MetaMask/injected wallet
    const injectedConnector = connectors.find((c) => c.id === "injected");

    if (!injectedConnector) {
      console.warn("No injected connector found");
      return;
    }

    if (isEvmConnected) {
      console.log("Already connected to EVM wallet");
      return;
    }

    console.log("Attempting to connect to injected connector");
    connect({ connector: injectedConnector });
  }, [connect, connectors, isEvmConnected]);

  const disconnectEvmWallet = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const isRequiredChainConnected = useCallback(
    (direction: SimpleBridgeDirection) => {
      if (!isEvmConnected || !chainId) return false;

      // For Simple Bridge, accept if connected to either Base or Torus EVM
      // We'll switch networks during the transaction process as needed
      return chainId === baseChainId || chainId === torusEvmChainId;
    },
    [isEvmConnected, chainId, baseChainId, torusEvmChainId]
  );

  const isOnOptimalChain = useCallback(
    (direction: SimpleBridgeDirection) => {
      if (!isEvmConnected || !chainId) return false;

      switch (direction) {
        case "base-to-native":
          return chainId === baseChainId;
        case "native-to-base":
          return chainId === torusEvmChainId;
        default:
          return false;
      }
    },
    [isEvmConnected, chainId, baseChainId, torusEvmChainId]
  );

  const getRequiredChainId = useCallback(
    (direction: SimpleBridgeDirection): number => {
      switch (direction) {
        case "base-to-native":
          return baseChainId;
        case "native-to-base":
          return torusEvmChainId;
        default:
          return baseChainId;
      }
    },
    [baseChainId, torusEvmChainId]
  );

  const areWalletsReady = useCallback(
    (direction: SimpleBridgeDirection) => {
      const torusReady = connectionState.torusWallet.isConnected;
      const evmReady = connectionState.evmWallet.isConnected &&
                      isRequiredChainConnected(direction);
      return torusReady && evmReady;
    },
    [connectionState, isRequiredChainConnected]
  );

  const getConnectionStatus = useCallback(() => {
    const { torusWallet, evmWallet } = connectionState;

    if (torusWallet.isConnecting || evmWallet.isConnecting) {
      return "connecting";
    }

    if (torusWallet.isConnected && evmWallet.isConnected) {
      return "connected";
    }

    if (!torusWallet.isConnected && !evmWallet.isConnected) {
      return "disconnected";
    }

    return "partially_connected";
  }, [connectionState]);

  return {
    connectionState,
    connectEvmWallet,
    disconnectEvmWallet,
    isRequiredChainConnected,
    isOnOptimalChain,
    getRequiredChainId,
    areWalletsReady,
    getConnectionStatus,
    chainIds: {
      base: baseChainId,
      torusEvm: torusEvmChainId,
    },
  };
}