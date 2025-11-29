import type { WarpCore } from "@hyperlane-xyz/sdk";
import type { ProtocolType } from "@hyperlane-xyz/utils";
import { toWei } from "@hyperlane-xyz/utils";
import type { AccountInfo } from "@hyperlane-xyz/widgets";
import { getAccountAddressAndPubKey } from "@hyperlane-xyz/widgets";
import type { ApiPromise } from "@polkadot/api";
import { transferAllowDeath } from "@torus-network/sdk/chain";
import { convertH160ToSS58 } from "@torus-network/sdk/evm";
import type { SS58Address } from "@torus-network/sdk/types";
import { toNano } from "@torus-network/torus-utils/torus/token";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";
import { getTokenByIndex } from "~/hooks/token";
import type { SimpleBridgeTransaction } from "../_components/fast-bridge-types";
import { SimpleBridgeStep } from "../_components/fast-bridge-types";
import {
  switchChainWithRetry,
  throwOnChainSwitchFailure,
} from "./fast-bridge-chain-switch";
import {
  formatErrorForUser,
  isUserRejectionError,
  TIMEOUT_CONFIG,
  UserRejectedError,
  withTimeout,
} from "./fast-bridge-helpers";
import { pollEvmBalance } from "./fast-bridge-polling";

/**
 * Parameters for executing Step 1 of the Native-to-Base bridge flow.
 *
 * This interface defines all the required parameters for the Native TORUS to Torus EVM
 * transfer process, including wallet connections, balance management, and UI state updates.
 */
interface NativeToBaseStep1Params {
  /** Amount of TORUS tokens to transfer from Native to Torus EVM as string */
  amount: string;
  /** Target EVM address in hex format (0x...) for the transfer destination */
  evmAddress: string;
  /** Currently selected Substrate account with SS58 address for signing */
  selectedAccount: { address: SS58Address };
  /** Polkadot.js API instance for Substrate blockchain interactions */
  api: ApiPromise;
  /** Function to send Substrate transactions with event tracking capabilities */
  sendTx: (tx: ReturnType<typeof transferAllowDeath>) => Promise<
    | [
        undefined,
        {
          tracker: {
            on: (event: string, callback: (data?: unknown) => void) => unknown;
            off: (event: string, callback: (data?: unknown) => void) => unknown;
          };
        },
      ]
    | [Error, undefined]
  >;
  /** Function to refetch Torus EVM balance from the network, returns status and optional balance data */
  refetchTorusEvmBalance: () => Promise<{
    status: string;
    data?: { value: bigint };
  }>;
  /** Optional current Torus EVM balance with value as bigint, undefined if not loaded */
  torusEvmBalance?: { value: bigint };
  /** Function to refetch Native balance from the network, returns status and optional balance data */
  refetchNativeBalance: () => Promise<{
    status: string;
    data?: { value: bigint };
  }>;
  /** Function to update the bridge UI state with step progress and error messages */
  updateBridgeState: (updates: {
    step: SimpleBridgeStep;
    errorMessage?: string;
  }) => void;
  /** Function to add transaction entries to the UI for tracking progress */
  addTransaction: (tx: SimpleBridgeTransaction) => void;
  /** Function to generate blockchain explorer URLs */
  getExplorerUrl: (txHash: string, chainName: string) => string;
}

/**
 * Tracks Substrate transaction finalization and Torus EVM balance confirmation.
 *
 * Uses promise-based approach with event listeners for finalized/error events.
 * Polls Torus EVM balance after finalization to confirm tokens arrived.
 *
 * @param tracker - Event tracker from Substrate transaction
 * @param refetchTorusEvmBalance - Function to refetch Torus EVM balance
 * @param refetchNativeBalance - Function to refetch Native balance
 * @param baselineBalance - Starting balance before transfer
 * @param expectedIncrease - Expected balance increase
 * @param updateBridgeState - UI state update function
 * @param addTransaction - Transaction tracking function
 */
