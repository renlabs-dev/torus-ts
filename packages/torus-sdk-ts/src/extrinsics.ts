/*
  https://paritytech.github.io/polkadot-sdk/master/sc_transaction_pool_api/enum.TransactionStatus.html
*/

import type { ApiPromise, SubmittableResult } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api-base/types";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DispatchError, ExtrinsicStatus } from "@polkadot/types/interfaces";
import { chainErr, ParseError } from "@torus-network/torus-utils/error";
import type { Result } from "@torus-network/torus-utils/result";
import { makeErr, makeOk } from "@torus-network/torus-utils/result";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { zodParseResult } from "@torus-network/torus-utils/zod";
import Emittery from "emittery";
import type { Enum } from "rustie";
import { match } from "rustie";
import { assert } from "tsafe";
import { z } from "zod";
import type { HexH256 } from "./types/index.js";
import {
  sb_array,
  sb_bigint,
  sb_enum,
  sb_h256,
  sb_null,
  sb_number,
  sb_string,
  sb_struct,
  sb_struct_obj,
  U8aFixed_schema,
  UInt_schema,
} from "./types/index.js";

// ==== Raw Extrinsic State ====

// ---- Extrinsic Status ----

/**
 * Parser for Substrate enum {@link ExtrinsicStatus}, which represents the
 * lifecycle of a transaction (extrinsic) that was submitted to a Substrate
 * network.
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
  /**
   * Transaction was deemed invalid on import; never entered the transaction
   * pool. Terminal state.
   */
  Invalid: sb_null,

  /**
   * Transaction is in the future queue (e.g., nonce/era not yet valid).
   * Awaiting readiness.
   */
  Future: sb_null,

  /**
   * Transaction is ready in the pool and eligible for propagation/inclusion.
   */
  Ready: sb_null,

  /**
   * Transaction was broadcast to peers; array contains peer identifiers.
   */
  Broadcast: sb_array(sb_string),

  /**
   * Transaction in the pool was replaced by another with the same (sender,
   * nonce) but higher priority. Terminal state.
   */
  Usurped: sb_h256,

  /**
   * Transaction was removed from the pool before inclusion (e.g., low priority,
   * max pool size). Terminal state. Can be (potentially) re-submitted.
   */
  Dropped: sb_null,

  /**
   * Transaction has been included in a block; value is the block hash.
   */
  InBlock: sb_h256,

  /**
   * Inclusion block was removed from the best chain due to a re-org;
   * transaction may be re-included later.
   */
  Retracted: sb_h256,

  /**
   * Transaction’s block has been finalized by consensus; value is the block
   * hash. Terminal state.
   */
  Finalized: sb_h256,

  /**
   * Node gave up waiting for finality within its configured window; block may
   * still finalize later if re-subscribed. Terminal for this subscription.
   * Can be (potentially) re-submitted.
   */
  FinalityTimeout: sb_h256,
});

export type SbExtrinsicStatus = z.infer<typeof sb_extrinsic_status>;

// export const isSubscriptionTerminal = (status: SbExtrinsicStatus): boolean => {
//   return match(status)<boolean>({
//     Invalid: () => true,
//     Future: () => false,
//     Ready: () => false,
//     Broadcast: () => false,
//     Usurped: () => true,
//     Dropped: () => true,
//     InBlock: () => false,
//     Retracted: () => false,
//     Finalized: () => true,
//     FinalityTimeout: () => true,
//   });
// };

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
    index: UInt_schema,
    /** Error within the module. */
    error: U8aFixed_schema,
    // /** Optional error message. */
    // message: sb_option(sb_string),
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

// ---- Event ----

/**
 * Parser for Substrate Event (IEvent), which contains the actual event data.
 *
 * See {@link GenericEvent}, {@link IEvent}.
 */
