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
import type { z } from "zod";

import type { HexH256 } from "@torus-network/sdk/types";
import {
  sb_array,
  sb_bigint,
  sb_enum,
  sb_h256,
  sb_null,
  sb_number,
  sb_option,
  sb_string,
  sb_struct,
} from "@torus-network/sdk/types";
import { AsyncPushStream, defer } from "@torus-network/torus-utils/async";

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

// ---- Dispatch Error ----

/**
 * Parser for Substrate {@link DispatchError}, which represents an error that occurred
 * during the dispatch of an extrinsic.
 */
export const sb_dispatch_error = sb_enum({
  /** Some unknown error occurred. */
  Other: sb_string,
  /** Failed to lookup some data. */
  CannotLookup: sb_null,
  /** A bad origin. */
  BadOrigin: sb_null,
  /** A custom error in a module (pallet). */
  Module: sb_struct({
    /** Module (pallet) index. */
    index: sb_number,
    /** Error within the module. */
    error: sb_number,
    /** Optional error message. */
    message: sb_option(sb_string),
  }),
  /** At least one consumer is remaining so the account cannot be destroyed. */
  ConsumerRemaining: sb_null,
  /** There are no providers so the account cannot be created. */
  NoProviders: sb_null,
  /** There are too many consumers so the account cannot be created. */
  TooManyConsumers: sb_null,
  /** An error to do with tokens. */
  Token: sb_enum({
    /** Funds are unavailable. */
    FundsUnavailable: sb_null,
    /** Some part of the balance gives the only provider reference to the account and thus cannot be (re)moved. */
    OnlyProvider: sb_null,
    /** Account cannot exist with the funds that would be given. */
    BelowMinimum: sb_null,
    /** Account cannot be created. */
    CannotCreate: sb_null,
    /** The asset in question is unknown. */
    UnknownAsset: sb_null,
    /** Funds exist but are frozen. */
    Frozen: sb_null,
    /** Operation is not supported by the asset. */
    Unsupported: sb_null,
    /** Account cannot be created for a held balance. */
    CannotCreateHold: sb_null,
    /** Withdrawal would cause unwanted loss of account. */
    NotExpendable: sb_null,
    /** Account cannot receive the assets. */
    Blocked: sb_null,
  }),
  /** An arithmetic error. */
  Arithmetic: sb_enum({
    /** Underflow. */
    Underflow: sb_null,
    /** Overflow. */
    Overflow: sb_null,
    /** Division by zero. */
    DivisionByZero: sb_null,
  }),
  /** The number of transactional layers has been reached, or we are not in a transactional layer. */
  Transactional: sb_enum({
    /** Too many transactional layers have been spawned. */
    LimitReached: sb_null,
    /** A transactional layer was expected, but does not exist. */
    NoLayer: sb_null,
  }),
  /** Resources exhausted, e.g. attempt to read/write data which is too large to manipulate. */
  Exhausted: sb_null,
  /** The state is corrupt; this is generally not going to fix itself. */
  Corruption: sb_null,
  /** Some resource (e.g. a preimage) is unavailable right now. This might fix itself later. */
  Unavailable: sb_null,
  /** Root origin is not allowed. */
  RootNotAllowed: sb_null,
});

export type SbDispatchError = z.infer<typeof sb_dispatch_error>;

// ---- Dispatch Info ----

/**
 * Parser for Substrate {@link DispatchInfo}, which contains information about the dispatch
 * of an extrinsic including weight and fee payment.
 */
export const sb_dispatch_info = sb_struct({
  /** Weight of this transaction. */
  weight: sb_struct({
    /** The weight of computational time used based on some reference hardware. */
    refTime: sb_bigint,
    /** The weight of storage space used by proof of validity. */
    proofSize: sb_bigint,
  }),
  /** Class of this transaction. */
  class: sb_enum({
    /** Normal transaction (default). */
    Normal: sb_null,
    /** Operational transaction. */
    Operational: sb_null,
    /** Mandatory transaction. */
    Mandatory: sb_null,
  }),
  /** Does this transaction pay fees. */
  paysFee: sb_enum({
    /** Yes, the transaction pays fees. */
    Yes: sb_null,
    /** No, the transaction does not pay fees. */
    No: sb_null,
  }),
});

export type SbDispatchInfo = z.infer<typeof sb_dispatch_info>;

// ---- Event Record ----

/**
 * Parser for Substrate {@link EventRecord}, which represents an event that occurred
 * during block execution.
 */