async function trackSubstrateTransaction(
  tracker: {
    on: (event: string, callback: (data?: unknown) => void) => unknown;
    off: (event: string, callback: (data?: unknown) => void) => unknown;
  },
  refetchTorusEvmBalance: () => Promise<{
    status: string;
    data?: { value: bigint };
  }>,
  refetchNativeBalance: () => Promise<{
    status: string;
    data?: { value: bigint };
  }>,
  baselineBalance: bigint,
  expectedIncrease: bigint,
  amount: string,
  updateBridgeState: (updates: {
    step: SimpleBridgeStep;
    errorMessage?: string;
  }) => void,
  addTransaction: (tx: SimpleBridgeTransaction) => void,
  getExplorerUrl: (txHash: string, chainName: string) => string,
): Promise<void> {
  const abortController = new AbortController();
  let capturedTxHash: string | undefined;

  const trackerPromise = new Promise<void>((resolve, reject) => {
    const handleFinalized = async () => {
      if (abortController.signal.aborted) {
        return;
      }

      tracker.off("finalized", onFinalized);
      tracker.off("error", onError);

      const pollingResult = await pollEvmBalance(
        refetchTorusEvmBalance,
        baselineBalance,
        expectedIncrease,
        "Torus EVM (after Native transfer)",
      );

      if (!pollingResult.success) {
        const errorMessage =
          pollingResult.errorMessage ??
          "Bridge confirmation timeout - tokens may not have arrived in Torus EVM";

        updateBridgeState({
          step: SimpleBridgeStep.ERROR,
          errorMessage,
        });
        addTransaction({
          step: 1,
          status: "ERROR",
          chainName: "Torus Native",
          message: errorMessage,
        });
        reject(new Error(errorMessage));
        return;
      }

      // Refetch Native balance to reflect the debit from the transfer
      await refetchNativeBalance();

      updateBridgeState({ step: SimpleBridgeStep.STEP_1_COMPLETE });
      addTransaction({
        step: 1,
        status: "SUCCESS",
        chainName: "Torus Native",
        message: "Bridge complete - tokens arrived in Torus EVM",
        txHash: capturedTxHash,
        explorerUrl: capturedTxHash
          ? getExplorerUrl(capturedTxHash, "Torus EVM")
          : undefined,
      });
      resolve();
    };

    const handleError = (error: unknown) => {
      if (abortController.signal.aborted) {
        return;
      }

      tracker.off("finalized", onFinalized);
      tracker.off("error", onError);

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
    };

    // Capture txHash from early events
    const handleTxHash = (data?: unknown) => {
      if (data && typeof data === "object" && "txHash" in data) {
        const hash = (data as { txHash?: string }).txHash;
        if (hash && !capturedTxHash) {
          capturedTxHash = hash;
        }
      }
    };

    const onFinalized = (data?: unknown) => {
      handleTxHash(data);
      void handleFinalized();
    };
    const onError = (error: unknown) => void handleError(error);
    const onSubmitted = (data?: unknown) => handleTxHash(data);
    const onInBlock = (data?: unknown) => handleTxHash(data);

    tracker.on("finalized", onFinalized);
    tracker.on("error", onError);
    tracker.on("submitted", onSubmitted);
    tracker.on("inBlock", onInBlock);
  });

  const [timeoutError] = await tryAsync(
    withTimeout(
      trackerPromise,
      TIMEOUT_CONFIG.DEFAULT_OPERATION_MS,
      "Native bridge transaction timeout",
    ),
  );

  abortController.abort();

  if (timeoutError !== undefined) {
    const errorMessage = timeoutError.message.includes("timeout")
      ? "Native bridge transaction timeout - please retry"
      : "Native bridge transaction failed";

    updateBridgeState({
      step: SimpleBridgeStep.ERROR,
      errorMessage,
    });
    addTransaction({
      step: 1,
      status: "ERROR",
      chainName: "Torus Native",
      message: errorMessage,
    });
    throw timeoutError;
  }
}