export const sb_event = sb_struct_obj(
  {
    // Map properties
    /** Event index/id. */
    index: z.any().optional(),
    // data: sb_array(z.any()),
  },
  {
    // Direct object properties
    /** The module (pallet) that emitted the event. */
    section: z.string(),
    /** The event method/name. */
    method: z.string(),
  },
);

export type SbEvent = z.infer<typeof sb_event>;

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
  /** The event itself. */
  event: sb_event,
  /** List of topics for indexed event attributes. */
  topics: sb_array(sb_h256),
});

export type SbEventRecord = z.infer<typeof sb_event_record>;

// ---- Submittable Result ----

/**
 * Parser for {@link SubmittableResult}, which contains the complete result of
 * a submitted extrinsic including status, events, and any errors.
 */
export const sb_submittable_result = z.object({
  /** Optional dispatch error if the extrinsic failed. */
  dispatchError: sb_dispatch_error.optional(),
  /** Optional dispatch info containing weight and fee information. */
  dispatchInfo: sb_dispatch_info.optional(),
  /** Optional internal error from submission/RPC pipeline. */
  internalError: z.instanceof(Error).optional(),
  /** Array of events that occurred during extrinsic execution. */
  events: z.array(sb_event_record).default([]),
  /** The status of the extrinsic. */
  status: sb_extrinsic_status,
  /** The transaction hash. */
  txHash: sb_h256,
  /** Optional transaction index within the block. */
  txIndex: z.number().optional(),
  /** Optional block number if the transaction is included in a block. */
  blockNumber: sb_number.optional(),
});

export type SbSubmittableResult = z.infer<typeof sb_submittable_result>;

// ==== Sanitized Extrinsic State ====

// ---- Runtime outcome once included ----

/**
 * Represents the runtime execution outcome of an extrinsic once it's included
 * in a block.
 *
 * Uses rustie ADT pattern to distinguish between successful execution and
 * runtime failures. Both variants include dispatch info containing weight and
 * fee information.
 *
 * @example
 * ```ts
 * import { match } from "rustie";
 *
 * // Handle the outcome of an included transaction
 * match(outcome)({
 *   Success: ({ info }) => console.log("Transaction succeeded", info.weight),
 *   Failed: ({ error, info }) => console.error("Runtime error:", error)
 * });
 * ```
 */
export type RuntimeOutcome = Enum<{
  Success: { info: SbDispatchInfo };
  Failed: { error: SbDispatchError; info: SbDispatchInfo };
}>;

// ---- High-level ADT over SubmittableResult ----

/**
 * High-level representation of an extrinsic's state throughout its lifecycle.
 *
 * Transforms the low-level Polkadot.js status updates into a clean ADT that
 * captures all possible states from submission to finalization. Each variant
 * represents a distinct phase in the transaction lifecycle.
 *
 * State transitions:
 * - Starts with Pool states (Future → Ready → Broadcast)
 * - Can move to Invalid (rejected) or InternalError (RPC/pipeline failure)
 * - Can be Evicted (Dropped/Usurped) from the pool
 * - Eventually reaches Included (InBlock → Finalized) for successful execution
 * - May encounter Warning states (Retracted) during reorgs
 *
 * @example
 * ```ts
 * import { match } from "rustie";
 *
 * // Process transaction state updates
 * match(txState)({
 *   Pool: ({ kind }) => console.log(`Transaction in pool: ${kind}`),
 *   Included: ({ outcome, blockHash }) => {
 *     if ("Success" in outcome) {
 *       console.log(`Success in block ${blockHash}`);
 *     }
 *   },
 *   Evicted: ({ kind }) => console.error(`Transaction ${kind} from pool`),
 *   // ... handle other states
 * });
 * ```
 */
