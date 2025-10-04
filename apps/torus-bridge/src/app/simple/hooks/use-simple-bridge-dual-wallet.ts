"use client";

import type { SS58Address } from "@torus-network/sdk/types";
import { useTorus } from "@torus-ts/torus-provider";
import { getChainValuesOnEnv } from "~/config";
import { env } from "~/env";
import { useCallback, useMemo } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import type {
  SimpleBridgeDirection,
  WalletConnectionState,
} from "../_components/simple-bridge-types";

export function useDualWallet() {
  const {
    selectedAccount: torusAccount,
    isAccountConnected: isTorusConnected,
    isInitialized: _isTorusInitialized,
  } = useTorus();

  const {
    address: evmAddress,
    isConnected: isEvmConnected,
    chainId,
  } = useAccount();
  const { connect, connectors, isPending: isEvmConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  const getChainValues = getChainValuesOnEnv(
    env("NEXT_PUBLIC_TORUS_CHAIN_ENV"),
  );
  const { chainId: torusEvmChainId } = getChainValues("torus");
  const { chainId: baseChainId } = getChainValues("base");

  const connectionState = useMemo<WalletConnectionState>(() => {
    const torusConnected = isTorusConnected && !!torusAccount;
    const evmConnected = isEvmConnected && !!evmAddress;

    return {
      torusWallet: {
        isConnected: torusConnected,
        address: torusAccount?.address as SS58Address,
        isConnecting: false,
      },
      evmWallet: {
        isConnected: evmConnected,
        address: evmAddress,
        chainId,
        isConnecting: isEvmConnecting && !evmConnected,
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
    if (isEvmConnected) {
      return;
    }

    const injectedConnector = connectors.find((c) => c.id === "injected");
    if (!injectedConnector) {
      console.warn("No injected connector found");
      return;
    }

    connect({ connector: injectedConnector });
  }, [connect, connectors, isEvmConnected]);

  const disconnectEvmWallet = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const isRequiredChainConnected = useCallback(
    (direction: SimpleBridgeDirection) => {
      if (!isEvmConnected || !chainId) {
        return false;
      }

      // Check the correct chain based on direction
      if (direction === "base-to-native") {
        return chainId === baseChainId;
      }
      return chainId === torusEvmChainId;
    },
    [isEvmConnected, chainId, baseChainId, torusEvmChainId],
  );

  const isOnOptimalChain = useCallback(
    (direction: SimpleBridgeDirection) => {
      if (!isEvmConnected || !chainId) {
        return false;
      }

      if (direction === "base-to-native") {
        return chainId === baseChainId;
      }

      return chainId === torusEvmChainId;
    },
    [isEvmConnected, chainId, baseChainId, torusEvmChainId],
  );

  const getRequiredChainId = useCallback(
    (direction: SimpleBridgeDirection): number => {
      if (direction === "base-to-native") {
        return baseChainId;
      }

      return torusEvmChainId;
    },
    [baseChainId, torusEvmChainId],
  );

  const areWalletsReady = useCallback(
    (direction: SimpleBridgeDirection) => {
      const torusReady = connectionState.torusWallet.isConnected;
      const evmReady =
        connectionState.evmWallet.isConnected &&
        isRequiredChainConnected(direction);

      return torusReady && evmReady;
    },
    [connectionState, isRequiredChainConnected],
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
