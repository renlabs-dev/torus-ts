import { useEffect, useMemo, useState } from "react";

import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { InjectedExtension } from "@polkadot/extension-inject/types";
import type { ISubmittableResult } from "@polkadot/types/types";
import { useThrottle } from "@uidotdev/usehooks";
import type { Enum } from "rustie";
import { if_let, match } from "rustie";

import { queryExtFee } from "@torus-network/sdk/chain";
import type {
  ExtrinsicTracker,
  SbDispatchError,
  TxEvent,
  TxInBlockEvent,
} from "@torus-network/sdk/extrinsics";
import { sendTxWithTracker } from "@torus-network/sdk/extrinsics";
import type { HexH256 } from "@torus-network/sdk/types";
import { chainErr, strErr } from "@torus-network/torus-utils/error";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import type { Result } from "@torus-network/torus-utils/result";
import { makeErr, makeOk } from "@torus-network/torus-utils/result";
import { formatToken } from "@torus-network/torus-utils/torus/token";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

import { toast } from "@torus-ts/ui/hooks/use-toast";

import type { InjectedAccountWithMeta } from "../torus-provider";
import { getMerkleizedMetadata, updateMetadata } from "../utils/chain-metadata";

// ==== Constants ====

const TOAST_MESSAGES = {
  PREPARING: "Signing transaction...",
  READY: "Transaction signed and submitted to pool...",
  BROADCASTING: "Broadcasting transaction to peers...",
  IN_BLOCK: "Transaction included in block...",
  FINALIZING: "Waiting for finalization...",
  SUCCESS: "Transaction completed successfully",
  FAILED: "Transaction failed",
} as const;

/**
 * Generates a Polkadot.js Apps explorer link for viewing a transaction.
 */
export const getExplorerLink = ({
  wsEndpoint,
  hash,
}: {
  wsEndpoint: string;
  hash: string;
}) => `https://polkadot.js.org/apps/?rpc=${wsEndpoint}#/explorer/query/${hash}`;

/**
 * Function type for sending transactions with optional signing parameters.
 */
export type SendTxFn = <T extends ISubmittableResult>(
  tx: SubmittableExtrinsic<"promise", T>,
  options?: Pick<
    Parameters<SubmittableExtrinsic<"promise">["signAndSend"]>[1],
    "nonce" | "tip"
  >,
) => Promise<void>;

/**
 * Output interface for the useSendTransaction hook.
 *
 * Combines transaction state, helper flags, fee information, and the send function.
 */
export interface UseSendTxOutput extends TxHelper {
  txStage: TxStage;
  sendTx: SendTxFn | null;
  fee: bigint | null;
  isFeeLoading: boolean;
  feeError: Error | null;
}

/**
 * Helper interface that provides boolean flags and messages for UI state management.
 *
 * This interface simplifies transaction state management by providing clear boolean
 * flags for each stage of the transaction lifecycle.
 */
export interface TxHelper {
  /** Transaction hash, available once submitted */
  txHash: HexH256 | null;

  /** True when waiting for user signature */
  isSigning: boolean;
  /** True when transaction has been submitted to the network */
  isSubmitted: boolean;
  /** True when transaction is in progress (signing, submitted, or in pool) */
  isPending: boolean;
  /** True when transaction has been included in a block */
  isInBlock: boolean;
  /** True when transaction executed successfully (not just included) */
  isExecuted: boolean;
  /** True when transaction has been finalized */
  isFinalized: boolean;
  /** True when any error occurred */
  isError: boolean;

  /** Human-readable status message */
  message: string;
  /** Error object when isError is true */
  error?: Error;
}
const logger = BasicLogger.create({ name: "use-send-transaction" });

// ==== Fee Estimation Hook ====

/**
 * Hook for estimating transaction fees.
 */
interface UseTxFeeOutput {
  fee: bigint | null;
  isLoading: boolean;
  error: Error | null;
}

export function useTxFee(
  tx: SubmittableExtrinsic<"promise"> | null,
  account: string | null,
  api: ApiPromise | null,
  options?: { enabled?: boolean },
): UseTxFeeOutput {
  const [fee, setFee] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tx || !account || !api || options?.enabled === false) {
      setFee(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const estimateFee = async () => {
      setIsLoading(true);
      setError(null);

      const [queryError, result] = await queryExtFee(tx, account);

      if (queryError !== undefined) {
        setError(queryError);
        setFee(null);
      } else {
        setFee(result.fee);
        setError(null);
      }

      setIsLoading(false);
    };

    void estimateFee();
  }, [tx, account, api, options?.enabled]);

  return { fee, isLoading, error };
}