export const sb_event_record = sb_struct({
  /** The phase of block execution in which the event occurred. */
  phase: sb_enum({
    /** Applying an extrinsic. */
    ApplyExtrinsic: sb_number,
    /** Finalization phase. */
    Finalization: sb_null,
    /** Initialization phase. */
    Initialization: sb_null,
  }),
  /** The event data - we keep this raw for flexibility. */
  event: sb_struct({
    /** The module (pallet) that emitted the event. */
    section: sb_string,
    /** The event method/name. */
    method: sb_string,
    /** The event data (kept as raw for flexibility). */
    data: sb_array(sb_string),
    /** Optional metadata. */
    meta: sb_option(
      sb_struct({
        /** Event documentation. */
        docs: sb_array(sb_string),
      })
    ),
  }),
  /** List of topics for indexed event attributes. */
  topics: sb_array(sb_h256),
});

export type SbEventRecord = z.infer<typeof sb_event_record>;

// ---- Submittable Result ----

/**
 * Parser for {@link SubmittableResult}, which contains the complete result of
 * a submitted extrinsic including status, events, and any errors.
 */
export const sb_submittable_result = sb_struct({
  /** The status of the extrinsic. */
  status: sb_extrinsic_status,
  /** Array of events that occurred during extrinsic execution. */
  events: sb_array(sb_event_record),
  /** Optional dispatch error if the extrinsic failed. */
  dispatchError: sb_option(sb_dispatch_error),
  /** Optional dispatch info containing weight and fee information. */
  dispatchInfo: sb_option(sb_dispatch_info),
  /** The transaction hash. */
  txHash: sb_h256,
  /** Optional block hash if the transaction is included in a block. */
  blockHash: sb_option(sb_h256),
  /** Optional block number if the transaction is included in a block. */
  blockNumber: sb_option(sb_number),
  /** Optional transaction index within the block. */
  txIndex: sb_option(sb_number),
});

export type SbSubmittableResult = z.infer<typeof sb_submittable_result>;

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
  dispatchError?: SbDispatchError;
  dispatchInfo: SbDispatchInfo;
  events: SbEventRecord[];
}

interface ExtrinsicTrackerEvents {
  status: ExtUpdateBase;

  internalError: ExtUpdateInternalError;
  sendFailed: ExtUpdateInvalid;

  inBlock: ExtUpdateInBlock;
  finalized: ExtUpdateInBlock;
}

export type ExtUpdate =
  | ExtUpdateBase
  | ExtUpdateInternalError
  | ExtUpdateInvalid;

export interface ExtrinsicTracker
  extends Pick<
    Emittery<ExtrinsicTrackerEvents>,
    "on" | "off" | "once" | "events"
  > {
  // Raw event emitter
  emitter: Emittery<ExtrinsicTrackerEvents>;

  // // We will ignore async iterator for now
  // stream: AsyncPushStream<ExtUpdate>;

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
  signer: Parameters<SubmittableExtrinsic<"promise">["signAndSend"]>[0]
): ExtrinsicTracker {
  const emitter = new Emittery<ExtrinsicTrackerEvents>();

  // Promises for specific events
  const sendFailed = defer<never>();
  const submitted = defer<string>();
  const inBlock = defer<string>();
  const finalized = defer<string>();
  const failed = defer<never>();

  let unsubscribe: (() => void) | undefined;

  // -- Async iterator using AsyncPushStream --
  const stream = new AsyncPushStream<ExtUpdate>();

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

      void emitter.emit("internalError", update);
      void emitter.emit("status", update);
      stream.push(update);
      unsubscribe?.();
    }

    match(extStatus)<unknown>({
      Invalid: () => {},
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

    stream.push(baseUpdate);
  };

  extrinsic
    .signAndSend(signer, updateHandler)
    .then((u) => (unsubscribe = u))
    .catch((e) => sendFailed.reject(e));

  const tracker: ExtrinsicTracker = {
    emitter,
    // stream,

    on: emitter.on.bind(emitter),
    once: emitter.once.bind(emitter),
    off: emitter.off.bind(emitter),
    events: emitter.events.bind(emitter),

    sendFailed: sendFailed.promise,
    submitted: submitted.promise,
    inBlock: inBlock.promise,
    finalized: finalized.promise,

    cancel() {
      unsubscribe?.();
      emitter.clearListeners();
      stream.end();
    },

    // [Symbol.asyncIterator]() {
    // },
  };

  return tracker;
}

// ==== UI helpers (we will ignore these for now) ====

// ---- Transaction / Extrinsic Status ----

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
    opts: T
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
