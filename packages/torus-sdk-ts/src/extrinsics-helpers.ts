// ==== UI helpers (we will IGNORE these for now) ====

import type { SubmittableResult } from "@polkadot/api";
import type { Enum } from "rustie";
import { match } from "rustie";

import type { SbExtrinsicStatus } from "./extrinsics.js";

// ---- Transaction / Extrinsic Status ----

/**
 * IGNORE.
 *
 * Represents a transaction being submitted to a Substrate network.
 */
export type TxStage = Enum<{
  Empty: null;
  Signing: null;
  Submitted: { result: SubmittableResult; extStatus: SbExtrinsicStatus }; // same parser you wrote
  Error: { error: Error };
}>;

/**
 * IGNORE.
 *
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

/**
 * IGNORE.
 */
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