export type TxStage = Enum<{
  Idle: {
    extrinsic: SubmittableExtrinsic<"promise"> | null;
  };
  Signing: {
    extrinsic: SubmittableExtrinsic<"promise">;
  };
  Submitted: {
    event: TxEvent;
  };
  Error: {
    error: Error;
    txHash?: HexH256;
  };
}>;

/**
 * React hook for sending Substrate/Polkadot transactions with comprehensive state management.
 *
 * Handles the complete transaction lifecycle from signing through finalization,
 * with automatic fee estimation, wallet integration, and user feedback.
 *
 * @param api - Polkadot API instance
 * @param wsEndpoint - WebSocket endpoint for blockchain connection
 * @param selectedAccount - Currently selected wallet account
 * @param web3FromAddress - Function to get wallet injector for an address
 * @param transactionType - Human-readable transaction type for error messages
 * @param estimateTx - Transaction to estimate fees for (can differ from sent transaction)
 */
export function useSendTransaction({
  api,
  wsEndpoint,
  selectedAccount,
  transactionType,
  web3FromAddress,
  estimateTx,
}: {
  api: ApiPromise | null;
  wsEndpoint: string | null;
  selectedAccount: InjectedAccountWithMeta | null;
  web3FromAddress: ((address: string) => Promise<InjectedExtension>) | null;
  transactionType: string;
  estimateTx: SubmittableExtrinsic<"promise"> | null;
  // toast: typeof toast; // TODO: modularize
}): UseSendTxOutput {
  const wallet = useWallet({ api, selectedAccount, web3FromAddress });

  const [txStage, setTxStage] = useState<TxStage>({
    Idle: { extrinsic: null },
  });
  const [sendFn, setSendFn] = useState<{ sendTx: SendTxFn | null }>({
    sendTx: null,
  });

  const setErrState = (
    err: Error,
    {
      showToast = true,
      txHash,
    }: { showToast?: boolean; txHash?: HexH256 } = {},
  ) => {
    logger.warn(err);
    setTxStage({ Error: { error: err, txHash } });
    if (showToast) {
      toast.error(err.message || `Transaction failed: ${String(err)}`);
    }
  };

  useEffect(() => {
    if (!api || !wsEndpoint || !wallet) {
      // logger.warn("API or wallet not ready");
      return;
    }

    const { injector, metadataHash } = wallet;

    const [txOptionsError, baseTxOptions] = trySync(() => ({
      signer: injector.signer,
      tip: 0,
      nonce: -1,
      mode: 1, // mortal
      metadataHash,
      signedExtensions: api.registry.signedExtensions,
      withSignedTransaction: true,
    }));
    if (txOptionsError !== undefined) {
      setErrState(
        chainErr("Failed to create transaction options")(txOptionsError),
      );
      return;
    }

    let currentTracker: ExtrinsicTracker | null = null;
    let currentToastId: string | number;

    const sendTx = async <T extends ISubmittableResult>(
      tx: SubmittableExtrinsic<"promise", T>,
      options: Pick<
        Parameters<SubmittableExtrinsic<"promise">["signAndSend"]>[1],
        "nonce" | "tip"
      > = {},
    ): Promise<void> => {
      if (!selectedAccount) {
        setErrState(strErr("No account selected"));
        return;
      }

      // Cancel any existing tracker
      // TODO: maybe lock sending when transaction is in progress?
      if (currentTracker) {
        currentTracker.cancel();
        currentTracker = null;
      }

      // Clear any previous state and set to signing stage
      setTxStage({ Signing: { extrinsic: tx } });

      currentToastId = toast.loading(TOAST_MESSAGES.PREPARING);

      const txOptions = { ...baseTxOptions, ...options };

      const [sendError, tracker] = await sendTxWithTracker(
        api,
        tx,
        selectedAccount.address,
        txOptions,
      );
      if (sendError !== undefined) {
        setErrState(sendError);
        return;
      }
      currentTracker = tracker;

      // Listen to all status events
      currentTracker.on("status", (event: TxEvent) => {
        setTxStage({ Submitted: { event } });
        handleTxEvent({
          event,
          api,
          setErrState,
          transactionType,
          wsEndpoint,
          toastId: currentToastId,
        });
      });
    };

    setSendFn({ sendTx });

    return () => {
      if (currentTracker) {
        currentTracker.cancel();
      }
    };
  }, [api, wsEndpoint, wallet, selectedAccount, web3FromAddress]);

  // Throttle the estimation transaction to prevent excessive fee queries
  const throttledTx = useThrottle(estimateTx, 1000);

  // Get fee estimation for the throttled extrinsic
  const {
    fee,
    isLoading: isFeeLoading,
    error: feeError,
  } = useTxFee(throttledTx ?? null, selectedAccount?.address ?? null, api);

  const txHelper = useMemo(() => txStageToTxHelper(txStage), [txStage]);

  return {
    txStage,
    ...sendFn,
    ...txHelper,
    fee,
    isFeeLoading,
    feeError,
  };
}

