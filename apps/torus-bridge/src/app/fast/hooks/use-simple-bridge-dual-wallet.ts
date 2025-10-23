"use client";

import type { SS58Address } from "@torus-network/sdk/types";
import { useTorus } from "@torus-ts/torus-provider";
import { getChainValuesOnEnv } from "~/config";
import { env } from "~/env";
import { useCallback, useMemo } from "react";
import { useAccount } from "wagmi";
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
    status,
  } = useAccount();

  const isEvmConnecting = status === "connecting" || status === "reconnecting";

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
    (_direction: SimpleBridgeDirection) => {
      const torusReady = connectionState.torusWallet.isConnected;
      const evmReady = connectionState.evmWallet.isConnected;

      return torusReady && evmReady;
    },
    [connectionState],
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
