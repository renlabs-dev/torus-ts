import {
  waitForTransactionReceipt,
  withdrawFromTorusEvm,
} from "@torus-network/sdk/evm";
import type { SS58Address } from "@torus-network/sdk/types";
import { toNano } from "@torus-network/torus-utils/torus/token";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import type { Chain, WalletClient } from "viem";
import type { Config } from "wagmi";
import type { SimpleBridgeTransaction } from "../_components/simple-bridge-types";
import { SimpleBridgeStep } from "../_components/simple-bridge-types";
import {
  switchChainWithRetry,
  throwOnChainSwitchFailure,
} from "./simple-bridge-chain-switch";
import {
  BASE_CHAIN_ID,
  CONFIRMATION_CONFIG,
  formatErrorForUser,
  isUserRejectionError,
  UserRejectedError,
} from "./simple-bridge-helpers";
import { pollEvmBalance } from "./simple-bridge-polling";

/**
 * Parameters for executing Step 1 of the Base-to-Native bridge flow.
 *
 * This interface defines all the required parameters for the Base to Torus EVM
 * transfer process, including wallet switching, cross-chain transfer initiation,
 * and balance monitoring for the first phase of bridging.
 */
interface BaseToNativeStep1Params {
  /** Amount of TORUS tokens to transfer in string format */
  amount: string;
  /** Target EVM address in hex format (0x...) for transfer recipient */
  evmAddress: string;
  /** Current blockchain configuration */
  chain: Chain;
  /** Function to switch wallet to target chain, returns the new chain ID */
  switchChain: (params: { chainId: number }) => Promise<{ id: number }>;
  /** Function to initiate Hyperlane cross-chain transfer with origin/destination routing */
  triggerHyperlaneTransfer: (params: {
    origin: string;
    destination: string;
    tokenIndex: number;
    amount: string;
    recipient: string;
  }) => Promise<unknown>;
  /** Warp Core configuration for token connections and routing */
  warpCore: {
    tokens: {
      chainName: string;
      symbol: string;
      getConnectionForChain: (chain: string) => unknown;
    }[];
  };
  /** Function to refetch Torus EVM balance from the network */
  refetchTorusEvmBalance: () => Promise<{
    status: string;
    data?: { value: bigint };
  }>;
  /** Optional current Torus EVM balance with value as bigint, undefined if not loaded */
  torusEvmBalance?: { value: bigint };
  /** Function to update the bridge UI state */
  updateBridgeState: (updates: {
    step: SimpleBridgeStep;
    errorMessage?: string;
  }) => void;
  /** Function to add transaction entries to the UI */
  addTransaction: (tx: SimpleBridgeTransaction) => void;
  /** Function to generate blockchain explorer URLs for transaction hashes */
  getExplorerUrl: (txHash: string, chainName: string) => string;
}

/**
 * Validates warp configuration and returns Base token connection.
 *
 * @param warpCore - Warp Core configuration to validate
 * @throws {Error} If Base TORUS token or connection to Torus is not found
 */
function validateWarpConfiguration(warpCore: BaseToNativeStep1Params["warpCore"]) {
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

  return { baseToken, connection };
}

/**
 * Executes Step 1 of the Base-to-Native bridge flow.
 *
 * Orchestrates the Base → Torus EVM transfer:
 * 1. Validates warp configuration
 * 2. Switches to Base chain with retries
 * 3. Initiates Hyperlane cross-chain transfer
 * 4. Polls Torus EVM balance for confirmation
 * 5. Returns to Base chain for cleanup
 *
 * @param params - Step 1 execution parameters
 * @throws {UserRejectedError} If user rejects chain switch or transaction
 * @throws {Error} On switch failure, transfer failure, confirmation timeout, or configuration errors
 */
