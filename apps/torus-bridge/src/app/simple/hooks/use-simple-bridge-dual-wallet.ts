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

/**
 * Exposes combined connection state and helper utilities for Torus (native) and EVM wallets used by the dual-wallet bridge UI.
 *
 * @returns An object containing:
 * - `connectionState`: memoized `WalletConnectionState` with `torusWallet` and `evmWallet` connection details (`isConnected`, `address`, `chainId` for EVM, and `isConnecting` flags).
 * - `isRequiredChainConnected(direction)`: `true` if the connected EVM wallet is on the chain required for the given `SimpleBridgeDirection`, `false` otherwise.
 * - `isOnOptimalChain(direction)`: `true` if the connected EVM wallet is on the optimal chain for the given `SimpleBridgeDirection`, `false` otherwise.
 * - `getRequiredChainId(direction)`: the numeric chain ID required for the given `SimpleBridgeDirection`.
 * - `areWalletsReady(direction)`: `true` if both Torus and EVM wallets are connected, `false` otherwise.
 * - `getConnectionStatus()`: overall connection status string: `"connecting"`, `"connected"`, `"disconnected"`, or `"partially_connected"`.
 * - `chainIds`: object with `base` (base chain ID) and `torusEvm` (Torus-targeted EVM chain ID).
 */
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