export type TxState = Enum<{
  /** Submission/watch/signing/RPC pipeline failure (non-runtime). */
  InternalError: {
    txHash: HexH256;
    error: Error;
  };

  /** Pool rejection: tx deemed invalid on import; never entered the pool. */
  Invalid: {
    txHash: HexH256;
    reason: Error; // optional diagnostic/context
  };

  /** Still in the tx pool (pre-inclusion). */
  Pool: {
    kind: "Future" | "Ready" | "Broadcast";
    txHash: HexH256;
  };

  /** Pool eviction: tx was in the pool, then removed before execution. */
  Evicted: {
    kind: "Dropped" | "Usurped";
    txHash: HexH256;
    reason?: Error; // optional diagnostic/context
  };

  /** Included in a block with finalization status. */
  Included: {
    kind: "InBlock" | "Finalized" | "FinalityTimeout";
    txHash: HexH256;
    blockHash: HexH256;
    blockNumber: number;
    txIndex: number;
    events: SbEventRecord[];
    outcome: RuntimeOutcome;
  };

  /** Non-fatal warning states (keep listening). */
  Warning: {
    txHash: HexH256;
    kind: "Retracted";
  };
}>;

/**
 * Transforms a raw Polkadot.js SubmittableResult into a high-level TxState
 * representation.
 *
 * This function bridges the gap between the low-level Polkadot.js API and our
 * clean ADT representation. It parses the raw result through Zod schemas for
 * validation, then uses rustie's match pattern to transform the status into the
 * appropriate TxState variant.
 *
 * @param rawResult - The raw SubmittableResult from Polkadot.js API
 * @returns Object containing both the parsed result and the high-level TxState
 * @throws {ParseError} If the raw result doesn't match expected schema
 * structure
 *
 * @example
 * ```ts
 * // In an update handler for transaction subscription
 * const { txState, result } = parseSubmittableResult(rawResult);
 *
 * match(txState)({
 *   InternalError: ({ error }) => console.error("RPC error:", error),
 *   Pool: ({ kind }) => console.log(`Transaction ${kind}`),
 *   Included: ({ outcome }) => {
 *     if ("Failed" in outcome) {
 *       console.error("Runtime error:", outcome.Failed.error);
 *     }
 *   },
 *   // ... handle other states
 * });
 * ```
 */
export function parseSubmittableResult(rawResult: SubmittableResult): {
  txState: TxState;
  result: SbSubmittableResult;
} {
  const [parseErr, result] = zodParseResult(sb_submittable_result)(rawResult);
  if (parseErr !== undefined)
    // This should never happen, so we throw instead of returning Result
    throw chainErr("Error parsing SubmittableResult", ParseError)(parseErr);

  const { status, internalError, events, txHash, dispatchError, dispatchInfo } =
    result;

  // Handle internal errors first (submission/RPC failures)
  if (internalError) {
    const txState = {
      InternalError: {
        txHash,
        error: internalError,
      },
    };
    return { txState, result };
  }

  const handlePool = (kind: "Future" | "Ready" | "Broadcast") => () => {
    return {
      Pool: {
        txHash,
        kind,
      },
    };
  };

  const handleIncluded =
    <K extends "InBlock" | "Finalized" | "FinalityTimeout">(kind: K) =>
    (blockHash: HexH256) => {
      assert(dispatchInfo != null, "Dispatch info should be present");

      const outcome = dispatchError
        ? { Failed: { error: dispatchError, info: dispatchInfo } }
        : { Success: { info: dispatchInfo } };

      const blockNumber = result.blockNumber;
      const txIndex = result.txIndex;

      // blockHash is passed from the status
      assert(blockNumber != null, "Block number should be present");
      assert(txIndex != null, "Tx index should be present");

      return {
        Included: {
          kind,
          txHash,
          blockHash,
          blockNumber,
          txIndex,
          events,
          outcome,
        },
      };
    };

  // Use rustie's match to handle the status enum
  const txState = match(status)<TxState>({
    Invalid: () => ({
      Invalid: {
        txHash,
        reason: new Error("Transaction deemed invalid by the pool"),
      },
    }),

    Future: handlePool("Future"),
    Ready: handlePool("Ready"),
    Broadcast: (_peers) => ({
      Pool: {
        txHash,
        kind: "Broadcast",
      },
    }),

    InBlock: handleIncluded("InBlock"),
    Finalized: handleIncluded("Finalized"),

    Retracted: (_hash) => ({
      Warning: {
        txHash,
        kind: "Retracted",
      },
    }),

    Dropped: () => ({
      Evicted: {
        txHash,
        kind: "Dropped",
      },
    }),
    Usurped: (_hash) => ({
      Evicted: {
        txHash,
        kind: "Usurped",
      },
    }),

    FinalityTimeout: handleIncluded("FinalityTimeout"),
  });

  return {
    txState,
    result,
  };
}