export async function executeBaseToNativeStep1(
  params: BaseToNativeStep1Params,
) {
  const {
    amount,
    evmAddress,
    chain,
    switchChain,
    triggerHyperlaneTransfer,
    warpCore,
    refetchTorusEvmBalance,
    torusEvmBalance,
    updateBridgeState,
    addTransaction,
    getExplorerUrl,
  } = params;

  updateBridgeState({ step: SimpleBridgeStep.STEP_1_PREPARING });
  addTransaction({
    step: 1,
    status: "STARTING",
    chainName: "Base",
    message: "Preparing Base → Torus EVM transfer",
  });

  validateWarpConfiguration(warpCore);

  console.log(
    "Step 1 - Current chain:",
    chain.id,
    "Target: Base (",
    BASE_CHAIN_ID,
    ")",
  );

  const switchResult = await switchChainWithRetry({
    targetChainId: BASE_CHAIN_ID,
    switchChain,
    getCurrentChainId: () => Promise.resolve(chain.id),
    chainName: "Base",
  });

  if (!switchResult.success) {
    addTransaction({
      step: 1,
      status: "ERROR",
      chainName: "Base",
      message: switchResult.errorMessage ?? "Failed to switch to Base chain",
      errorDetails: switchResult.errorDetails,
    });
    updateBridgeState({
      step: SimpleBridgeStep.ERROR,
      errorMessage: switchResult.errorMessage ?? "Failed to switch to Base chain",
    });
    throwOnChainSwitchFailure(switchResult);
  }

  console.log("Confirmed on Base chain, proceeding to sign transaction");

  updateBridgeState({ step: SimpleBridgeStep.STEP_1_SIGNING });
  addTransaction({
    step: 1,
    status: "SIGNING",
    chainName: "Base",
    message: "Signing transaction...",
  });

  const [hyperlaneError, step1TxHash] = await tryAsync(
    triggerHyperlaneTransfer({
      origin: "base",
      destination: "torus",
      tokenIndex: 0,
      amount,
      recipient: evmAddress,
    }),
  );

  if (hyperlaneError !== undefined) {
    const isUserRejected = isUserRejectionError(hyperlaneError);
    const errorMessage = isUserRejected
      ? "Transaction rejected by user"
      : "Failed to execute Base → Torus EVM transfer";
    const errorDetails = formatErrorForUser(hyperlaneError);

    addTransaction({
      step: 1,
      status: "ERROR",
      chainName: "Base",
      message: errorMessage,
      errorDetails,
      txHash: undefined,
      explorerUrl: undefined,
    });

    updateBridgeState({
      step: SimpleBridgeStep.ERROR,
      errorMessage,
    });

    if (isUserRejected) {
      throw new UserRejectedError(errorMessage);
    }

    throw hyperlaneError;
  }

  updateBridgeState({ step: SimpleBridgeStep.STEP_1_CONFIRMING });

  await refetchTorusEvmBalance();
  const baselineBalance = torusEvmBalance?.value ?? 0n;
  const expectedIncrease = toNano(amount.trim());

  const pollingResult = await pollEvmBalance(
    refetchTorusEvmBalance,
    baselineBalance,
    expectedIncrease,
    "Base → Torus EVM",
  );

  if (!pollingResult.success) {
    addTransaction({
      step: 1,
      status: "ERROR",
      chainName: "Base",
      message: pollingResult.errorMessage ?? "Transfer confirmation failed",
      txHash: undefined,
      explorerUrl: undefined,
    });
    updateBridgeState({
      step: SimpleBridgeStep.ERROR,
      errorMessage: pollingResult.errorMessage ?? "Transfer confirmation failed",
    });
    throw new Error(pollingResult.errorMessage ?? "Transfer confirmation failed");
  }

  updateBridgeState({ step: SimpleBridgeStep.STEP_1_COMPLETE });
  addTransaction({
    step: 1,
    status: "SUCCESS",
    chainName: "Base",
    message: "Transfer complete",
    txHash: step1TxHash as string | undefined,
    explorerUrl:
      step1TxHash !== undefined
        ? getExplorerUrl(step1TxHash as string, "Base")
        : undefined,
  });

  const [returnError] = await tryAsync(switchChain({ chainId: BASE_CHAIN_ID }));
  if (returnError !== undefined) {
    console.warn("Auto-return to Base failed:", returnError.message);
  }
}

