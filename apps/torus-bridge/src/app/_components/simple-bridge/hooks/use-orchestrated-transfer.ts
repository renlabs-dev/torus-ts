"use client";

import { transferAllowDeath } from "@torus-network/sdk/chain";
import {
  convertH160ToSS58,
  waitForTransactionReceipt,
  withdrawFromTorusEvm,
} from "@torus-network/sdk/evm";
import type { SS58Address } from "@torus-network/sdk/types";
import { toNano } from "@torus-network/torus-utils/torus/token";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { useTorus } from "@torus-ts/torus-provider";
import { useSendTransaction } from "@torus-ts/torus-provider/use-send-transaction";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { getChainValuesOnEnv } from "~/config";
import { env } from "~/env";
import { useWarpCore } from "~/hooks/token";
import { useMultiProvider } from "~/hooks/use-multi-provider";
import { useTokenTransfer } from "~/hooks/use-token-transfer";
import { useCallback, useState } from "react";
import {
  useAccount,
  useBalance,
  useClient,
  useSwitchChain,
  useWalletClient,
} from "wagmi";
import type {
  SimpleBridgeDirection,
  SimpleBridgeState,
  SimpleBridgeTransaction,
} from "../simple-bridge-types";
import { SimpleBridgeStep } from "../simple-bridge-types";

// Add import for Base chain
const BASE_CHAIN_ID = 8453;