// ==== Extrinsic Tracker ====

/**
 * Base properties shared by all transaction event types.
 *
 * Provides access to both raw and parsed transaction data, along with
 * the current state and transaction hash.
 */
export interface TxEventBase {
  /** Raw SubmittableResult from Polkadot.js API */
  extResultRaw: SubmittableResult;
  /** Parsed and validated result using Zod schemas */
  extResult: SbSubmittableResult;
  /** Transaction hash in hex format (0x prefixed) */
  txHash: HexH256;
  /** High-level state representation using ADT */
  txState: TxState;
  // events: SbEventRecord[]
}

/**
 * Event emitted when transaction fails in the submission/RPC pipeline.
 */
export interface TxInternalErrorEvent extends TxEventBase {
  kind: "InternalError";
  /** The error that occurred during submission */
  internalError: Error;
}

/**
 * Event emitted when transaction is rejected by the pool as invalid.
 */
export interface TxInvalidEvent extends TxEventBase {
  kind: "Invalid";
  /** Reason for rejection */
  reason: Error;
}

/**
 * Event emitted when transaction is in the pool awaiting inclusion.
 */
export interface TxPoolEvent extends TxEventBase {
  kind: "Future" | "Ready" | "Broadcast";
}

/**
 * Event emitted when transaction is removed from the pool without execution.
 */
export interface TxEvictedEvent extends TxEventBase {
  kind: "Dropped" | "Usurped";
}

/**
 * Event emitted when transaction is included in a block.
 *
 * Contains full details about the block inclusion including events emitted
 * during execution and the runtime outcome (success or failure).
 */
export interface TxInBlockEvent extends TxEventBase {
  kind: "InBlock" | "Finalized" | "FinalityTimeout";
  txHash: HexH256;
  blockHash: HexH256;
  blockNumber: number;
  txIndex: number;
  /** All events emitted during extrinsic execution */
  events: SbEventRecord[];
  /** Runtime execution outcome */
  outcome: RuntimeOutcome;
}

/**
 * Event emitted for non-fatal warnings during tracking.
 */
export interface TxWarningEvent extends TxEventBase {
  kind: "Retracted";
}

/**
 * Union type of all possible transaction events.
 *
 * Use the `kind` discriminator to narrow the type in TypeScript.
 */
export type TxEvent =
  | TxInternalErrorEvent
  | TxInvalidEvent
  | TxPoolEvent
  | TxEvictedEvent
  | TxInBlockEvent
  | TxWarningEvent;

/**
 * Generic error event emitted when tracking encounters an error.
 */
export interface ErrorEvent {
  kind: "Error";
  error: Error;
}

/**
 * Event map for ExtrinsicTracker emitter.
 *
 * Defines all possible events that can be emitted during transaction tracking.
 * The `status` event fires for all state changes, while specific events fire
 * for their respective states.
 */
export interface ExtrinsicTrackerEvents {
  /** Fires for any status update */
  status: TxEvent;
  /** Fires for errors during tracking */
  error: ErrorEvent;