const setupWallet = async ({
  api,
  selectedAccount,
  web3FromAddress,
}: {
  api: ApiPromise;
  selectedAccount: InjectedAccountWithMeta;
  web3FromAddress: (address: string) => Promise<InjectedExtension>;
}): Promise<
  Result<{ injector: InjectedExtension; metadataHash: `0x${string}` }, Error>
> => {
  // Get injector from address
  const [injectorError, injector] = await tryAsync(
    web3FromAddress(selectedAccount.address),
  );
  if (injectorError !== undefined) {
    const err = chainErr("Failed to connect to wallet")(injectorError);
    return makeErr(err);
  }

  const [proofError, proof] = await getMerkleizedMetadata(api);
  if (proofError !== undefined) {
    console.error(proofError);
    const err = chainErr("Failed to generate metadata")(proofError);
    return makeErr(err);
  }

  const { metadataHash } = proof;

  return makeOk({ injector, metadataHash });
};

interface UseWalletArgs {
  api: ApiPromise | null;
  selectedAccount: InjectedAccountWithMeta | null;
  web3FromAddress: ((address: string) => Promise<InjectedExtension>) | null;
}

export const useWallet = ({
  api,
  selectedAccount,
  web3FromAddress,
}: UseWalletArgs) => {
  const [wallet, setWallet] = useState<{
    injector: InjectedExtension;
    metadataHash: `0x${string}`;
  } | null>(null);

  useEffect(() => {
    if (!api || !selectedAccount || !web3FromAddress) {
      console.warn("Inconsistent internal state for transaction signing");
      return;
    }

    const run = async () => {
      const [walletSetupError, walletSetup] = await setupWallet({
        api,
        selectedAccount,
        web3FromAddress,
      });
      if (walletSetupError !== undefined) {
        toast.error(
          `Failed to setup wallet for transactions: ${walletSetupError.toString()}`,
        );
        return;
      }

      setWallet(walletSetup);

      const { injector } = walletSetup;

      // Update chain metadata
      // TODO: refactor, do this only once for wallet/app instance
      const [metadataError] = await tryAsync(updateMetadata(api, [injector]));
      if (metadataError !== undefined) {
        toast.error(
          `Failed to update chain metadata: ${metadataError.toString()}`,
        );
      }
    };

    run().catch((e) => {
      toast.error(`Unexpected error setting up wallet: ${e}`);
    });
  }, [api, selectedAccount, web3FromAddress]);

  return wallet;
};