/**
 * Parameters for executing Step 2 of the Base-to-Native bridge flow.
 *
 * This interface defines all the required parameters for the Torus EVM to Native
 * withdrawal process, including wallet connections, balance management, and UI state updates.
 */
interface BaseToNativeStep2Params {
  /** Amount of TORUS tokens to withdraw in string format */
  amount: string;
  /** Currently selected Substrate account with SS58 address */
  selectedAccount: { address: SS58Address };
  /** Wallet client for EVM operations and chain management */
  walletClient: WalletClient;
  /** Current blockchain configuration */
  chain: Chain;
  /** Chain ID for the Torus EVM network */
  torusEvmChainId: number;
  /** Function to switch to a different EVM chain, returns the new chain ID */
  switchChain: (params: { chainId: number }) => Promise<{ id: number }>;
  /** Function to refetch Torus EVM balance from the network */
  refetchTorusEvmBalance: () => Promise<{
    status: string;
    data?: { value: bigint };
  }>;
  /** Function to refetch Native balance from the network */
  refetchNativeBalance: () => Promise<{
    status: string;
    data?: { value: bigint };
  }>;
  /** Optional current Native balance with value as bigint, undefined if not loaded */
  nativeBalance?: { value: bigint };
  /** WAGMI configuration for wallet operations */
  wagmiConfig: Config;
  /** Function to update the bridge UI state */
  updateBridgeState: (updates: {
    step: SimpleBridgeStep;
    errorMessage?: string;
  }) => void;
  /** Function to add transaction entries to the UI */
  addTransaction: (tx: SimpleBridgeTransaction) => void;
  /** Function to generate blockchain explorer URLs for transaction hashes */
  getExplorerUrl: (txHash: string, chainName: string) => string;
}

/**
 * Executes Step 2 of the Base-to-Native bridge flow.
 *
 * Orchestrates the Torus EVM → Native withdrawal:
 * 1. Optionally switches to Torus EVM chain with verification
 * 2. Initiates withdrawal transaction to Native
 * 3. Waits for transaction receipt
 * 4. Polls Native balance for confirmation
 *
 * @param params - Step 2 execution parameters
 * @throws {UserRejectedError} If user rejects chain switch or transaction
 * @throws {Error} On switch failure, withdrawal failure, or confirmation timeout
 */