  /** Transaction failed in submission/RPC pipeline */
  internalError: TxInternalErrorEvent;
  /** Transaction rejected by the pool */
  invalid: TxInvalidEvent;
  /** Transaction entered the pool */
  inPool: TxPoolEvent;
  /** Transaction included in a block */
  inBlock: TxInBlockEvent;
  /** Transaction removed from pool */
  evicted: TxEvictedEvent;
  /** Transaction block was finalized */
  finalized: TxInBlockEvent & { kind: "Finalized" };
  /** Finality timeout reached */
  finalityTimeout: TxInBlockEvent & { kind: "FinalityTimeout" };
  /** Non-fatal warning (e.g., retracted) */
  warning: TxWarningEvent;
}

/**
 * Interface for tracking an extrinsic through its lifecycle.
 *
 * Provides event-based monitoring of transaction status from submission to
 * finalization. Extends a subset of Emittery's interface for event handling.
 *
 * @example
 * ```ts
 * const tracker = await sendTxWithTracker(api, tx, signer);
 *
 * // Listen for specific events
 * tracker.on('inBlock', (event) => {
 *   console.log(`Transaction in block: ${event.blockHash}`);
 * });
 *
 * tracker.on('finalized', (event) => {
 *   console.log(`Transaction finalized: ${event.blockHash}`);
 *   tracker.cancel(); // Clean up resources
 * });
 *
 * // Or listen to all status updates
 * tracker.on('status', (event) => {
 *   console.log(`Status: ${event.kind}`);
 * });
 * ```
 */
export interface ExtrinsicTracker extends Pick<
  Emittery<ExtrinsicTrackerEvents>,
  "on" | "off" | "once" | "events"
> {
  /** Raw event emitter for advanced use cases */
  emitter: Emittery<ExtrinsicTrackerEvents>;

  // // We will ignore async iterator for now
  // stream: AsyncPushStream<ExtUpdate>;

  /** Cancels tracking and cleans up resources */
  cancel(): void;
}

/**
 * Error thrown when transaction submission fails.
 */
export class SendTxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SendTxError";
  }
}

/**
 * Submits an extrinsic to the chain with comprehensive lifecycle tracking.
 *
 * Creates an ExtrinsicTracker that emits events as the transaction progresses
 * through various states. The tracker handles all status updates from the
 * Polkadot.js API and transforms them into high-level events.
 *
 * @param _api - The Polkadot.js API instance
 * @param extrinsic - The extrinsic to submit
 * @param signer - The account or keypair to sign with
 * @param options - Optional Polkadot.js signAndSend options (nonce, era, etc.)
 * @returns Result with ExtrinsicTracker on success, SendTxError on failure
 *
 * @example
 * ```ts
 * import { isOk } from "@torus-network/torus-utils/result";
 *
 * const tx = api.tx.balances.transfer(recipient, amount);
 * const [error, tracker] = await sendTxWithTracker(api, tx, sender);
 *
 * if (error !== undefined) {
 *   console.error("Failed to submit:", error);
 *   return;
 * }
 *
 * // Track the transaction
 * tracker.on('inBlock', ({ blockHash, outcome }) => {
 *   if ("Success" in outcome) {
 *     console.log(`Success in block ${blockHash}`);
 *   } else {
 *     console.error("Runtime error:", outcome.Failed.error);
 *   }
 * });
 *
 * tracker.on('finalized', () => {
 *   console.log("Transaction finalized");
 *   tracker.cancel(); // Clean up
 * });
 * ```
 */