/**
 * Executes Step 1 of the Native-to-Base bridge flow.
 *
 * Orchestrates Native TORUS → Torus EVM transfer including Substrate transaction,
 * finalization tracking, and Torus EVM balance polling for confirmation.
 *
 * @param params - Step 1 execution parameters
 * @throws {UserRejectedError} If user rejects the Substrate transaction
 * @throws {Error} On transaction failure, network errors, or confirmation timeout
 */
export async function executeNativeToBaseStep1(
  params: NativeToBaseStep1Params,
) {
  const {
    amount,
    evmAddress,
    api,
    sendTx,
    refetchTorusEvmBalance,
    refetchNativeBalance,
    updateBridgeState,
    addTransaction,
    getExplorerUrl,
  } = params;

  const amountRems = toNano(amount.trim());
  const evmSS58Addr = convertH160ToSS58(evmAddress);

  updateBridgeState({ step: SimpleBridgeStep.STEP_1_PREPARING });
  addTransaction({
    step: 1,
    status: "STARTING",
    chainName: "Torus Native",
    message: "Preparing Native → Torus EVM bridge",
  });

  // Capture baseline balance BEFORE sending transaction
  const refetchResult = await refetchTorusEvmBalance();
  const baselineBalance = refetchResult.data?.value ?? 0n;
  const expectedIncrease = toNano(amount.trim());

  updateBridgeState({ step: SimpleBridgeStep.STEP_1_SIGNING });

  const [sendErr, sendRes] = await sendTx(
    transferAllowDeath(api, evmSS58Addr, amountRems),
  );

  if (sendErr !== undefined) {
    const errorMessage = isUserRejectionError(sendErr)
      ? "Transaction rejected by user"
      : "Failed to bridge from Native to Torus EVM";
    const errorDetails = formatErrorForUser(sendErr);

    addTransaction({
      step: 1,
      status: "ERROR",
      chainName: "Torus Native",
      message: errorMessage,
      errorDetails,
      txHash: undefined,
      explorerUrl: undefined,
    });

    updateBridgeState({
      step: SimpleBridgeStep.ERROR,
      errorMessage,
    });

    if (isUserRejectionError(sendErr)) {
      throw new UserRejectedError(errorMessage);
    }

    throw sendErr;
  }

  const { tracker } = sendRes;

  updateBridgeState({ step: SimpleBridgeStep.STEP_1_CONFIRMING });

  await trackSubstrateTransaction(
    tracker,
    refetchTorusEvmBalance,
    refetchNativeBalance,
    baselineBalance,
    expectedIncrease,
    amount,
    updateBridgeState,
    addTransaction,
    getExplorerUrl,
  );
}

/**
 * Parameters for executing Step 2 of the Native-to-Base bridge flow.
 *
 * This interface defines all the required parameters for the Torus EVM to Base
 * transfer process, including chain switching, balance management, and UI state updates.
 */
interface NativeToBaseStep2Params {
  /** Amount of TORUS tokens to transfer as string */
  amount: string;
  /** Target EVM address in hex format (0x...) */
  evmAddress: string;
  /** Target Torus EVM chain ID for switching */
  torusEvmChainId: number;
  /** Optional current chain ID from reactive state */
  chainId?: number;
  /** Wallet client for querying current chain */
  walletClient: { getChainId: () => Promise<number> };
  /** Function to switch wallet to target chain */
  switchChain: (params: { chainId: number }) => Promise<{ id: number }>;
  /** Function to trigger Hyperlane cross-chain transfer and return transaction hash */
  triggerHyperlaneTransfer: (params: {
    origin: string;
    destination: string;
    tokenIndex: number;
    amount: string;
    recipient: string;
  }) => Promise<string>;
  /** WarpCore instance for Hyperlane operations */
  warpCore: WarpCore;
  /** Connected accounts for multi-protocol operations */
  accounts: Record<ProtocolType, AccountInfo>;
  /** Function to refetch Base balance from the network, returns status and optional balance data */
  refetchBaseBalance: () => Promise<{
    status: string;
    data?: { value: bigint };
  }>;
  /** Optional current Base balance */
  baseBalance?: { value: bigint };
  /** Function to refetch Torus EVM balance from the network */
  refetchTorusEvmBalance: () => Promise<{
    status: string;
    data?: { value: bigint };
  }>;
  /** Function to update bridge UI state */
  updateBridgeState: (updates: {
    step: SimpleBridgeStep;
    errorMessage?: string;
  }) => void;
  /** Function to add transaction entries to UI */
  addTransaction: (tx: SimpleBridgeTransaction) => void;
  /** Function to generate blockchain explorer URLs */
  getExplorerUrl: (txHash: string, chainName: string) => string;
  /** Optional callback for step progress updates (for history tracking) */
  onStepProgress?: (step: SimpleBridgeStep) => void;
}

