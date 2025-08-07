import type { ApiPromise, SubmittableResult } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api-base/types";
import type {
  DispatchError,
  DispatchInfo,
  EventRecord,
} from "@polkadot/types/interfaces";
import Emittery from "emittery";
import type { Enum } from "rustie";
import { match } from "rustie";
import { assert } from "tsafe";
import type { z } from "zod";

import type { HexH256 } from "@torus-network/sdk/types";
import {
  sb_array,
  sb_enum,
  sb_h256,
  sb_null,
  sb_string,
} from "@torus-network/sdk/types";
import { defer } from "@torus-network/torus-utils/async";

// ==== Transaction / Extrinsic Status ====

/**
 * Parser for Substrate enum ExtrinsicStatus, which represents the lifecycle of
 * a transaction (extrinsic) that was submitted to a Substrate network.
 *
 * Transitions:
 *
 * | From      | To                                        |
 * |-----------|-------------------------------------------|
 * | Submit    | Invalid*, Future, Ready                   |
 * | Future    | Ready                                     |
 * | Ready     | Broadcast, Dropped*, Usurped*, InBlock    |
 * | Broadcast | InBlock                                   |
 * | InBlock   | Finalized*, Retracted, FinalityTimeout*   |
 * | Retracted | Ready                                     |
 *
 * `*` = terminal states
 */
export const sb_extrinsic_status = sb_enum({
  /**  */
  Future: sb_null,
  Ready: sb_null,
  Broadcast: sb_array(sb_string),
  InBlock: sb_h256,
  Retracted: sb_h256,
  FinalityTimeout: sb_null,
  Finalized: sb_h256,
  Usurped: sb_h256,
  Dropped: sb_null,
  Invalid: sb_null,
});

export type SbExtrinsicStatus = z.infer<typeof sb_extrinsic_status>;

// ==== Transaction / Extrinsic State ====

/**
 * Represents a transaction being submitted to a Substrate network.
 */
export type TxStage = Enum<{
  Empty: null;
  Signing: null;
  Submitted: { result: SubmittableResult; extStatus: SbExtrinsicStatus }; // same parser you wrote
  Error: { error: Error };
}>;

/**
 * Extrinsic status helper.
 */
export interface TxHelper {
  /** FILL */
  isSigning: boolean;
  /** */
  isSubmitted: boolean;
  isPending: boolean;
  isSuccess: boolean;
  isFinalized: boolean;
  isError: boolean;
  isReverted: boolean;

  message: string;
  error?: Error;
}

export function txStatusToTxHelper(txStatus: TxStage): TxHelper {
  const setOnHelper = <T extends Partial<TxHelper>>(
    opts: T,
  ): Omit<TxHelper, "message"> & T => ({
    isSigning: false,
    isSubmitted: false,
    isPending: false,
    isSuccess: false,
    isFinalized: false,
    isError: false,
    isReverted: false,
    ...opts,
  });
  return match(txStatus)<TxHelper>({
    Empty: () => setOnHelper({ message: "Transaction not started" }),
    Signing: () =>
      setOnHelper({ isSigning: true, message: "Signing transaction" }),
    Submitted: ({ extStatus }) => {
      const isSubmitted = true;
      const rest = match(extStatus)<
        Partial<TxHelper> & Pick<TxHelper, "message">
      >({
        Invalid: () => ({ isError: true, message: "Transaction invalid" }),
        Future: () => ({
          isPending: true,
          message: "Transaction has dependencies",
        }),
        Ready: () => ({
          isPending: true,
          message: "Transaction ready and included in pool",
        }),
        Broadcast: () => ({
          isPending: true,
          message: "Transaction broadcasted to network nodes",
        }),
        InBlock: () => ({
          isSuccess: true,
          message: "Transaction was included in block",
        }),
        Finalized: () => ({
          isSuccess: true,
          isFinalized: true,
          message: "Transaction was finalized",
        }),

        // From Ready
        Dropped: () => ({ isError: true, message: "Transaction dropped" }),
        Usurped: () => ({ isError: true, message: "Transaction replaced" }),

        // From InBlock
        FinalityTimeout: () => ({
          isError: true,
          isReverted: true,
          message: "Transaction finalization timed out",
        }),
        Retracted: () => ({
          isError: true,
          isReverted: true,
          message: "Transaction retracted",
        }),
      });

      return setOnHelper({ isSubmitted, ...rest });
    },
    Error: ({ error }) =>
      setOnHelper({ isError: true, error, message: error.message }),
  });
}