export async function sendTxWithTracker(
  _api: ApiPromise,
  extrinsic: SubmittableExtrinsic<"promise">,
  signer: Parameters<SubmittableExtrinsic<"promise">["signAndSend"]>[0],
  options?: Parameters<SubmittableExtrinsic<"promise">["signAndSend"]>[1],
): Promise<Result<ExtrinsicTracker, SendTxError>> {
  const emitter = new Emittery<ExtrinsicTrackerEvents>();

  // Promises for specific events
  // TODO: check promises for transaction events
  // const finality = defer<TxInBlockEvent & { kind: "Finalized" }>();

  // eslint-disable-next-line prefer-const
  let unsubscribeExt: (() => void) | undefined;

  // // -- Async iterator using AsyncPushStream --
  // const stream = new AsyncPushStream<TxEvent>();

  const teardown = () => {
    // stream.end();
    unsubscribeExt?.();
    emitter.clearListeners();
  };

  const updateHandler = async (rawResult: SubmittableResult) => {
    // Transform to high-level TxState
    const { txState, result } = parseSubmittableResult(rawResult);

    const baseEvent: TxEventBase = {
      extResultRaw: rawResult,
      extResult: result,
      txHash: rawResult.txHash.toHex(),
      txState,
    };
    const makeEvent = <E>(event: E) => ({
      ...baseEvent,
      ...event,
    });

    // Emits are stored in an array to ensure they are awaited before teardown
    const emits: Promise<void>[] = [];

    const doEmit = <K extends keyof ExtrinsicTrackerEvents>(
      kind: K,
      event: ExtrinsicTrackerEvents[K],
    ) => {
      if (event.kind !== "Error") {
        // stream.push(event);
        const emitRes1 = emitter.emit("status", event);
        emits.push(emitRes1);
      }
      const emitRes2 = emitter.emit(kind, event);
      emits.push(emitRes2);
    };

    const { terminal } = match(txState)<{ terminal: boolean }>({
      InternalError: ({ txHash, error }) => {
        const event: TxInternalErrorEvent = makeEvent({
          kind: "InternalError",
          txHash,
          internalError: error,
        });
        doEmit("internalError", event);
        // Internal error is terminal for the event stream
        return { terminal: true };
      },
      Invalid: ({ txHash, reason }) => {
        const event: TxInvalidEvent = makeEvent({
          kind: "Invalid",
          txHash,
          reason,
        });
        doEmit("invalid", event);
        // Invalid is terminal for the event stream
        return { terminal: true };
      },
      Pool: ({ txHash, kind }) => {
        const event: TxPoolEvent = makeEvent({
          txHash,
          kind,
        });
        doEmit("inPool", event);
        return { terminal: false };
      },
      Evicted: ({ txHash, kind }) => {
        const event: TxEvictedEvent = makeEvent({
          txHash,
          kind,
        });
        doEmit("evicted", event);
        // Evicted is terminal for the event stream
        return { terminal: true };
      },
      Included: ({
        kind,
        txHash,
        blockHash,
        blockNumber,
        txIndex,
        events,
        outcome,
      }) => {
        const event: TxInBlockEvent = makeEvent({
          kind,
          txHash,
          blockHash,
          blockNumber,
          txIndex,
          events,
          outcome,
        });

        switch (kind) {
          case "Finalized":
            doEmit("finalized", { ...event, kind });
            return { terminal: true };
          case "FinalityTimeout":
            doEmit("finalityTimeout", { ...event, kind });
            return { terminal: true };
          default:
            doEmit("inBlock", event);
            return { terminal: false };
        }
        throw new Error("Unreachable");
      },
      Warning: ({ txHash, kind }) => {
        const event: TxWarningEvent = makeEvent({
          txHash,
          kind,
        });
        doEmit("warning", event);
        return { terminal: false };
      },
    });

    // Handle teardown for terminal states
    if (terminal) {
      await Promise.all(emits);
      teardown();
    }
  };

  const [sendError, unsubscribeRes] = await tryAsync(
    extrinsic.signAndSend(signer, options ?? {}, updateHandler),
  );
  if (sendError !== undefined) {
    await emitter.emit("error", { kind: "Error", error: sendError });
    const txError = new SendTxError(
      sendError.message || "Failed to submit transaction",
    );
    return makeErr(txError);
  }

  unsubscribeExt = unsubscribeRes;

  const tracker: ExtrinsicTracker = {
    emitter,

    on: emitter.on.bind(emitter),
    once: emitter.once.bind(emitter),
    off: emitter.off.bind(emitter),
    events: emitter.events.bind(emitter),

    cancel() {
      teardown();
    },
  };

  return makeOk(tracker);
}