const handleTxEvent = ({
  event,
  api,
  setErrState,
  transactionType,
  wsEndpoint,
  toastId,
}: {
  event: TxEvent;
  api: ApiPromise;
  setErrState: (err: Error) => void;
  transactionType: string;
  wsEndpoint: string;
  toastId: string | number;
}) => {
  // Handle toast updates based on event kind
  switch (event.kind) {
    case "InternalError":
      setErrState(event.internalError);
      break;

    case "Invalid":
      setErrState(event.reason);
      break;

    case "Future":
      // Transaction has dependencies, keep current loading state
      break;

    case "Ready":
      toast.loading(TOAST_MESSAGES.READY, { id: toastId });
      break;

    case "Broadcast":
      toast.loading(TOAST_MESSAGES.BROADCASTING, { id: toastId });
      break;

    case "InBlock":
      toast.loading(TOAST_MESSAGES.IN_BLOCK, { id: toastId });
      setTimeout(() => {
        toast.loading(TOAST_MESSAGES.FINALIZING, { id: toastId });
      }, 1000);
      break;

    case "Finalized":
      handleFinalizedTxEvent({
        event,
        api,
        setErrState,
        transactionType,
        wsEndpoint,
        toastId,
      });
      break;

    case "FinalityTimeout":
      setErrState(strErr("Transaction finalization timed out"));
      break;

    case "Dropped":
      setErrState(strErr("Transaction was dropped from the pool"));
      break;

    case "Usurped":
      setErrState(strErr("Transaction was replaced by another transaction"));
      break;

    case "Retracted":
      setErrState(strErr("Transaction was retracted"));
      break;
  }
};

const handleFinalizedTxEvent = ({
  event,
  api,
  setErrState,
  transactionType,
  wsEndpoint,
  toastId,
}: {
  event: TxInBlockEvent;
  api: ApiPromise;
  setErrState: (err: Error) => void;
  transactionType: string;
  wsEndpoint: string;
  toastId: string | number;
}) => {
  // Check if this is an InBlock event with outcome information
  if (event.kind !== "Finalized" && event.kind !== "InBlock") {
    console.error("handleFinalizedTxEvent called with non-finalized event");
    return;
  }

  // Use the structured outcome from the event
  const outcome = event.outcome;
  const blockHash = event.blockHash;

  match(outcome)({
    Success: () => {
      toast.dismiss(toastId);
      toast.success(`${transactionType} ${TOAST_MESSAGES.SUCCESS}`, undefined, {
        label: "View on Block Explorer",
        onClick: () =>
          window.open(
            getExplorerLink({ wsEndpoint, hash: blockHash }),
            "_blank",
          ),
      });
    },
    Failed: ({ error: dispatchError }) => {
      // Use the new comprehensive error mapper
      const errorMessage = mapDispatchErrorToMessage(
        dispatchError,
        api,
        transactionType,
      );

      setErrState(strErr(errorMessage));
      toast.dismiss(toastId);
      toast.error(errorMessage);
    },
  });
};

// ==== Display Helpers ====

/**
 * Converts a TxStage to TxHelper for UI state management.
 */
export function txStageToTxHelper(stage: TxStage): TxHelper {
  const setOnHelper = <T extends Partial<TxHelper>>(
    opts: T,
  ): Omit<TxHelper, "message"> & T => ({
    txHash: null,
    isSigning: false,
    isSubmitted: false,
    isPending: false,
    isInBlock: false,
    isExecuted: false,
    isFinalized: false,
    isError: false,
    ...opts,
  });

  return match(stage)<TxHelper>({
    Idle: () =>
      setOnHelper({
        message: "Ready to send transaction",
      }),

    Signing: () =>
      setOnHelper({
        isSigning: true,
        message: "Waiting for signature...",
      }),

    Submitted: ({ event }) => txEventToTxHelper(event, null),

    Error: ({ error, txHash: txHash }) =>
      setOnHelper({
        txHash: txHash,
        isError: true,
        error,
        message: error.message || "Transaction failed",
      }),
  });
}

/**
 * Converts a TxEvent to TxHelper for backward compatibility and easier UI state management.
 */
