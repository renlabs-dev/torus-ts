"use client";

import { useCallback, useState } from "react";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import type { SS58Address } from "@torus-network/sdk/types";
import { transferAllowDeath } from "@torus-network/sdk/chain";
import {
  convertH160ToSS58,
  waitForTransactionReceipt,
  withdrawFromTorusEvm,
} from "@torus-network/sdk/evm";
import { toNano } from "@torus-network/torus-utils/torus/token";
import { useTorus } from "@torus-ts/torus-provider";
import { useSendTransaction } from "@torus-ts/torus-provider/use-send-transaction";
import { useAccount, useWalletClient, useBalance, useClient } from "wagmi";
import { useTokenTransfer } from "~/hooks/use-token-transfer";
import { getTokenByIndex, useWarpCore } from "~/hooks/token";
import { useMultiProvider } from "~/hooks/use-multi-provider";
import { getChainValuesOnEnv } from "~/config";
import { env } from "~/env";
import type {
  SimpleBridgeDirection,
  SimpleBridgeState,
  SimpleBridgeTransaction,
} from "../simple-bridge-types";
import { SimpleBridgeStep } from "../simple-bridge-types";

export function useOrchestratedTransfer() {
  const [bridgeState, setBridgeState] = useState<SimpleBridgeState>({
    step: SimpleBridgeStep.IDLE,
    direction: null,
    amount: "",
  });

  const [transactions, setTransactions] = useState<SimpleBridgeTransaction[]>([]);
  const { toast } = useToast();

  // Torus Native wallet hooks
  const {
    selectedAccount,
    isAccountConnected,
    api,
    torusApi,
    wsEndpoint,
  } = useTorus();

  const { sendTx } = useSendTransaction({
    api,
    selectedAccount,
    wsEndpoint,
    wallet: torusApi,
    transactionType: "Simple Bridge Transfer",
  });

  // EVM wallet hooks
  const { data: walletClient } = useWalletClient();
  const { address: evmAddress, chain } = useAccount();

  // Chain configuration
  const getChainValues = getChainValuesOnEnv(
    env("NEXT_PUBLIC_TORUS_CHAIN_ENV"),
  );
  const { chainId: torusEvmChainId } = getChainValues("torus");

  // Hyperlane/Warp core for token transfers
  const warpCore = useWarpCore();
  const multiProvider = useMultiProvider();

  // Token transfer hook for Hyperlane transfers
  const { triggerTransactions: triggerHyperlaneTransfer } = useTokenTransfer();

  // EVM balance and client for Torus EVM
  const torusEvmClient = useClient({ chainId: torusEvmChainId });
  const { data: torusEvmBalance, refetch: refetchTorusEvmBalance } = useBalance({
    address: evmAddress,
    chainId: torusEvmChainId,
  });

  const updateBridgeState = useCallback((updates: Partial<SimpleBridgeState>) => {
    setBridgeState(prev => ({ ...prev, ...updates }));
  }, []);

  const addTransaction = useCallback((transaction: SimpleBridgeTransaction) => {
    setTransactions(prev => {
      const existing = prev.find(tx => tx.step === transaction.step);
      if (existing) {
        return prev.map(tx => tx.step === transaction.step ? transaction : tx);
      }
      return [...prev, transaction];
    });
  }, []);

  const getExplorerUrl = useCallback((txHash: string, chainName: string): string => {
    switch (chainName.toLowerCase()) {
      case "base":
        return `https://basescan.org/tx/${txHash}`;
      case "torus evm":
      case "torus":
        return `https://blockscout.torus.network/tx/${txHash}`;
      default:
        return "";
    }
  }, []);

  // Base → Native Torus flow
  const executeBaseToNative = useCallback(async (amount: string) => {
    if (!selectedAccount || !evmAddress || !walletClient || !chain) {
      throw new Error("Wallets not properly connected");
    }

    const amountRems = toNano(parseFloat(amount));

    // Step 1: Base → Torus EVM (via Hyperlane)
    updateBridgeState({ step: SimpleBridgeStep.STEP_1_PREPARING });

    addTransaction({
      step: 1,
      status: "STARTING",
      chainName: "Base",
      message: "Preparing Base → Torus EVM transfer"
    });

    // Find the Base token configuration
    const baseToken = warpCore.tokens.find(
      token => token.chainName === "base" && token.symbol === "TORUS"
    );

    if (!baseToken) {
      throw new Error("Base TORUS token not found in warp configuration");
    }

    const connection = baseToken.getConnectionForChain("torus");
    if (!connection) {
      throw new Error("No connection found from Base to Torus EVM");
    }

    // Trigger Hyperlane transfer
    updateBridgeState({ step: SimpleBridgeStep.STEP_1_SIGNING });

    const [hyperlaneError] = await tryAsync(
      triggerHyperlaneTransfer({
        origin: "base",
        destination: "torus",
        tokenIndex: 0, // This should be the correct index for Base TORUS
        amount,
        recipient: evmAddress, // Send to our own EVM address on Torus
      })
    );

    if (hyperlaneError !== undefined) {
      updateBridgeState({
        step: SimpleBridgeStep.ERROR,
        errorMessage: "Failed to execute Base → Torus EVM transfer"
      });
      addTransaction({
        step: 1,
        status: "ERROR",
        chainName: "Base",
        message: "Transfer failed"
      });
      throw hyperlaneError;
    }

    updateBridgeState({ step: SimpleBridgeStep.STEP_1_COMPLETE });
    addTransaction({
      step: 1,
      status: "SUCCESS",
      chainName: "Base",
      message: "Transfer complete"
    });

    // Step 2: Torus EVM → Native (via withdrawal)
    updateBridgeState({ step: SimpleBridgeStep.STEP_2_PREPARING });

    addTransaction({
      step: 2,
      status: "STARTING",
      chainName: "Torus EVM",
      message: "Preparing Torus EVM → Native withdrawal"
    });

    // Wait for balance to be available on Torus EVM
    await refetchTorusEvmBalance();

    updateBridgeState({ step: SimpleBridgeStep.STEP_2_SIGNING });

    const [withdrawError, txHash] = await tryAsync(
      withdrawFromTorusEvm(
        walletClient,
        chain,
        selectedAccount.address as SS58Address,
        amountRems,
        async () => { await refetchTorusEvmBalance(); }
      )
    );

    if (withdrawError !== undefined) {
      updateBridgeState({
        step: SimpleBridgeStep.ERROR,
        errorMessage: "Failed to withdraw from Torus EVM"
      });
      addTransaction({
        step: 2,
        status: "ERROR",
        chainName: "Torus EVM",
        message: "Withdrawal failed"
      });
      throw withdrawError;
    }

    updateBridgeState({ step: SimpleBridgeStep.STEP_2_CONFIRMING });

    // Wait for transaction receipt if we have wagmi config
    if (torusEvmClient && txHash) {
      const [receiptError] = await tryAsync(
        waitForTransactionReceipt(torusEvmClient as any, {
          hash: txHash,
          confirmations: 2,
        })
      );

      if (receiptError !== undefined) {
        console.warn("Failed to get transaction receipt:", receiptError);
      }

      addTransaction({
        step: 2,
        status: "SUCCESS",
        chainName: "Torus EVM",
        message: "Withdrawal complete",
        txHash,
        explorerUrl: getExplorerUrl(txHash, "Torus EVM")
      });
    }

    updateBridgeState({ step: SimpleBridgeStep.COMPLETE });
    toast({
      title: "Transfer Complete!",
      description: "Successfully transferred Base TORUS to Native TORUS"
    });

  }, [
    selectedAccount,
    evmAddress,
    walletClient,
    chain,
    warpCore,
    triggerHyperlaneTransfer,
    refetchTorusEvmBalance,
    torusEvmClient,
    updateBridgeState,
    addTransaction,
    getExplorerUrl,
    toast,
  ]);

  // Native → Base Torus flow
  const executeNativeToBase = useCallback(async (amount: string) => {
    if (!selectedAccount || !evmAddress || !api || !sendTx) {
      throw new Error("Wallets not properly connected");
    }

    const amountRems = toNano(parseFloat(amount));
    const evmSS58Addr = convertH160ToSS58(evmAddress);

    // Step 1: Native → Torus EVM (via bridge)
    updateBridgeState({ step: SimpleBridgeStep.STEP_1_PREPARING });

    addTransaction({
      step: 1,
      status: "STARTING",
      chainName: "Torus Native",
      message: "Preparing Native → Torus EVM bridge"
    });

    updateBridgeState({ step: SimpleBridgeStep.STEP_1_SIGNING });

    const [sendErr, sendRes] = await sendTx(
      transferAllowDeath(api, evmSS58Addr, amountRems)
    );

    if (sendErr !== undefined) {
      updateBridgeState({
        step: SimpleBridgeStep.ERROR,
        errorMessage: "Failed to bridge from Native to Torus EVM"
      });
      addTransaction({
        step: 1,
        status: "ERROR",
        chainName: "Torus Native",
        message: "Bridge failed"
      });
      throw sendErr;
    }

    const { tracker } = sendRes;

    updateBridgeState({ step: SimpleBridgeStep.STEP_1_CONFIRMING });

    // Wait for finalization
    await new Promise<void>((resolve, reject) => {
      tracker.on("finalized", () => {
        updateBridgeState({ step: SimpleBridgeStep.STEP_1_COMPLETE });
        addTransaction({
          step: 1,
          status: "SUCCESS",
          chainName: "Torus Native",
          message: "Bridge complete"
        });
        resolve();
      });

      tracker.on("error", (error) => {
        updateBridgeState({
          step: SimpleBridgeStep.ERROR,
          errorMessage: "Native bridge transaction failed"
        });
        addTransaction({
          step: 1,
          status: "ERROR",
          chainName: "Torus Native",
          message: "Transaction failed"
        });
        reject(error);
      });
    });

    // Step 2: Torus EVM → Base (via Hyperlane)
    updateBridgeState({ step: SimpleBridgeStep.STEP_2_PREPARING });

    addTransaction({
      step: 2,
      status: "STARTING",
      chainName: "Torus EVM",
      message: "Preparing Torus EVM → Base transfer"
    });

    updateBridgeState({ step: SimpleBridgeStep.STEP_2_SIGNING });

    const [hyperlaneError] = await tryAsync(
      triggerHyperlaneTransfer({
        origin: "torus",
        destination: "base",
        tokenIndex: 1, // This should be the correct index for Torus EVM TORUS
        amount,
        recipient: evmAddress, // Send to our Base address
      })
    );

    if (hyperlaneError !== undefined) {
      updateBridgeState({
        step: SimpleBridgeStep.ERROR,
        errorMessage: "Failed to execute Torus EVM → Base transfer"
      });
      addTransaction({
        step: 2,
        status: "ERROR",
        chainName: "Torus EVM",
        message: "Transfer failed"
      });
      throw hyperlaneError;
    }

    updateBridgeState({ step: SimpleBridgeStep.COMPLETE });
    addTransaction({
      step: 2,
      status: "SUCCESS",
      chainName: "Torus EVM",
      message: "Transfer complete"
    });

    toast({
      title: "Transfer Complete!",
      description: "Successfully transferred Native TORUS to Base TORUS"
    });

  }, [
    selectedAccount,
    evmAddress,
    api,
    sendTx,
    triggerHyperlaneTransfer,
    updateBridgeState,
    addTransaction,
    toast,
  ]);

  const executeTransfer = useCallback(async (
    direction: SimpleBridgeDirection,
    amount: string
  ) => {
    try {
      updateBridgeState({
        step: SimpleBridgeStep.IDLE,
        direction,
        amount,
        errorMessage: undefined,
      });
      setTransactions([]);

      if (direction === "base-to-native") {
        await executeBaseToNative(amount);
      } else {
        await executeNativeToBase(amount);
      }
    } catch (error) {
      console.error("Transfer failed:", error);
      updateBridgeState({
        step: SimpleBridgeStep.ERROR,
        errorMessage: error instanceof Error ? error.message : "Transfer failed"
      });
    }
  }, [executeBaseToNative, executeNativeToBase, updateBridgeState]);

  const resetTransfer = useCallback(() => {
    setBridgeState({
      step: SimpleBridgeStep.IDLE,
      direction: null,
      amount: "",
    });
    setTransactions([]);
  }, []);

  return {
    bridgeState,
    transactions,
    executeTransfer,
    resetTransfer,
    isTransferInProgress: bridgeState.step !== SimpleBridgeStep.IDLE &&
                         bridgeState.step !== SimpleBridgeStep.COMPLETE &&
                         bridgeState.step !== SimpleBridgeStep.ERROR,
  };
}