export async function executeBaseToNativeStep2(
  params: BaseToNativeStep2Params,
) {
  const {
    amount,
    selectedAccount,
    walletClient,
    torusEvmChainId,
    switchChain,
    refetchTorusEvmBalance,
    refetchNativeBalance,
    nativeBalance,
    wagmiConfig,
    updateBridgeState,
    addTransaction,
    getExplorerUrl,
  } = params;

  const amountRems = toNano(amount.trim());

  updateBridgeState({ step: SimpleBridgeStep.STEP_2_PREPARING });
  addTransaction({
    step: 2,
    status: "STARTING",
    chainName: "Torus EVM",
    message: "Preparing Torus EVM → Native withdrawal",
  });

  const actualChainId = await walletClient.getChainId();
  console.log(
    "Step 2 - Actual wallet chain:",
    actualChainId,
    "Target: Torus EVM (",
    torusEvmChainId,
    ")",
  );

  if (actualChainId !== torusEvmChainId) {
    updateBridgeState({ step: SimpleBridgeStep.STEP_2_SWITCHING });
    addTransaction({
      step: 2,
      status: "STARTING",
      chainName: "Torus EVM",
      message: "Switching to Torus EVM chain...",
      metadata: { type: "switch" },
    });

    const switchResult = await switchChainWithRetry({
      targetChainId: torusEvmChainId,
      switchChain,
      getCurrentChainId: () => walletClient.getChainId(),
      chainName: "Torus EVM",
    });

    if (!switchResult.success) {
      addTransaction({
        step: 2,
        status: "ERROR",
        chainName: "Torus EVM",
        message: switchResult.errorMessage ?? "Failed to switch to Torus EVM",
        errorDetails: switchResult.errorDetails,
        txHash: undefined,
        explorerUrl: undefined,
        metadata: { type: "switch" },
      });
      updateBridgeState({
        step: SimpleBridgeStep.ERROR,
        errorMessage: switchResult.errorMessage ?? "Failed to switch to Torus EVM",
      });
      throwOnChainSwitchFailure(switchResult);
    }

    console.log("Confirmed on Torus EVM chain, proceeding to withdrawal");
    addTransaction({
      step: 2,
      status: "SUCCESS",
      chainName: "Torus EVM",
      message: "Successfully switched to Torus EVM",
      metadata: { type: "switch" },
    });
  }

  updateBridgeState({ step: SimpleBridgeStep.STEP_2_SIGNING });

  const torusEvmChain = wagmiConfig.chains.find((c) => c.id === torusEvmChainId);
  if (!torusEvmChain) {
    throw new Error(`Torus EVM chain ${torusEvmChainId} not found in config`);
  }

  const [withdrawError, txHash] = await tryAsync(
    withdrawFromTorusEvm(
      walletClient,
      torusEvmChain,
      selectedAccount.address,
      amountRems,
      async () => {
        await refetchTorusEvmBalance();
      },
    ),
  );

  if (withdrawError !== undefined) {
    const isUserRejected = isUserRejectionError(withdrawError);
    const errorMessage = isUserRejected
      ? "Withdrawal transaction rejected by user"
      : "Failed to withdraw from Torus EVM";
    const errorDetails = formatErrorForUser(withdrawError);

    addTransaction({
      step: 2,
      status: "ERROR",
      chainName: "Torus EVM",
      message: errorMessage,
      errorDetails,
      txHash: undefined,
      explorerUrl: undefined,
    });

    updateBridgeState({
      step: SimpleBridgeStep.ERROR,
      errorMessage,
    });

    if (isUserRejected) {
      throw new UserRejectedError(errorMessage);
    }

    throw withdrawError;
  }

  updateBridgeState({ step: SimpleBridgeStep.STEP_2_CONFIRMING });

  const [receiptError] = await tryAsync(
    waitForTransactionReceipt(wagmiConfig, {
      hash: txHash,
      confirmations: CONFIRMATION_CONFIG.REQUIRED_CONFIRMATIONS,
    }),
  );

  if (receiptError !== undefined) {
    console.warn("Failed to get transaction receipt:", receiptError.message);
  }

  await refetchNativeBalance();
  const baselineNativeBalance = nativeBalance?.value ?? 0n;
  const expectedNativeIncrease = toNano(amount.trim());

  console.log(
    `Polling Native balance - Baseline: ${Number(baselineNativeBalance) / 1e18} TORUS, Expected increase: ${parseFloat(amount)} TORUS`,
  );

  const pollingResult = await pollEvmBalance(
    refetchNativeBalance,
    baselineNativeBalance,
    expectedNativeIncrease,
    "Torus Native",
  );

  if (!pollingResult.success) {
    const explorerUrl = getExplorerUrl(txHash, "Torus Native");
    addTransaction({
      step: 2,
      status: "ERROR",
      chainName: "Torus Native",
      message: pollingResult.errorMessage ?? "Withdrawal confirmation failed",
      txHash,
      explorerUrl: explorerUrl || undefined,
    });
    updateBridgeState({
      step: SimpleBridgeStep.ERROR,
      errorMessage: pollingResult.errorMessage ?? "Withdrawal confirmation failed",
    });
    throw new Error(pollingResult.errorMessage ?? "Withdrawal confirmation failed");
  }

  addTransaction({
    step: 2,
    status: "SUCCESS",
    chainName: "Torus Native",
    message: "Withdrawal complete",
    txHash,
    explorerUrl: getExplorerUrl(txHash, "Torus Native"),
  });

  updateBridgeState({ step: SimpleBridgeStep.COMPLETE });
}