export function txEventToTxHelper(
  txEvent: TxEvent | null,
  error: Error | null = null,
): TxHelper {
  const setOnHelper = <T extends Partial<TxHelper>>(
    opts: T,
  ): Omit<TxHelper, "message"> & T => ({
    txHash: null,
    isSigning: false,
    isSubmitted: false,
    isPending: false,
    isInBlock: false,
    isExecuted: false,
    isFinalized: false,
    isError: false,
    ...opts,
  });
  // Handle error state first
  if (error) {
    return setOnHelper({
      isError: true,
      error,
      message: error.message || "Transaction failed",
    });
  }

  if (!txEvent) {
    return setOnHelper({ message: "Transaction not started" });
  }

  // Extract txHash from the event (available in all events via TxEventBase)
  const txHash = txEvent.txHash;

  // Use the TxState from the event for simplified state logic
  return match(txEvent.txState)<TxHelper>({
    InternalError: ({ error }) =>
      setOnHelper({
        txHash,
        isError: true,
        error,
        message: error.message || "Internal error occurred",
      }),

    Invalid: ({ reason }) =>
      setOnHelper({
        txHash,
        isError: true,
        error: reason,
        message: "Transaction invalid",
      }),

    Pool: ({ kind }) => {
      const isSubmitted = true;
      switch (kind) {
        case "Future":
          return setOnHelper({
            txHash,
            isSubmitted,
            isPending: true,
            message: "Transaction has dependencies",
          });
        case "Ready":
          return setOnHelper({
            txHash,
            isSubmitted,
            isPending: true,
            message: "Transaction ready and included in pool",
          });
        case "Broadcast":
          return setOnHelper({
            txHash,
            isSubmitted,
            isPending: true,
            message: "Transaction broadcasted to network nodes",
          });
      }
    },

    Evicted: ({ kind }) => {
      switch (kind) {
        case "Dropped":
          return setOnHelper({
            txHash,
            isError: true,
            message: "Transaction dropped",
          });
        case "Usurped":
          return setOnHelper({
            txHash,
            isError: true,
            message: "Transaction replaced",
          });
      }
    },

    Included: ({ kind, outcome }) => {
      const isSubmitted = true;

      // Check if the transaction failed at runtime
      // Important: A transaction can be included in a block but still fail execution
      const runtimeFailed = match(outcome)<boolean>({
        Success: () => false,
        Failed: () => true,
      });

      // Handle error message for runtime failures
      let error: Error | undefined;
      if (runtimeFailed) {
        const errorMessage = match(outcome)<string>({
          Success: () => "Unexpected success state",
          Failed: ({ error }) => mapDispatchErrorToMessage(error),
        });
        error = new Error(errorMessage);
      }

      switch (kind) {
        case "InBlock":
          return setOnHelper({
            txHash,
            isSubmitted,
            isInBlock: true,
            isExecuted: !runtimeFailed,
            isError: runtimeFailed,
            error,
            message: runtimeFailed
              ? "Transaction included but failed execution"
              : "Transaction was included in block",
          });
        case "Finalized":
          return setOnHelper({
            txHash,
            isSubmitted,
            isInBlock: true,
            isExecuted: !runtimeFailed,
            isError: runtimeFailed,
            isFinalized: true,
            error,
            message: runtimeFailed
              ? "Transaction finalized but failed execution"
              : "Transaction was finalized",
          });
        case "FinalityTimeout":
          return setOnHelper({
            txHash,
            isSubmitted,
            isError: true,
            message: "Transaction finalization timed out",
          });
        default:
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          throw new Error(`Unexpected Included event kind: ${kind}`);
      }
    },

    Warning: ({ kind }) => {
      switch (kind) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        case "Retracted":
          return setOnHelper({
            txHash,
            isError: true,
            message: "Transaction retracted",
          });
        default:
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          throw new Error(`Unexpected Warning event kind: ${kind}`);
      }
    },
  });
}

/**
 * Maps SbDispatchError to user-friendly error messages.
 *
 * @param error - The SbDispatchError to convert
 * @param api - Optional ApiPromise for module error lookup
 * @param transactionType - Type of transaction for context
 * @returns User-friendly error message
 */
