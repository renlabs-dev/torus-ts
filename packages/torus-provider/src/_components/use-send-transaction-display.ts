import type { ApiPromise } from "@polkadot/api";
import type { Enum } from "rustie";
import { match } from "rustie";

import type { SbDispatchError, TxEvent } from "@torus-network/sdk/extrinsics";
import type { HexH256 } from "@torus-network/sdk/types";
import { trySync } from "@torus-network/torus-utils/try-catch";

// ==== Types (re-exported for use in display functions) ====

export type TxStage = Enum<{
  Idle: {
    extrinsic: null;
  };
  Signing: {
    extrinsic: unknown; // SubmittableExtrinsic<"promise">
  };
  Submitted: {
    event: TxEvent;
  };
  Error: {
    error: Error;
    txHash?: HexH256;
  };
}>;

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

// ==== Constants ====

export const TOAST_MESSAGES = {
  PREPARING: "Signing transaction...",
  READY: "Transaction signed and submitted to pool...",
  BROADCASTED: "Broadcasted transaction to peers...",
  IN_BLOCK: "Transaction included in block...",
  FINALIZING: "Waiting for finalization...",
  SUCCESS: "Transaction completed successfully",
  FAILED: "Transaction failed",
} as const;

// ==== Display Helper Functions ====

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
 * See {@link txStageToTxHelper}.
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

    // Module: ({ index, error: errorIndex }) => {
    Module: (error) => {
      // Try to resolve module error using registry
      if (api) {
        const [moduleError, metaError] = trySync(() => {
          // Use the simplified module error lookup
          // return api.registry.findMetaError({
          //   index: api.registry.createType("u8", index),
          //   error: api.registry.createType("u8", Number(errorIndex)),
          // });
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
          return api.registry.findMetaError(error as any);
        });
        if (moduleError !== undefined) {
          console.warn(moduleError);
        }

        if (moduleError === undefined) {
          const { section, name, docs } = metaError;
          const docString = docs.length > 0 ? ` - ${docs.join(" ")}` : "";
          return `${prefix}${section}.${name}${docString}`;
        }
      }

      // Fallback to generic module error

      // return `${prefix}Module error ${index}.${errorIndex}`;

      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      return `${prefix}Module error ${String(error)}`;
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
