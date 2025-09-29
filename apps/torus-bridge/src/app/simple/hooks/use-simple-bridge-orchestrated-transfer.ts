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
  useConfig,
  useSwitchChain,
  useWalletClient,
} from "wagmi";
import type {
  SimpleBridgeDirection,
  SimpleBridgeState,
  SimpleBridgeTransaction,
} from "../_components/simple-bridge-types";
import { SimpleBridgeStep } from "../_components/simple-bridge-types";

const BASE_CHAIN_ID = 8453;

const GAS_CONFIG = {
  BASE_GAS: 21000n,
  CONTRACT_CALL_GAS: 100000n,
  get ESTIMATED_TOTAL() {
    return this.BASE_GAS + this.CONTRACT_CALL_GAS;
  },
} as const;

const POLLING_CONFIG = {
  INTERVAL_MS: 5000,
  MAX_POLLS: 180,
  SWITCH_RETRY_DELAY_MS: 1000,
  MAX_SWITCH_ATTEMPTS: 2,
} as const;

const CONFIRMATION_CONFIG = {
  REQUIRED_CONFIRMATIONS: 2,
} as const;

function isUserRejectionError(error: Error): boolean {
  const errorMessage = error.message.toLowerCase();
  const errorName = error.name;

  return (
    errorMessage.includes("rejected") ||
    errorMessage.includes("denied") ||
    errorMessage.includes("cancelled") ||
    errorMessage.includes("user denied") ||
    errorMessage.includes("user rejected") ||
    errorMessage.includes("user denied transaction signature") ||
    errorMessage.includes("declined") ||
    (errorMessage.includes("signature") && errorMessage.includes("denied")) ||
    errorName === "UserRejectedRequestError" ||
    (errorName === "TransactionExecutionError" &&
      errorMessage.includes("user rejected"))
  );
}

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
  const wagmiConfig = useConfig();
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
  const _multiProvider = useMultiProvider();

  // Token transfer hook for Hyperlane transfers
  const { triggerTransactions: triggerHyperlaneTransfer } = useTokenTransfer();

  // EVM balance and client for Torus EVM
  const _torusEvmClient = useClient({ chainId: torusEvmChainId });
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
      const lowerChainName = chainName.toLowerCase();

      if (lowerChainName === "base") {
        return `https://basescan.org/tx/${txHash}`;
      }

      if (lowerChainName === "torus evm" || lowerChainName === "torus") {
        return `https://blockscout.torus.network/tx/${txHash}`;
      }

      return "";
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

      let baseSwitchAttempts = 0;
      while (
        baseSwitchAttempts < POLLING_CONFIG.MAX_SWITCH_ATTEMPTS &&
        chain.id !== BASE_CHAIN_ID
      ) {
        try {
          switchChain({ chainId: BASE_CHAIN_ID });
          await new Promise<void>((resolve) =>
            setTimeout(resolve, POLLING_CONFIG.SWITCH_RETRY_DELAY_MS),
          );
          if (chain.id === BASE_CHAIN_ID) break;
          throw new Error("Base switch verification failed");
        } catch {
          baseSwitchAttempts++;
          if (baseSwitchAttempts >= POLLING_CONFIG.MAX_SWITCH_ATTEMPTS) {
            // Error handling as before
          }
          await new Promise((resolve) =>
            setTimeout(resolve, POLLING_CONFIG.SWITCH_RETRY_DELAY_MS),
          );
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

      if (hyperlaneError) {
        const errorMessage = isUserRejectionError(hyperlaneError)
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

        if (isUserRejectionError(hyperlaneError)) {
          return;
        }

        throw hyperlaneError;
      }

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

      await refetchTorusEvmBalance();
      const baselineBalance = torusEvmBalance?.value || 0n;
      const expectedIncrease = toNano(parseFloat(amount));

      let pollCount = 0;
      const pollPromise = new Promise<void>((resolve, reject) => {
        const interval = setInterval(() => {
          void (async () => {
            pollCount++;
            const refetchResult = await refetchTorusEvmBalance();
            if (refetchResult.status === "error") {
              return;
            }
            const currentBalance = refetchResult.data?.value || 0n;

            if (currentBalance >= baselineBalance + expectedIncrease) {
              clearInterval(interval);
              resolve();
            } else if (pollCount >= POLLING_CONFIG.MAX_POLLS) {
              clearInterval(interval);
              reject(new Error("Confirmation timeout - no balance increase"));
            }
          })();
        }, POLLING_CONFIG.INTERVAL_MS);
      });

      try {
        await pollPromise;
      } catch (pollError) {
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
      const step1TxHash =
        typeof hyperlaneResult === "object" && "hash" in hyperlaneResult
          ? (hyperlaneResult as { hash: string }).hash
          : undefined;

      addTransaction({
        step: 1,
        status: "SUCCESS" as const,
        chainName: "Base",
        message: "Transfer complete",
        txHash: step1TxHash,
        explorerUrl: step1TxHash
          ? getExplorerUrl(step1TxHash, "Base")
          : undefined,
      });

      // Auto-return to Base chain at end
      try {
        if (chain.id !== BASE_CHAIN_ID) {
          switchChain({ chainId: BASE_CHAIN_ID });
        }
      } catch (returnError: unknown) {
        console.warn(
          "Auto-return to Base failed:",
          returnError instanceof Error
            ? returnError.message
            : String(returnError),
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

      if (chain.id !== torusEvmChainId) {
        try {
          switchChain({ chainId: torusEvmChainId });
        } catch (switchError: unknown) {
          if (!(switchError instanceof Error)) {
            throw switchError;
          }

          const errorMessage = isUserRejectionError(switchError)
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

          if (isUserRejectionError(switchError)) {
            return;
          }

          throw switchError;
        }
      }

      await refetchNativeEthBalance();
      if ((nativeEthBalance?.value ?? 0n) < GAS_CONFIG.ESTIMATED_TOTAL) {
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
        const errorMessage = isUserRejectionError(withdrawError)
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

        if (isUserRejectionError(withdrawError)) {
          return;
        }

        throw withdrawError;
      }

      updateBridgeState({ step: SimpleBridgeStep.STEP_2_CONFIRMING });

      // Wait for transaction receipt
      const [receiptError] = await tryAsync(
        waitForTransactionReceipt(wagmiConfig, {
          hash: txHash,
          confirmations: CONFIRMATION_CONFIG.REQUIRED_CONFIRMATIONS,
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
      wagmiConfig,
      updateBridgeState,
      addTransaction,
      getExplorerUrl,
      toast,
      torusEvmBalance,
      switchChain,
      torusEvmChainId,
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
        const errorMessage = isUserRejectionError(sendErr)
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

        if (isUserRejectionError(sendErr)) {
          return;
        }

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
            message: "Bridge complete",
          });
          resolve();
        });

        tracker.on("error", (error: unknown) => {
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
          reject(error instanceof Error ? error : new Error(String(error)));
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
        switchChain({ chainId: torusEvmChainId });
      }

      await refetchNativeEthBalance();
      if ((nativeEthBalance?.value ?? 0n) < GAS_CONFIG.ESTIMATED_TOTAL) {
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

      if (hyperlaneError2) {
        const errorMessage = isUserRejectionError(hyperlaneError2)
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

        if (isUserRejectionError(hyperlaneError2)) {
          return;
        }

        throw hyperlaneError2;
      }

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

      await refetchBaseBalance();
      const baseBaselineBalance = baseBalance?.value || 0n;
      const baseExpectedIncrease = toNano(parseFloat(amount));

      let basePollCount = 0;
      const basePollPromise = new Promise<void>((resolve, reject) => {
        const interval = setInterval(() => {
          void (async () => {
            basePollCount++;
            const baseRefetchResult = await refetchBaseBalance();
            if (baseRefetchResult.status === "error") {
              return;
            }
            const currentBaseBalance = baseRefetchResult.data?.value || 0n;

            if (
              currentBaseBalance >=
              baseBaselineBalance + baseExpectedIncrease
            ) {
              clearInterval(interval);
              resolve();
            } else if (basePollCount >= POLLING_CONFIG.MAX_POLLS) {
              clearInterval(interval);
              reject(new Error("Confirmation timeout - no balance increase"));
            }
          })();
        }, POLLING_CONFIG.INTERVAL_MS);
      });

      try {
        await basePollPromise;
      } catch (basePollError) {
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
      const txHash2 =
        typeof hyperlaneResult2 === "object" && "hash" in hyperlaneResult2
          ? (hyperlaneResult2 as { hash: string }).hash
          : undefined;

      addTransaction({
        step: 2,
        status: "SUCCESS" as const,
        chainName: "Torus EVM",
        message: "Transfer complete",
        txHash: txHash2,
        explorerUrl: txHash2 ? getExplorerUrl(txHash2, "Torus EVM") : undefined,
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
      chain?.id,
      getExplorerUrl,
      torusEvmChainId,
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
      if (chain.id !== torusEvmChainId) {
        switchChain({ chainId: torusEvmChainId });
      }

      await refetchNativeEthBalance();
      if ((nativeEthBalance?.value ?? 0n) < GAS_CONFIG.ESTIMATED_TOTAL) {
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
        const errorMessage = isUserRejectionError(withdrawError)
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

        if (isUserRejectionError(withdrawError)) {
          return;
        }

        throw withdrawError;
      }

      updateBridgeState({ step: SimpleBridgeStep.STEP_2_CONFIRMING });

      // Wait for transaction receipt
      const [receiptError] = await tryAsync(
        waitForTransactionReceipt(wagmiConfig, {
          hash: txHash,
          confirmations: CONFIRMATION_CONFIG.REQUIRED_CONFIRMATIONS,
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
      wagmiConfig,
      updateBridgeState,
      addTransaction,
      getExplorerUrl,
      toast,
      torusEvmChainId,
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
        const errorMessage = isUserRejectionError(hyperlaneError)
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

        if (isUserRejectionError(hyperlaneError)) {
          return;
        }

        throw hyperlaneError;
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
    ],
  );

  const retrySwitchOnly = useCallback(
    async (direction: SimpleBridgeDirection | null, amount: string) => {
      if (direction === null || !amount) return;
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

      let switchAttempts = 0;
      let switchSucceeded = false;
      while (
        switchAttempts < POLLING_CONFIG.MAX_SWITCH_ATTEMPTS &&
        !switchSucceeded
      ) {
        try {
          if (chain?.id !== torusEvmChainId) {
            switchChain({ chainId: torusEvmChainId });
            await new Promise((resolve) =>
              setTimeout(resolve, POLLING_CONFIG.SWITCH_RETRY_DELAY_MS),
            );
          }
          if (chain?.id === torusEvmChainId) {
            switchSucceeded = true;
          } else {
            throw new Error("Switch verification failed");
          }
        } catch (switchError: unknown) {
          switchAttempts++;
          if (switchAttempts >= POLLING_CONFIG.MAX_SWITCH_ATTEMPTS) {
            if (!(switchError instanceof Error)) {
              throw switchError;
            }

            const finalErrorMessage = isUserRejectionError(switchError)
              ? "Switch retry rejected – please accept in wallet"
              : "Switch retry failed – network issue";

            addTransaction({
              step: 2,
              status: "ERROR" as const,
              chainName: "Torus EVM",
              message: finalErrorMessage,
              txHash: undefined,
              explorerUrl: undefined,
              metadata: { type: "switch" },
            });
            updateBridgeState({
              step: SimpleBridgeStep.ERROR,
              errorMessage: finalErrorMessage,
            });
            return;
          }
          await new Promise((resolve) =>
            setTimeout(resolve, POLLING_CONFIG.SWITCH_RETRY_DELAY_MS),
          );
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

      await refetchNativeEthBalance();
      const currentNativeBalance = nativeEthBalance?.value ?? 0n;
      if (currentNativeBalance < GAS_CONFIG.ESTIMATED_TOTAL) {
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
          if (!walletClient || !chain || !selectedAccount) {
            throw new Error("Missing required wallet data");
          }
          const [withdrawError, txHash] = await tryAsync(
            withdrawFromTorusEvm(
              walletClient,
              chain,
              selectedAccount.address as SS58Address,
              toNano(parseFloat(amount)),
              async () => {
                await refetchTorusEvmBalance();
              },
            ),
          );
          if (withdrawError !== undefined) {
            const errorMessage = isUserRejectionError(withdrawError)
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
          updateBridgeState({ step: SimpleBridgeStep.STEP_2_CONFIRMING });

          // Wait for transaction receipt
          const [receiptError] = await tryAsync(
            waitForTransactionReceipt(wagmiConfig, {
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
        } else {
          // Hyperlane from Torus EVM
          updateBridgeState({ step: SimpleBridgeStep.STEP_2_SIGNING });
          if (!evmAddress) {
            throw new Error("EVM address not available");
          }
          const [hyperlaneError, _hyperlaneResult] = await tryAsync(
            triggerHyperlaneTransfer({
              origin: "torus",
              destination: "base",
              tokenIndex: 1,
              amount,
              recipient: evmAddress,
            }),
          );
          if (hyperlaneError !== undefined) {
            const errorMessage = isUserRejectionError(hyperlaneError)
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
          updateBridgeState({ step: SimpleBridgeStep.STEP_2_CONFIRMING });
          addTransaction({
            step: 2,
            status: "CONFIRMING" as const,
            chainName: "Torus EVM",
            message: "Waiting for confirmation...",
            txHash: undefined,
            explorerUrl: undefined,
          });

          await refetchBaseBalance();
          const baseBaselineBalance = baseBalance?.value || 0n;
          const baseExpectedIncrease = toNano(parseFloat(amount));

          let basePollCount = 0;
          const basePollPromise = new Promise<void>((resolve, reject) => {
            const interval = setInterval(() => {
              void (async () => {
                basePollCount++;
                const baseRefetchResult = await refetchBaseBalance();
                if (baseRefetchResult.status === "error") {
                  return;
                }
                const currentBaseBalance = baseRefetchResult.data?.value || 0n;

                if (
                  currentBaseBalance >=
                  baseBaselineBalance + baseExpectedIncrease
                ) {
                  clearInterval(interval);
                  resolve();
                } else if (basePollCount >= POLLING_CONFIG.MAX_POLLS) {
                  clearInterval(interval);
                  reject(
                    new Error("Confirmation timeout - no balance increase"),
                  );
                }
              })();
            }, POLLING_CONFIG.INTERVAL_MS);
          });

          try {
            await basePollPromise;
          } catch (basePollError) {
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
      switchChain,
      torusEvmChainId,
      chain,
      refetchNativeEthBalance,
      nativeEthBalance,
      walletClient,
      selectedAccount,
      refetchTorusEvmBalance,
      triggerHyperlaneTransfer,
      evmAddress,
      baseBalance,
      refetchBaseBalance,
      getExplorerUrl,
      addTransaction,
      wagmiConfig,
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
      } else {
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