export function mapDispatchErrorToMessage(
  error: SbDispatchError,
  api?: ApiPromise,
  transactionType?: string,
): string {
  const prefix = transactionType
    ? `${transactionType} failed: `
    : "Transaction failed: ";

  return match(error)<string>({
    Other: (message) => `${prefix}${message}`,

    CannotLookup: () => `${prefix}Failed to lookup required data`,

    BadOrigin: () => `${prefix}Invalid transaction origin`,

    Module: ({ index, error: errorIndex, message }) => {
      return if_let(message, "Some")(
        (msg) => `${prefix}${msg}`,
        () => {
          // Try to resolve module error using registry
          if (api) {
            const [moduleError, metaError] = trySync(() => {
              // Use the simplified module error lookup
              return api.registry.findMetaError({
                index: api.registry.createType("u8", index),
                error: api.registry.createType("u8", errorIndex),
              });
            });
            // if (moduleError !== undefined) {
            // }

            if (moduleError === undefined) {
              const { section, name, docs } = metaError;
              const docString = docs.length > 0 ? ` - ${docs.join(" ")}` : "";
              return `${prefix}${section}.${name}${docString}`;
            }
          }

          // Fallback to generic module error
          return `${prefix}Module error ${index}.${errorIndex}`;
        },
      );
    },

    ConsumerRemaining: () =>
      `${prefix}Account has remaining consumers and cannot be destroyed`,

    NoProviders: () =>
      `${prefix}Account cannot be created - no providers available`,

    TooManyConsumers: () =>
      `${prefix}Account cannot be created - too many consumers`,

    Token: (tokenError) =>
      match(tokenError)<string>({
        FundsUnavailable: () => `${prefix}Insufficient funds available`,
        OnlyProvider: () =>
          `${prefix}Cannot remove funds - account would lose only provider`,
        BelowMinimum: () =>
          `${prefix}Account balance would fall below minimum required`,
        CannotCreate: () => `${prefix}Cannot create account with these funds`,
        UnknownAsset: () => `${prefix}Unknown asset specified`,
        Frozen: () => `${prefix}Funds are frozen and cannot be used`,
        Unsupported: () => `${prefix}Operation not supported for this asset`,
        CannotCreateHold: () =>
          `${prefix}Cannot create account for held balance`,
        NotExpendable: () =>
          `${prefix}Withdrawal would cause unwanted loss of account`,
        Blocked: () => `${prefix}Account cannot receive the assets`,
      }),

    Arithmetic: (arithmeticError) =>
      match(arithmeticError)<string>({
        Underflow: () => `${prefix}Arithmetic underflow occurred`,
        Overflow: () => `${prefix}Arithmetic overflow occurred`,
        DivisionByZero: () => `${prefix}Division by zero error`,
      }),

    Transactional: (transactionalError) =>
      match(transactionalError)<string>({
        LimitReached: () => `${prefix}Too many transactional layers`,
        NoLayer: () => `${prefix}No transactional layer available`,
      }),

    Exhausted: () => `${prefix}System resources exhausted`,

    Corruption: () => `${prefix}System state corruption detected`,

    Unavailable: () => `${prefix}Required resource is currently unavailable`,

    RootNotAllowed: () =>
      `${prefix}Root origin is not allowed for this operation`,
  });
}

// ==== Basic Test / Usage ====

function _ExampleUsage() {
  const { api, selectedAccount, web3FromAddress, wsEndpoint } =
    null as unknown as {
      api: ApiPromise;
      selectedAccount: InjectedAccountWithMeta | null;
      web3FromAddress: (address: string) => Promise<InjectedExtension>;
      wsEndpoint: string;
    };

  const estimateTx = useMemo(() => {
    return api.tx.balances.transferAllowDeath(
      "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
      "1000000000000",
    );
  }, [api]);

  const {
    sendTx,
    isSigning,
    isPending,
    isExecuted,
    isFinalized,
    isError,
    message,
    error,
    fee,
    isFeeLoading,
    feeError,
  } = useSendTransaction({
    api,
    wsEndpoint,
    selectedAccount,
    transactionType: "Transfer",
    web3FromAddress,
    estimateTx: estimateTx,
  });

  // Format fee with proper error handling like other forms in the codebase
  const formattedFee = useMemo(() => {
    if (!fee) return null;
    try {
      return `${formatToken(fee)} TORUS`;
    } catch {
      // If formatting fails for higher amounts, return a fallback
      return `${fee.toString()} Rems`;
    }
  }, [fee]);

  const _handleTransfer = () => {
    if (!sendTx) return;

    const tx = api.tx.balances.transferAllowDeath(
      "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
      "1000000000000",
    );

    void sendTx(tx);
  };

  return (
    <div>
      <button
        onClick={_handleTransfer}
        disabled={!sendTx || isPending || isSigning}
      >
        {isSigning ? "Signing..." : isPending ? "Pending..." : "Transfer"}
      </button>

      <div>Status: {message}</div>
      <div>Feed: {formattedFee}</div>
      {isFeeLoading && <div>Estimating fee...</div>}
      {formattedFee && <div>Estimated fee: {formattedFee}</div>}
      {feeError && <div>Fee estimation error: {feeError.message}</div>}
      {isError && error && <div>Error: {error.message}</div>}
      {isExecuted && <div>Success!</div>}
      {isFinalized && <div>Finalized!</div>}
    </div>
  );
}
