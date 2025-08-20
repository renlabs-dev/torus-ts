import { useEffect, useMemo, useState } from "react";

import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { InjectedExtension } from "@polkadot/extension-inject/types";
import type { ISubmittableResult } from "@polkadot/types/types";
import type { Enum } from "rustie";
import { match } from "rustie";

import type {
  ExtrinsicTracker,
  TxEvent,
  TxInBlockEvent,
} from "@torus-network/sdk/extrinsics";
import { sendTxWithTracker } from "@torus-network/sdk/extrinsics";
import type { HexH256 } from "@torus-network/sdk/types";
import { chainErr, strErr } from "@torus-network/torus-utils/error";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import type { Result } from "@torus-network/torus-utils/result";
import { makeErr, makeOk } from "@torus-network/torus-utils/result";
import { trySync } from "@torus-network/torus-utils/try-catch";

import { toast } from "@torus-ts/ui/hooks/use-toast";

import type { InjectedAccountWithMeta } from "../torus-provider";
import {
  mapDispatchErrorToMessage,
  TOAST_MESSAGES,
  txStageToTxHelper,
} from "./use-send-transaction-display";
import { useWallet } from "./use-send-transaction-setup";

const logger = BasicLogger.create({ name: "use-send-transaction" });

/**
 * Generates a Polkadot.js Apps explorer link for viewing a transaction.
 *
 * @param wsEndpoint - WebSocket endpoint for blockchain connection
 * @param blockHash - Hash of the block containing the transaction
 */
export const getExplorerLink = ({
  wsEndpoint,
  blockHash,
}: {
  wsEndpoint: string;
  blockHash: string;
}) =>
  `https://polkadot.js.org/apps/?rpc=${wsEndpoint}#/explorer/query/${blockHash}`;

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

/**
 * Represents the current stage of a transaction's lifecycle.
 *
 * This enum tracks the complete transaction flow from initial state through
 * final resolution or error. Each stage contains relevant data for that
 * specific phase.
 */
export type TxStage = Enum<{
  /** Initial state with no active transaction */
  Idle: {
    extrinsic: null;
  };
  /** User is signing the transaction in their wallet */
  Signing: {
    extrinsic: SubmittableExtrinsic<"promise">;
  };
  /** Transaction submitted to network, contains status events */
  Submitted: {
    event: TxEvent;
  };
  /** Transaction failed at any stage */
  Error: {
    error: Error;
    /** Transaction hash if the error occurred after submission */
    txHash?: HexH256;
  };
}>;

/**
 * Function type for sending transactions with optional signing parameters.
 */
export type SendTxFn = <T extends ISubmittableResult>(
  tx: SubmittableExtrinsic<"promise", T>,
  options?: Pick<
    Parameters<SubmittableExtrinsic<"promise">["signAndSend"]>[1],
    "nonce" | "tip"
  >,
) => Promise<Result<{ tracker: ExtrinsicTracker }, Error>>;

/**
 * Output interface for the useSendTransaction hook.
 *
 * Combines transaction state, helper flags, and the send function.
 */
export interface UseSendTxOutput extends TxHelper {
  txStage: TxStage;
  sendTx: SendTxFn | null;
}

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
 */
export function useSendTransaction({
  api,
  wsEndpoint,
  selectedAccount,
  transactionType,
  web3FromAddress,
}: {
  api: ApiPromise | null;
  wsEndpoint: string | null;
  selectedAccount: InjectedAccountWithMeta | null;
  web3FromAddress: ((address: string) => Promise<InjectedExtension>) | null;
  transactionType: string;
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
    ): Promise<Result<{ tracker: ExtrinsicTracker }, Error>> => {
      if (!selectedAccount) {
        const error = strErr("No account selected");
        setErrState(error);
        return makeErr(error);
      }

      // Cancel any existing tracker
      // TODO: maybe lock sending when transaction some is in progress?
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
        return makeErr(sendError);
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

      return makeOk({ tracker });
    };

    setSendFn({ sendTx });

    return () => {
      if (currentTracker) {
        currentTracker.cancel();
      }
    };
  }, [api, wsEndpoint, wallet, selectedAccount, web3FromAddress]);

  const txHelper = useMemo(() => txStageToTxHelper(txStage), [txStage]);

  return {
    txStage,
    ...sendFn,
    ...txHelper,
  };
}

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
            getExplorerLink({ wsEndpoint, blockHash: blockHash }),
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