/**
 * Executes Step 2 of the Native-to-Base bridge flow.
 *
 * Orchestrates Torus EVM → Base transfer including chain switch, Hyperlane transfer,
 * and Base balance polling for confirmation.
 *
 * @param params - Step 2 execution parameters
 * @throws {UserRejectedError} If user rejects chain switch or transaction
 * @throws {Error} On switch failure, transfer failure, or confirmation timeout
 */
export async function executeNativeToBaseStep2(
  params: NativeToBaseStep2Params,
) {
  const {
    amount,
    evmAddress,
    torusEvmChainId,
    walletClient,
    switchChain,
    triggerHyperlaneTransfer,
    warpCore,
    accounts,
    refetchBaseBalance,
    refetchTorusEvmBalance,
    updateBridgeState,
    addTransaction,
    getExplorerUrl,
    onStepProgress,
  } = params;

  // Get the correct token index for the Torus chain dynamically
  const torusTokenIndex = warpCore.tokens.findIndex(
    (t) => t.chainName === "torus" && t.symbol === "TORUS",
  );
  if (torusTokenIndex < 0) {
    throw new Error("Torus token not found in warp configuration");
  }

  updateBridgeState({ step: SimpleBridgeStep.STEP_2_PREPARING });
  onStepProgress?.(SimpleBridgeStep.STEP_2_PREPARING);
  addTransaction({
    step: 2,
    status: "STARTING",
    chainName: "Torus EVM",
    message: "Preparing Torus EVM → Base transfer",
  });

  const actualChainId = await walletClient.getChainId();

  if (actualChainId !== torusEvmChainId) {
    updateBridgeState({ step: SimpleBridgeStep.STEP_2_SWITCHING });
    onStepProgress?.(SimpleBridgeStep.STEP_2_SWITCHING);
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
        errorMessage:
          switchResult.errorMessage ?? "Failed to switch to Torus EVM",
      });
      throwOnChainSwitchFailure(switchResult);
    }

    addTransaction({
      step: 2,
      status: "SUCCESS",
      chainName: "Torus EVM",
      message: "Successfully switched to Torus EVM",
      metadata: { type: "switch" },
    });
  }

  updateBridgeState({ step: SimpleBridgeStep.STEP_2_SIGNING });
  onStepProgress?.(SimpleBridgeStep.STEP_2_SIGNING);
  addTransaction({
    step: 2,
    status: "SIGNING",
    chainName: "Torus EVM",
    message: "Signing transaction...",
  });

  // Get the Torus token to create TokenAmount
  const [tokenError, torusToken] = trySync(() =>
    getTokenByIndex(warpCore, torusTokenIndex),
  );
  if (tokenError || !torusToken) {
    throw new Error("Failed to get Torus token from warp configuration");
  }

  // Convert the user's requested amount to wei
  const [amountWeiError, amountWei] = trySync(() =>
    toWei(amount.trim(), torusToken.decimals),
  );
  if (amountWeiError) {
    throw new Error("Failed to convert amount to wei");
  }

  // Create TokenAmount with the REQUESTED amount (not total balance)
  const requestedTokenAmount = torusToken.amount(amountWei);

  // Get sender address
  const multiProvider = warpCore.multiProvider;
  const [addressError, { address, publicKey } = {}] = trySync(() =>
    getAccountAddressAndPubKey(multiProvider, "torus", accounts),
  );
  if (addressError || !address) {
    throw new Error("Failed to get account address for Torus chain");
  }

  // Get public key (may be async)
  const senderPubKey =
    publicKey instanceof Promise ? await publicKey : publicKey;

  // Calculate maximum transferable amount from the requested amount
  const [maxAmountError, maxTransferAmount] = await tryAsync(
    warpCore.getMaxTransferAmount({
      balance: requestedTokenAmount,
      destination: "base",
      sender: address,
      senderPubKey,
    }),
  );

  if (maxAmountError !== undefined) {
    throw new Error(
      `Failed to calculate max transfer amount: ${maxAmountError.message}`,
    );
  }

  // Convert maxTransferAmount to decimal string
  const maxTransferAmountDecimal = String(
    maxTransferAmount.getDecimalFormattedAmount(),
  );

  // Capture baseline balance BEFORE sending transaction
  const refetchResult = await refetchBaseBalance();
  const baseBaselineBalance = refetchResult.data?.value ?? 0n;

  // Calculate expected increase after fees based on max transfer amount
  const expectedIncreaseAfterFees = toNano(maxTransferAmountDecimal);

  // Use the max transfer amount instead of the original amount
  const [hyperlaneError, txHash2] = await tryAsync(
    triggerHyperlaneTransfer({
      origin: "torus",
      destination: "base",
      tokenIndex: torusTokenIndex,
      amount: maxTransferAmountDecimal,
      recipient: evmAddress,
    }),
  );

  if (hyperlaneError !== undefined) {
    const isUserRejected = isUserRejectionError(hyperlaneError);
    const errorMessage = isUserRejected
      ? "Transaction rejected by user"
      : "Failed to execute Torus EVM → Base transfer";
    const errorDetails = formatErrorForUser(hyperlaneError);

    addTransaction({
      step: 2,
      status: "ERROR",
      chainName: "Torus EVM",
      message: errorMessage,
      errorDetails,
      txHash: undefined,
      explorerUrl: undefined,
      errorPhase: "sign",
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

  updateBridgeState({ step: SimpleBridgeStep.STEP_2_CONFIRMING });
  onStepProgress?.(SimpleBridgeStep.STEP_2_CONFIRMING);

  // Use anyChange mode because Torus EVM fees make the exact amount unpredictable
  const pollingResult = await pollEvmBalance(
    refetchBaseBalance,
    baseBaselineBalance,
    expectedIncreaseAfterFees,
    "Base",
    true, // anyChange = true
  );

  if (!pollingResult.success) {
    addTransaction({
      step: 2,
      status: "ERROR",
      chainName: "Torus EVM",
      message: pollingResult.errorMessage ?? "Transfer confirmation failed",
      txHash: undefined,
      explorerUrl: undefined,
      errorPhase: "confirm",
    });
    updateBridgeState({
      step: SimpleBridgeStep.ERROR,
      errorMessage:
        pollingResult.errorMessage ?? "Transfer confirmation failed",
    });
    throw new Error(
      pollingResult.errorMessage ?? "Transfer confirmation failed",
    );
  }

  // Refetch Torus EVM balance to reflect the debit from the transfer
  await refetchTorusEvmBalance();

  updateBridgeState({ step: SimpleBridgeStep.COMPLETE });
  onStepProgress?.(SimpleBridgeStep.COMPLETE);

  addTransaction({
    step: 2,
    status: "SUCCESS",
    chainName: "Base",
    message: "Transfer complete",
    txHash: txHash2,
    explorerUrl: txHash2 ? getExplorerUrl(txHash2, "Base") : undefined,
  });
}
