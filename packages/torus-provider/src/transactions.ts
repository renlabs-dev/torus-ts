import type { SubmittableResult } from "@polkadot/api";
import type { Enum } from "rustie";
import { match } from "rustie";
import type { z } from "zod";

import {
  sb_array,
  sb_enum,
  sb_h256,
  sb_null,
  sb_string,
} from "@torus-network/sdk";

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
  isSigning: boolean;
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