export function useOrchestratedTransfer() {
  const [bridgeState, setBridgeState] = useState<SimpleBridgeState>({
    step: SimpleBridgeStep.IDLE,
    direction: null,
    amount: "",
  });

  const [transactions, setTransactions] = useState<SimpleBridgeTransaction[]>(
    [],
  );
  const { toast } = useToast();

  // Torus Native wallet hooks
  const { selectedAccount, api, torusApi, wsEndpoint } = useTorus();

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
  const { switchChain } = useSwitchChain();

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
  const { data: torusEvmBalance, refetch: refetchTorusEvmBalance } = useBalance(
    {
      address: evmAddress,
      chainId: torusEvmChainId,
    },
  );

  // Add import for Base chain
  const { data: baseBalance, refetch: refetchBaseBalance } = useBalance({
    address: evmAddress,
    chainId: BASE_CHAIN_ID,
  });

  const { data: nativeEthBalance, refetch: refetchNativeEthBalance } =
    useBalance({
      address: evmAddress,
      chainId: torusEvmChainId,
      token: "0x0000000000000000000000000000000000000000", // Native ETH on Torus EVM
    });

  const updateBridgeState = useCallback(
    (updates: Partial<SimpleBridgeState>) => {
      setBridgeState((prev) => ({ ...prev, ...updates }));
    },
    [],
  );

  const addTransaction = useCallback((transaction: SimpleBridgeTransaction) => {
    setTransactions((prev) => {
      const existing = prev.find((tx) => tx.step === transaction.step);
      if (existing) {
        return prev.map((tx) =>
          tx.step === transaction.step ? transaction : tx,
        );
      }
      return [...prev, transaction];
    });
  }, []);

  const getExplorerUrl = useCallback(
    (txHash: string, chainName: string): string => {
      switch (chainName.toLowerCase()) {
        case "base":
          return `https://basescan.org/tx/${txHash}`;
        case "torus evm":
        case "torus":
          return `https://blockscout.torus.network/tx/${txHash}`;
        default:
          return "";
      }
    },
    [],
  );

  // Base → Native Torus flow
  const executeBaseToNative = useCallback(
    async (amount: string) => {
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
        message: "Preparing Base → Torus EVM transfer",
      });

      // Find the Base token configuration
      const baseToken = warpCore.tokens.find(
        (token) => token.chainName === "base" && token.symbol === "TORUS",
      );

      if (!baseToken) {
        throw new Error("Base TORUS token not found in warp configuration");
      }

      const connection = baseToken.getConnectionForChain("torus");
      if (!connection) {
        throw new Error("No connection found from Base to Torus EVM");
      }

      // Switch to Base chain if not already
      let baseSwitchAttempts = 0;
      const maxBaseSwitchAttempts = 2;
      while (
        baseSwitchAttempts < maxBaseSwitchAttempts &&
        chain?.id !== BASE_CHAIN_ID
      ) {
        try {
          await switchChain({ chainId: BASE_CHAIN_ID });
          await new Promise((resolve) => setTimeout(resolve, 1000));
          if (chain?.id === BASE_CHAIN_ID) break;
          throw new Error("Base switch verification failed");
        } catch (baseSwitchError) {
          baseSwitchAttempts++;
          if (baseSwitchAttempts >= maxBaseSwitchAttempts) {
            // Error handling as before
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      // Trigger Hyperlane transfer
      updateBridgeState({ step: SimpleBridgeStep.STEP_1_SIGNING });

      addTransaction({
        step: 1,
        status: "SIGNING",
        chainName: "Base",
        message: "Signing transaction...",
      });

      const [hyperlaneError, hyperlaneResult] = await tryAsync(
        triggerHyperlaneTransfer({
          origin: "base",
          destination: "torus",
          tokenIndex: 0,
          amount,
          recipient: evmAddress,
        }),
      );

      console.log("Hyperlane result after tryAsync:", [
        hyperlaneError,
        hyperlaneResult,
      ]); // Debug

      // Fix: Only fail on actual error; success if no error (even if result is undefined)
      if (hyperlaneError) {
        const error = hyperlaneError;
        console.log("Hyperlane failure detected:", error); // Debug

        const isUserRejection =
          error.message.includes("rejected") ||
          error.message.includes("denied") ||
          error.message.includes("cancelled") ||
          error.message.includes("User denied") ||
          error.message.includes("User rejected") ||
          error.message.includes("User denied transaction signature") ||
          (error.message.includes("signature") &&
            error.message.includes("denied")) ||
          error.name === "UserRejectedRequestError" ||
          (error.name === "TransactionExecutionError" &&
            error.message.includes("User rejected"));

        const errorMessage = isUserRejection
          ? "Transaction rejected by user"
          : "Failed to execute Base → Torus EVM transfer";

        addTransaction({
          step: 1,
          status: "ERROR",
          chainName: "Base",
          message: errorMessage,
          txHash: undefined,
          explorerUrl: undefined,
        });

        updateBridgeState({
          step: SimpleBridgeStep.ERROR,
          errorMessage,
        });

        if (isUserRejection) {
          return; // Pause without throwing
        } else {
          throw error;
        }
      }

      // Success: Proceed even if result is undefined (Hyperlane doesn't return hash here)
      console.log(
        "Base→Native: Hyperlane transfer successful (no error, result:",
        hyperlaneResult,
        ")",
      );

      // After no error in signing for Step 1
      updateBridgeState({ step: SimpleBridgeStep.STEP_1_CONFIRMING });
      addTransaction({
        step: 1,
        status: "CONFIRMING" as const,
        chainName: "Base",
        message: "Waiting for confirmation...",
        txHash: undefined,
        explorerUrl: undefined,
      });

      // Baseline
      await refetchTorusEvmBalance(); // Ensure fresh
      const baselineBalance = torusEvmBalance?.value || 0n;
      const expectedIncrease = toNano(parseFloat(amount));

      console.log(
        "Baseline Torus EVM balance:",
        Number(baselineBalance) / 1e18,
        "expected +",
        Number(expectedIncrease) / 1e18,
      );

      // Poll
      const pollInterval = 5000; // 5s for faster feedback
      const maxPolls = 180; // 15 min total
      let pollCount = 0;
      const pollPromise = new Promise<void>((resolve, reject) => {
        const interval = setInterval(async () => {
          pollCount++;
          const refetchResult = await refetchTorusEvmBalance();
          if (refetchResult.status === "error") {
            console.warn("Refetch failed, skipping poll");
            return; // or continue to next poll
          }
          const currentBalance = refetchResult.data?.value || 0n;
          console.log(
            `Poll ${pollCount}: Current balance ${(Number(currentBalance) / 1e18).toFixed(2)}, baseline ${(Number(baselineBalance) / 1e18).toFixed(2)}`,
          );

          if (currentBalance >= baselineBalance + expectedIncrease) {
            clearInterval(interval);
            resolve(); // Confirmed
          } else if (pollCount >= maxPolls) {
            clearInterval(interval);
            reject(new Error("Confirmation timeout - no balance increase"));
          }
        }, pollInterval);
      });

      try {
        await pollPromise;
        console.log("Step 1 confirmed by balance increase");
      } catch (pollError) {
        console.log("Step 1 confirmation failed:", pollError);
        const errorMessage =
          "Base transfer did not confirm (check balance and retry)";
        addTransaction({
          step: 1,
          status: "ERROR" as const,
          chainName: "Base",
          message: errorMessage,
          txHash: undefined,
          explorerUrl: undefined,
        });
        updateBridgeState({
          step: SimpleBridgeStep.ERROR,
          errorMessage,
        });
        throw pollError;
      }

      // Proceed
      updateBridgeState({ step: SimpleBridgeStep.STEP_1_COMPLETE });
      addTransaction({
        step: 1,
        status: "SUCCESS" as const,
        chainName: "Base",
        message: "Transfer complete",
        txHash:
          typeof hyperlaneResult === "object" &&
          hyperlaneResult !== null &&
          "hash" in hyperlaneResult
            ? (hyperlaneResult as { hash: string }).hash
            : undefined,
        explorerUrl:
          typeof hyperlaneResult === "object" &&
          hyperlaneResult !== null &&
          "hash" in hyperlaneResult
            ? getExplorerUrl((hyperlaneResult as { hash: string }).hash, "Base")
            : undefined,
      });

      // Auto-return to Base chain at end
      try {
        if (chain?.id !== BASE_CHAIN_ID) {
          await switchChain({ chainId: BASE_CHAIN_ID });
        }
      } catch (returnError) {
        console.warn(
          "Auto-return to Base failed:",
          returnError.message || returnError,
        );
      }

      // Step 2: Torus EVM → Native (via withdrawal)
      console.log("Base→Native: Starting step 2 (withdrawal)");
      updateBridgeState({ step: SimpleBridgeStep.STEP_2_PREPARING });

      addTransaction({
        step: 2,
        status: "STARTING",
        chainName: "Torus EVM",
        message: "Preparing Torus EVM → Native withdrawal",
      });

      // Switch to Torus EVM if not already
      if (chain?.id !== torusEvmChainId) {
        try {
          await switchChain({ chainId: torusEvmChainId });
        } catch (switchError) {
          const isUserRejection =
            switchError.message?.includes("declined") ||
            switchError.message?.includes("rejected") ||
            switchError.message?.includes("user rejected") ||
            switchError.message.includes("User denied") ||
            switchError.message.includes("User rejected") ||
            switchError.message.includes("User denied transaction signature") ||
            (switchError.message.includes("signature") &&
              switchError.message.includes("denied")) ||
            switchError.name === "UserRejectedRequestError" ||
            (switchError.name === "TransactionExecutionError" &&
              switchError.message.includes("User rejected"));

          const errorMessage = isUserRejection
            ? "Chain switch rejected by user"
            : "Failed to switch to Torus EVM chain";

          addTransaction({
            step: 2,
            status: "ERROR",
            chainName: "Torus EVM",
            message: errorMessage,
            txHash: undefined,
            explorerUrl: undefined,
          });
          updateBridgeState({
            step: SimpleBridgeStep.ERROR,
            errorMessage,
          });
          if (isUserRejection) {
            return;
          } else {
            throw switchError;
          }
        }
      }

      // Check gas balance on Torus EVM
      await refetchNativeEthBalance();
      const estimatedGas = 21000n + 100000n; // Base + rough contract call
      if (nativeEthBalance?.value < estimatedGas) {
        const errorMessage =
          "Insufficient ETH for gas on Torus EVM. Please add funds.";
        addTransaction({
          step: 2,
          status: "ERROR",
          chainName: "Torus EVM",
          message: errorMessage,
          txHash: undefined,
          explorerUrl: undefined,
        });
        updateBridgeState({
          step: SimpleBridgeStep.ERROR,
          errorMessage,
        });
        throw new Error(errorMessage);
      }

      updateBridgeState({ step: SimpleBridgeStep.STEP_2_SIGNING });

      const [withdrawError, txHash] = await tryAsync(
        withdrawFromTorusEvm(
          walletClient,
          chain,
          selectedAccount.address as SS58Address,
          amountRems,
          async () => {
            await refetchTorusEvmBalance();
          },
        ),
      );

      if (withdrawError !== undefined) {
        console.log("Withdrawal catch triggered:", withdrawError); // Debug
        const isUserRejection =
          withdrawError.message.includes("rejected") ||
          withdrawError.message.includes("denied") ||
          withdrawError.message.includes("cancelled") ||
          withdrawError.message.includes("User denied") ||
          withdrawError.message.includes("User rejected") ||
          withdrawError.message.includes("User denied transaction signature") ||
          (withdrawError.message.includes("signature") &&
            withdrawError.message.includes("denied")) ||
          withdrawError.name === "UserRejectedRequestError" ||
          (withdrawError.name === "TransactionExecutionError" &&
            withdrawError.message.includes("User rejected"));

        const errorMessage = isUserRejection
          ? "Withdrawal transaction rejected by user"
          : "Failed to withdraw from Torus EVM";

        addTransaction({
          step: 2,
          status: "ERROR",
          chainName: "Torus EVM",
          message: errorMessage,
          txHash: undefined,
          explorerUrl: undefined,
        });

        updateBridgeState({
          step: SimpleBridgeStep.ERROR,
          errorMessage,
        });

        if (isUserRejection) {
          return;
        } else {
          throw withdrawError;
        }
      }

      updateBridgeState({ step: SimpleBridgeStep.STEP_2_CONFIRMING });

      // Wait for transaction receipt if we have wagmi config
      if (torusEvmClient && txHash) {
        const [receiptError] = await tryAsync(
          waitForTransactionReceipt(torusEvmClient as any, {
            hash: txHash,
            confirmations: 2,
          }),
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
          explorerUrl: getExplorerUrl(txHash, "Torus EVM"),
        });
      }

      updateBridgeState({ step: SimpleBridgeStep.COMPLETE });
      toast({
        title: "Transfer Complete!",
        description: "Successfully transferred Base TORUS to Native TORUS",
      });
    },
    [
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
      torusEvmBalance,
      switchChain,
      nativeEthBalance,
      refetchNativeEthBalance,
    ],
  );

  // Native → Base Torus flow
  const executeNativeToBase = useCallback(
    async (amount: string) => {
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
        message: "Preparing Native → Torus EVM bridge",
      });

      updateBridgeState({ step: SimpleBridgeStep.STEP_1_SIGNING });

      const [sendErr, sendRes] = await sendTx(
        transferAllowDeath(api, evmSS58Addr, amountRems),
      );

      if (sendErr !== undefined) {
        console.log("sendTx error:", sendErr); // Debug
        const isUserRejection =
          sendErr.message.includes("rejected") ||
          sendErr.message.includes("Cancelled") ||
          sendErr.message.includes("denied") ||
          sendErr.message.includes("cancelled") ||
          sendErr.message.includes("User denied") ||
          sendErr.message.includes("User rejected") ||
          sendErr.message.includes("User denied transaction signature") ||
          (sendErr.message.includes("signature") &&
            sendErr.message.includes("denied")) ||
          sendErr.name === "UserRejectedRequestError" ||
          (sendErr.name === "TransactionExecutionError" &&
            sendErr.message.includes("User rejected"));

        const errorMessage = isUserRejection
          ? "Transaction rejected by user"
          : "Failed to bridge from Native to Torus EVM";

        addTransaction({
          step: 1,
          status: "ERROR",
          chainName: "Torus Native",
          message: errorMessage,
          txHash: undefined,
          explorerUrl: undefined,
        });

        updateBridgeState({
          step: SimpleBridgeStep.ERROR,
          errorMessage,
        });

        if (isUserRejection) {
          return;
        } else {
          throw sendErr;
        }
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
            message: "Bridge complete",
          });
          resolve();
        });

        tracker.on("error", (error) => {
          updateBridgeState({
            step: SimpleBridgeStep.ERROR,
            errorMessage: "Native bridge transaction failed",
          });
          addTransaction({
            step: 1,
            status: "ERROR",
            chainName: "Torus Native",
            message: "Transaction failed",
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
        message: "Preparing Torus EVM → Base transfer",
      });

      // Switch to Torus EVM for Hyperlane from Torus
      if (chain?.id !== torusEvmChainId) {
        await switchChain({ chainId: torusEvmChainId });
      }

      // Gas check same as above
      await refetchNativeEthBalance();
      const estimatedGas = 21000n + 100000n; // Base + rough contract call
      if (nativeEthBalance?.value < estimatedGas) {
        const errorMessage =
          "Insufficient ETH for gas on Torus EVM. Please add funds.";
        addTransaction({
          step: 2,
          status: "ERROR",
          chainName: "Torus EVM",
          message: errorMessage,
          txHash: undefined,
          explorerUrl: undefined,
        });
        updateBridgeState({
          step: SimpleBridgeStep.ERROR,
          errorMessage,
        });
        throw new Error(errorMessage);
      }

      updateBridgeState({ step: SimpleBridgeStep.STEP_2_SIGNING });

      addTransaction({
        step: 2,
        status: "SIGNING",
        chainName: "Torus EVM",
        message: "Signing transaction...",
      });

      const [hyperlaneError2, hyperlaneResult2] = await tryAsync(
        triggerHyperlaneTransfer({
          origin: "torus",
          destination: "base",
          tokenIndex: 1,
          amount,
          recipient: evmAddress,
        }),
      );

      console.log("Step 2 Hyperlane result after tryAsync:", [
        hyperlaneError2,
        hyperlaneResult2,
      ]); // Debug

      if (hyperlaneError2) {
        const error = hyperlaneError2;
        console.log("Step 2 Hyperlane failure detected:", error); // Debug

        const isUserRejection =
          error.message.includes("rejected") ||
          error.message.includes("denied") ||
          error.message.includes("cancelled") ||
          error.message.includes("User denied") ||
          error.message.includes("User rejected") ||
          error.message.includes("User denied transaction signature") ||
          (error.message.includes("signature") &&
            error.message.includes("denied")) ||
          error.name === "UserRejectedRequestError" ||
          (error.name === "TransactionExecutionError" &&
            error.message.includes("User rejected"));

        const errorMessage = isUserRejection
          ? "Transaction rejected by user"
          : "Failed to execute Torus EVM → Base transfer";

        addTransaction({
          step: 2,
          status: "ERROR",
          chainName: "Torus EVM",
          message: errorMessage,
          txHash: undefined,
          explorerUrl: undefined,
        });

        updateBridgeState({
          step: SimpleBridgeStep.ERROR,
          errorMessage,
        });

        if (isUserRejection) {
          return;
        } else {
          throw error;
        }
      }

      // Success
      console.log(
        "Native→Base: Step 2 Hyperlane successful (no error, result:",
        hyperlaneResult2,
        ")",
      );

      // For NativeToBase Step 2 Hyperlane: Similar fixed wait (3 min for Base confirm)
      // After no error in Step 2 signing
      updateBridgeState({ step: SimpleBridgeStep.STEP_2_CONFIRMING });
      addTransaction({
        step: 2,
        status: "CONFIRMING" as const,
        chainName: "Torus EVM",
        message: "Waiting for confirmation...",
        txHash: undefined,
        explorerUrl: undefined,
      });

      // Baseline for Base
      await refetchBaseBalance();
      const baseBaselineBalance = baseBalance?.value || 0n;
      const baseExpectedIncrease = toNano(parseFloat(amount));

      console.log(
        "Baseline Base balance:",
        Number(baseBaselineBalance) / 1e18,
        "expected +",
        Number(baseExpectedIncrease) / 1e18,
      );

      // Poll for Base
      const basePollInterval = 5000; // 5s
      const baseMaxPolls = 180; // 15 min
      let basePollCount = 0;
      const basePollPromise = new Promise<void>((resolve, reject) => {
        const interval = setInterval(async () => {
          basePollCount++;
          const baseRefetchResult = await refetchBaseBalance();
          if (baseRefetchResult.status === "error") {
            console.warn("Base refetch failed");
            return;
          }
          const currentBaseBalance = baseRefetchResult.data?.value || 0n;
          console.log(
            `Base Poll ${basePollCount}: Current ${(Number(currentBaseBalance) / 1e18).toFixed(2)}, baseline ${(Number(baseBaselineBalance) / 1e18).toFixed(2)}`,
          );

          if (
            currentBaseBalance >=
            baseBaselineBalance + baseExpectedIncrease
          ) {
            clearInterval(interval);
            resolve();
          } else if (basePollCount >= baseMaxPolls) {
            clearInterval(interval);
            reject(new Error("Confirmation timeout - no balance increase"));
          }
        }, basePollInterval);
      });

      try {
        await basePollPromise;
        console.log("Step 2 confirmed by balance increase");
      } catch (basePollError) {
        console.log("Step 2 confirmation failed:", basePollError);
        const baseErrorMessage =
          "Torus EVM transfer did not confirm (check balance and retry)";
        addTransaction({
          step: 2,
          status: "ERROR" as const,
          chainName: "Torus EVM",
          message: baseErrorMessage,
          txHash: undefined,
          explorerUrl: undefined,
        });
        updateBridgeState({
          step: SimpleBridgeStep.ERROR,
          errorMessage: baseErrorMessage,
        });
        throw basePollError;
      }

      // Proceed to COMPLETE
      updateBridgeState({ step: SimpleBridgeStep.COMPLETE });
      addTransaction({
        step: 2,
        status: "SUCCESS" as const,
        chainName: "Torus EVM",
        message: "Transfer complete",
        txHash:
          typeof hyperlaneResult2 === "object" &&
          hyperlaneResult2 !== null &&
          "hash" in hyperlaneResult2
            ? (hyperlaneResult2 as { hash: string }).hash
            : undefined,
        explorerUrl:
          typeof hyperlaneResult2 === "object" &&
          hyperlaneResult2 !== null &&
          "hash" in hyperlaneResult2
            ? getExplorerUrl(
                (hyperlaneResult2 as { hash: string }).hash,
                "Torus EVM",
              )
            : undefined,
      });

      toast({
        title: "Transfer Complete!",
        description: "Successfully transferred Native TORUS to Base TORUS",
      });
    },
    [
      selectedAccount,
      evmAddress,
      api,
      sendTx,
      triggerHyperlaneTransfer,
      updateBridgeState,
      addTransaction,
      toast,
      baseBalance,
      refetchBaseBalance,
      switchChain,
      nativeEthBalance,
      refetchNativeEthBalance,
    ],
  );

  // Helper function to retry only step 2 of base-to-native (withdrawal)
  const executeBaseToNativeStep2 = useCallback(
    async (amount: string) => {
      if (!selectedAccount || !evmAddress || !walletClient || !chain) {
        throw new Error("Wallets not properly connected");
      }

      const amountRems = toNano(parseFloat(amount));

      // Step 2: Torus EVM → Native (via withdrawal)
      updateBridgeState({ step: SimpleBridgeStep.STEP_2_PREPARING });

      // Update the failed transaction to STARTING
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.step === 2
            ? {
                ...tx,
                status: "STARTING" as const,
                message: "Retrying withdrawal...",
              }
            : tx,
        ),
      );

      // Switch to Torus EVM for retry
      if (chain?.id !== torusEvmChainId) {
        await switchChain({ chainId: torusEvmChainId });
      }

      // Check gas balance on Torus EVM for retry
      await refetchNativeEthBalance();
      const estimatedGas = 21000n + 100000n; // Base + rough contract call
      if (nativeEthBalance?.value < estimatedGas) {
        const errorMessage =
          "Insufficient ETH for gas on Torus EVM. Please add funds.";
        addTransaction({
          step: 2,
          status: "ERROR",
          chainName: "Torus EVM",
          message: errorMessage,
          txHash: undefined,
          explorerUrl: undefined,
        });
        updateBridgeState({
          step: SimpleBridgeStep.ERROR,
          errorMessage,
        });
        throw new Error(errorMessage);
      }

      // Wait for balance to be available on Torus EVM
      await refetchTorusEvmBalance();

      updateBridgeState({ step: SimpleBridgeStep.STEP_2_SIGNING });

      const [withdrawError, txHash] = await tryAsync(
        withdrawFromTorusEvm(
          walletClient,
          chain,
          selectedAccount.address as SS58Address,
          amountRems,
          async () => {
            await refetchTorusEvmBalance();
          },
        ),
      );

      if (withdrawError !== undefined) {
        console.log("Withdrawal catch triggered:", withdrawError); // Debug
        const isUserRejection =
          withdrawError.message.includes("rejected") ||
          withdrawError.message.includes("denied") ||
          withdrawError.message.includes("cancelled") ||
          withdrawError.message.includes("User denied") ||
          withdrawError.message.includes("User rejected") ||
          withdrawError.message.includes("User denied transaction signature") ||
          (withdrawError.message.includes("signature") &&
            withdrawError.message.includes("denied")) ||
          withdrawError.name === "UserRejectedRequestError" ||
          (withdrawError.name === "TransactionExecutionError" &&
            withdrawError.message.includes("User rejected"));

        const errorMessage = isUserRejection
          ? "Withdrawal transaction rejected by user"
          : "Failed to withdraw from Torus EVM";

        addTransaction({
          step: 2,
          status: "ERROR",
          chainName: "Torus EVM",
          message: errorMessage,
          txHash: undefined,
          explorerUrl: undefined,
        });

        updateBridgeState({
          step: SimpleBridgeStep.ERROR,
          errorMessage,
        });

        if (isUserRejection) {
          return;
        } else {
          throw withdrawError;
        }
      }

      updateBridgeState({ step: SimpleBridgeStep.STEP_2_CONFIRMING });

      // Wait for transaction receipt if we have wagmi config
      if (torusEvmClient && txHash) {
        const [receiptError] = await tryAsync(
          waitForTransactionReceipt(torusEvmClient as any, {
            hash: txHash,
            confirmations: 2,
          }),
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
          explorerUrl: getExplorerUrl(txHash, "Torus EVM"),
        });
      }

      updateBridgeState({ step: SimpleBridgeStep.COMPLETE });
      toast({
        title: "Transfer Complete!",
        description: "Successfully transferred Base TORUS to Native TORUS",
      });
    },
    [
      selectedAccount,
      evmAddress,
      walletClient,
      chain,
      refetchTorusEvmBalance,
      torusEvmClient,
      updateBridgeState,
      addTransaction,
      getExplorerUrl,
      toast,
      switchChain,
      nativeEthBalance,
      refetchNativeEthBalance,
    ],
  );

  // Helper function to retry only step 2 of native-to-base (hyperlane transfer)
  const executeNativeToBaseStep2 = useCallback(
    async (amount: string) => {
      if (!evmAddress) {
        throw new Error("EVM wallet not properly connected");
      }

      // Step 2: Torus EVM → Base (via Hyperlane)
      updateBridgeState({ step: SimpleBridgeStep.STEP_2_PREPARING });

      // Update the failed transaction to STARTING
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.step === 2
            ? {
                ...tx,
                status: "STARTING" as const,
                message: "Retrying transfer...",
              }
            : tx,
        ),
      );

      updateBridgeState({ step: SimpleBridgeStep.STEP_2_SIGNING });

      const [hyperlaneError] = await tryAsync(
        triggerHyperlaneTransfer({
          origin: "torus",
          destination: "base",
          tokenIndex: 1, // This should be the correct index for Torus EVM TORUS
          amount,
          recipient: evmAddress, // Send to our Base address
        }),
      );

      if (hyperlaneError !== undefined) {
        console.log("Step 2 hyperlane error:", hyperlaneError); // Debug
        const isUserRejection =
          hyperlaneError.message.includes("rejected") ||
          hyperlaneError.message.includes("denied") ||
          hyperlaneError.message.includes("cancelled") ||
          hyperlaneError.message.includes("User denied") ||
          hyperlaneError.message.includes("User rejected") ||
          hyperlaneError.message.includes(
            "User denied transaction signature",
          ) ||
          (hyperlaneError.message.includes("signature") &&
            hyperlaneError.message.includes("denied")) ||
          hyperlaneError.name === "UserRejectedRequestError" ||
          (hyperlaneError.name === "TransactionExecutionError" &&
            hyperlaneError.message.includes("User rejected"));

        const errorMessage = isUserRejection
          ? "Transaction rejected by user"
          : "Failed to execute Torus EVM → Base transfer";

        addTransaction({
          step: 2,
          status: "ERROR",
          chainName: "Torus EVM",
          message: errorMessage,
          txHash: undefined,
          explorerUrl: undefined,
        });

        updateBridgeState({
          step: SimpleBridgeStep.ERROR,
          errorMessage,
        });

        if (isUserRejection) {
          return;
        } else {
          throw hyperlaneError;
        }
      }

      updateBridgeState({ step: SimpleBridgeStep.COMPLETE });
      addTransaction({
        step: 2,
        status: "SUCCESS",
        chainName: "Torus EVM",
        message: "Transfer complete",
      });

      toast({
        title: "Transfer Complete!",
        description: "Successfully transferred Native TORUS to Base TORUS",
      });
    },
    [
      evmAddress,
      triggerHyperlaneTransfer,
      updateBridgeState,
      addTransaction,
      toast,
      switchChain,
    ],
  );

  const retrySwitchOnly = useCallback(
    async (direction: SimpleBridgeDirection, amount: string) => {
      if (!direction || !amount) return;
      console.log(`Retrying switch only for ${direction}`);
      updateBridgeState({ step: SimpleBridgeStep.STEP_2_SWITCHING });
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.step === 2
            ? {
                ...tx,
                status: "STARTING" as const,
                message: "Retrying switch to Torus EVM...",
                metadata: undefined,
              }
            : tx,
        ),
      );

      // Run switch logic (same as main flows)
      let switchAttempts = 0;
      const maxSwitchAttempts = 2;
      let switchSucceeded = false;
      while (switchAttempts < maxSwitchAttempts && !switchSucceeded) {
        try {
          if (chain?.id !== torusEvmChainId) {
            await switchChain({ chainId: torusEvmChainId });
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Sync wait
          }
          if (chain?.id === torusEvmChainId) {
            switchSucceeded = true;
            console.log("Switch retry succeeded");
          } else {
            throw new Error("Switch verification failed");
          }
        } catch (switchError) {
          switchAttempts++;
          if (switchAttempts >= maxSwitchAttempts) {
            const isUserRejection =
              switchError.message?.includes("declined") ||
              switchError.message?.includes("rejected") ||
              switchError.message?.includes("user rejected") ||
              switchError.name === "UserRejectedRequestError" ||
              (switchError.name === "TransactionExecutionError" &&
                switchError.message?.includes("User rejected"));
            const errorMessage = isUserRejection
              ? "Switch retry rejected – please accept in wallet"
              : "Switch retry failed – network issue";
            addTransaction({
              step: 2,
              status: "ERROR" as const,
              chainName: "Torus EVM",
              message: errorMessage,
              txHash: undefined,
              explorerUrl: undefined,
              metadata: { type: "switch" },
            });
            updateBridgeState({
              step: SimpleBridgeStep.ERROR,
              errorMessage,
            });
            return; // Stop retry, let user manual
          }
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Delay
        }
      }

      if (!switchSucceeded) {
        const errorMessage = "Switch retry failed after attempts";
        addTransaction({
          step: 2,
          status: "ERROR" as const,
          chainName: "Torus EVM",
          message: errorMessage,
          metadata: { type: "switch" },
        });
        updateBridgeState({
          step: SimpleBridgeStep.ERROR,
          errorMessage,
        });
        return;
      }

      // Switch OK - update and proceed to gas
      addTransaction({
        step: 2,
        status: "SUCCESS" as const,
        chainName: "Torus EVM",
        message: "Switch retried successfully – checking gas...",
        metadata: undefined,
      });

      // Gas check
      await refetchNativeEthBalance();
      const currentNativeBalance = nativeEthBalance?.value || 0n;
      const estimatedGas = 21000n + 100000n;
      if (currentNativeBalance < estimatedGas) {
        const errorMessage =
          "Insufficient ETH for gas on Torus EVM after switch. Please add funds.";
        addTransaction({
          step: 2,
          status: "ERROR" as const,
          chainName: "Torus EVM",
          message: errorMessage,
          metadata: undefined,
        });
        updateBridgeState({
          step: SimpleBridgeStep.ERROR,
          errorMessage,
        });
        return;
      }

      // Proceed to direction-specific action
      try {
        if (direction === "base-to-native") {
          // Withdrawal
          updateBridgeState({ step: SimpleBridgeStep.STEP_2_SIGNING });
          const [withdrawError, txHash] = await tryAsync(
            withdrawFromTorusEvm(
              walletClient,
              chain,
              selectedAccount.address as SS58Address,
              toNano(parseFloat(amount)),
              async () => await refetchTorusEvmBalance(),
            ),
          );
          if (withdrawError !== undefined) {
            // Existing withdrawal error handling
            const isUserRejection =
              withdrawError.message.includes("rejected") ||
              withdrawError.message.includes("denied") ||
              withdrawError.message.includes("cancelled") ||
              withdrawError.message.includes("User denied") ||
              withdrawError.message.includes("User rejected") ||
              withdrawError.message.includes(
                "User denied transaction signature",
              ) ||
              (withdrawError.message.includes("signature") &&
                withdrawError.message.includes("denied")) ||
              withdrawError.name === "UserRejectedRequestError" ||
              (withdrawError.name === "TransactionExecutionError" &&
                withdrawError.message.includes("User rejected"));
            const errorMessage = isUserRejection
              ? "Withdrawal transaction rejected by user"
              : "Failed to withdraw from Torus EVM";
            addTransaction({
              step: 2,
              status: "ERROR",
              chainName: "Torus EVM",
              message: errorMessage,
              txHash: undefined,
              explorerUrl: undefined,
            });
            updateBridgeState({
              step: SimpleBridgeStep.ERROR,
              errorMessage,
            });
            return;
          }
          // Existing confirming logic...
          updateBridgeState({ step: SimpleBridgeStep.STEP_2_CONFIRMING });

          // Wait for transaction receipt if we have wagmi config
          if (torusEvmClient && txHash) {
            const [receiptError] = await tryAsync(
              waitForTransactionReceipt(torusEvmClient as any, {
                hash: txHash,
                confirmations: 2,
              }),
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
              explorerUrl: getExplorerUrl(txHash, "Torus EVM"),
            });
          }
        } else if (direction === "native-to-base") {
          // Hyperlane from Torus EVM
          updateBridgeState({ step: SimpleBridgeStep.STEP_2_SIGNING });
          const [hyperlaneError, hyperlaneResult] = await tryAsync(
            triggerHyperlaneTransfer({
              origin: "torus",
              destination: "base",
              tokenIndex: 1,
              amount,
              recipient: evmAddress,
            }),
          );
          if (hyperlaneError !== undefined) {
            // Existing hyperlane error handling
            const isUserRejection =
              hyperlaneError.message.includes("rejected") ||
              hyperlaneError.message.includes("denied") ||
              hyperlaneError.message.includes("cancelled") ||
              hyperlaneError.message.includes("User denied") ||
              hyperlaneError.message.includes("User rejected") ||
              hyperlaneError.message.includes(
                "User denied transaction signature",
              ) ||
              (hyperlaneError.message.includes("signature") &&
                hyperlaneError.message.includes("denied")) ||
              hyperlaneError.name === "UserRejectedRequestError" ||
              (hyperlaneError.name === "TransactionExecutionError" &&
                hyperlaneError.message.includes("User rejected"));
            const errorMessage = isUserRejection
              ? "Transaction rejected by user"
              : "Failed to execute Torus EVM → Base transfer";
            addTransaction({
              step: 2,
              status: "ERROR",
              chainName: "Torus EVM",
              message: errorMessage,
              txHash: undefined,
              explorerUrl: undefined,
            });
            updateBridgeState({
              step: SimpleBridgeStep.ERROR,
              errorMessage,
            });
            return;
          }
          // Existing confirming and polling...
          updateBridgeState({ step: SimpleBridgeStep.STEP_2_CONFIRMING });
          addTransaction({
            step: 2,
            status: "CONFIRMING" as const,
            chainName: "Torus EVM",
            message: "Waiting for confirmation...",
            txHash: undefined,
            explorerUrl: undefined,
          });

          // Baseline for Base
          await refetchBaseBalance();
          const baseBaselineBalance = baseBalance?.value || 0n;
          const baseExpectedIncrease = toNano(parseFloat(amount));

          console.log(
            "Baseline Base balance:",
            Number(baseBaselineBalance) / 1e18,
            "expected +",
            Number(baseExpectedIncrease) / 1e18,
          );

          // Poll for Base
          const basePollInterval = 5000; // 5s
          const baseMaxPolls = 180; // 15 min
          let basePollCount = 0;
          const basePollPromise = new Promise<void>((resolve, reject) => {
            const interval = setInterval(async () => {
              basePollCount++;
              const baseRefetchResult = await refetchBaseBalance();
              if (baseRefetchResult.status === "error") {
                console.warn("Base refetch failed");
                return;
              }
              const currentBaseBalance = baseRefetchResult.data?.value || 0n;
              console.log(
                `Base Poll ${basePollCount}: Current ${(Number(currentBaseBalance) / 1e18).toFixed(2)}, baseline ${(Number(baseBaselineBalance) / 1e18).toFixed(2)}`,
              );

              if (
                currentBaseBalance >=
                baseBaselineBalance + baseExpectedIncrease
              ) {
                clearInterval(interval);
                resolve();
              } else if (basePollCount >= baseMaxPolls) {
                clearInterval(interval);
                reject(new Error("Confirmation timeout - no balance increase"));
              }
            }, basePollInterval);
          });

          try {
            await basePollPromise;
            console.log("Step 2 confirmed by balance increase");
          } catch (basePollError) {
            console.log("Step 2 confirmation failed:", basePollError);
            const baseErrorMessage =
              "Torus EVM transfer did not confirm (check balance and retry)";
            addTransaction({
              step: 2,
              status: "ERROR" as const,
              chainName: "Torus EVM",
              message: baseErrorMessage,
              txHash: undefined,
              explorerUrl: undefined,
            });
            updateBridgeState({
              step: SimpleBridgeStep.ERROR,
              errorMessage: baseErrorMessage,
            });
            throw basePollError;
          }
        }
      } catch (proceedError) {
        console.error("Error proceeding after switch retry:", proceedError);
        updateBridgeState({
          step: SimpleBridgeStep.ERROR,
          errorMessage:
            proceedError instanceof Error
              ? proceedError.message
              : "Proceed failed",
        });
      }
    },
    [
      updateBridgeState,
      setTransactions,
      switchChain,
      torusEvmChainId,
      chain,
      refetchNativeEthBalance,
      nativeEthBalance,
      walletClient,
      selectedAccount,
      tryAsync,
      withdrawFromTorusEvm,
      refetchTorusEvmBalance,
      triggerHyperlaneTransfer,
      evmAddress,
      baseBalance,
      refetchBaseBalance,
      getExplorerUrl,
    ],
  );

  const executeTransfer = useCallback(
    async (direction: SimpleBridgeDirection, amount: string) => {
      // Reset state for new transfer
      updateBridgeState({
        step: SimpleBridgeStep.IDLE,
        direction,
        amount,
        errorMessage: undefined,
      });
      setTransactions([]);

      // Execute transfer - errors are handled within the functions
      if (direction === "base-to-native") {
        await executeBaseToNative(amount);
      } else {
        await executeNativeToBase(amount);
      }
    },
    [executeBaseToNative, executeNativeToBase, updateBridgeState],
  );

  const resetTransfer = useCallback(() => {
    setBridgeState({
      step: SimpleBridgeStep.IDLE,
      direction: null,
      amount: "",
    });
    setTransactions([]);
  }, []);

  const retryFromFailedStep = useCallback(async () => {
    if (!bridgeState.direction || !bridgeState.amount) return;

    // Find the failed transaction
    const failedTransaction = transactions.find((tx) => tx.status === "ERROR");
    if (!failedTransaction) return;

    const { direction, amount } = bridgeState;

    try {
      if (failedTransaction.step === 1) {
        // Retry step 1
        if (direction === "base-to-native") {
          await executeBaseToNative(amount);
        } else {
          await executeNativeToBase(amount);
        }
      } else if (failedTransaction.step === 2) {
        // Retry step 2 - we need to implement partial retry logic
        if (failedTransaction.metadata?.type === "switch") {
          await retrySwitchOnly(direction, amount);
          return;
        }
        if (direction === "base-to-native") {
          // Resume from step 2 of base-to-native (withdrawal)
          await executeBaseToNativeStep2(amount);
        } else {
          // Resume from step 2 of native-to-base (hyperlane transfer)
          await executeNativeToBaseStep2(amount);
        }
      }
    } catch (error) {
      console.error("Retry failed:", error);
      updateBridgeState({
        step: SimpleBridgeStep.ERROR,
        errorMessage: error instanceof Error ? error.message : "Retry failed",
      });
    }
  }, [
    bridgeState,
    transactions,
    executeBaseToNative,
    executeNativeToBase,
    executeBaseToNativeStep2,
    executeNativeToBaseStep2,
    updateBridgeState,
    retrySwitchOnly,
  ]);

  return {
    bridgeState,
    transactions,
    executeTransfer,
    resetTransfer,
    retryFromFailedStep,
    isTransferInProgress:
      bridgeState.step !== SimpleBridgeStep.IDLE &&
      bridgeState.step !== SimpleBridgeStep.COMPLETE &&
      bridgeState.step !== SimpleBridgeStep.ERROR,
  };
}