// ==== Extrinsic Tracker ====

export interface ExtUpdateBase {
  _extResultRaw: SubmittableResult;
  status: SbExtrinsicStatus;
  txHash: HexH256;
  // events: SbEventRecord[]
}

export interface ExtUpdateInternalError extends ExtUpdateBase {
  internalError: Error;
}

export interface ExtUpdateInvalid extends ExtUpdateBase {
  error: Error;
}

export interface ExtUpdateInBlock extends ExtUpdateBase {
  _dispatchErrorRaw: DispatchError | null;
  _dispatchInfoRaw: DispatchInfo;
  _internalErrorRaw: Error | null;
  _eventsRaw: EventRecord[];
}

interface ExtrinsicTrackerEvents {
  status: ExtUpdateBase;

  sendFailed: ExtUpdateInvalid;

  inBlock: ExtUpdateInBlock;
  finalized: ExtUpdateInBlock;
}

export interface ExtrinsicTracker
  extends AsyncIterable<TxHelper>,
    Pick<Emittery<ExtrinsicTrackerEvents>, "on" | "off" | "once" | "events"> {
  // Raw event emitter
  emitter: Emittery<ExtrinsicTrackerEvents>;

  // Promises for specific events
  sendFailed: Promise<never>;
  submitted: Promise<string>;
  inBlock: Promise<string>;
  finalized: Promise<string>;

  cancel(): void;
}

export function submitWithTracker(
  _api: ApiPromise,
  extrinsic: SubmittableExtrinsic<"promise">,
  signer: Parameters<SubmittableExtrinsic<"promise">["signAndSend"]>[0],
): ExtrinsicTracker {
  const emitter = new Emittery<ExtrinsicTrackerEvents>();

  // Promises for specific events
  const sendFailed = defer<never>();
  const submitted = defer<string>();
  const inBlock = defer<string>();
  const finalized = defer<string>();
  const failed = defer<never>();

  let unsubscribe: (() => void) | undefined;

  // -- Async iterator --
  const queue: ExtUpdateBase[] = [];
  let pull: (res: IteratorResult<ExtUpdateBase>) => void;
  const next = () => pull?.({ value: queue.shift()!, done: false });

  const updateHandler = (result: SubmittableResult) => {
    const { status, events, dispatchError, internalError, txHash, txIndex } =
      result;

    const extStatus = sb_extrinsic_status.parse(status);

    const baseUpdate: ExtUpdateBase = {
      _extResultRaw: result,
      status: extStatus,
      txHash: result.txHash.toHex(),
    };

    const makeUpdate = <U>(update: U) => ({
      ...baseUpdate,
      ...update,
    });

    if (internalError) {
      const update: ExtUpdateInternalError = makeUpdate({
        internalError,
      });

      queue.push(update);
      unsubscribe?.();
    }

    match(extStatus)<unknown>({
      Invalid: () => {
        const error = result.internalError;
        assert(
          error,
          "Invalid extrinsic data for Invalid status: no internal error",
        );
      },
      Future: () => {},
      Ready: () => {},
      Broadcast: () => {},
      InBlock: () => {},
      Finalized: () => {},
      Dropped: () => {},
      Usurped: () => {},
      FinalityTimeout: () => {},
      Retracted: () => {},
    });

    queue.push(update);
    next();
  };

  extrinsic
    .signAndSend(signer, updateHandler)
    .then((u) => (unsubscribe = u))
    .catch((e) => sendFailed.reject(e));

  const tracker: ExtrinsicTracker = {
    emitter,

    on: emitter.on.bind(emitter),
    once: emitter.once.bind(emitter),
    off: emitter.off.bind(emitter),
    events: emitter.events.bind(emitter),

    sendFailed: sendFailed.promise,
    submitted: submitted.promise,
    inBlock: inBlock.promise,
    finalized: finalized.promise,

    [Symbol.asyncIterator]() {
      return {
        next: () =>
          new Promise<IteratorResult<TxHelper>>((res) => {
            if (queue.length)
              return res({ value: queue.shift()!, done: false });
            pull = res;
          }),
        return: () => {
          tracker.cancel();
          return Promise.resolve({ value: undefined, done: true });
        },
        throw: (err) => {
          tracker.cancel();
          return Promise.reject(err);
        },
      };
    },

    cancel() {
      unsubscribe?.();
      emitter.clearListeners();
    },
  };

  return tracker;
}
