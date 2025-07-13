import { useEffect, useState } from "react";

import { merkleizeMetadata } from "@polkadot-api/merkleize-metadata";
import type { ApiPromise, SubmittableResult } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { InjectedExtension } from "@polkadot/extension-inject/types";
import type { ISubmittableResult } from "@polkadot/types/types";
import { u8aToHex } from "@polkadot/util";
import type { Enum } from "rustie";
import { match } from "rustie";
import type { z } from "zod";

import {
  CONSTANTS,
  sb_array,
  sb_enum,
  sb_h256,
  sb_null,
  sb_string,
} from "@torus-network/sdk";
import { chainErr } from "@torus-network/torus-utils/error";
import type { BaseLogger } from "@torus-network/torus-utils/logger";
import type { Result } from "@torus-network/torus-utils/result";
import { makeErr, makeOk } from "@torus-network/torus-utils/result";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

import type { InjectedAccountWithMeta } from "../torus-provider";
import { updateMetadata } from "../utils/metadata";

/**
 * TODO: Refactor `getMetadataProof`
 */
async function getMetadataProof(api: ApiPromise) {
  // Get metadata from API
  const [metadataError, metadata] = await tryAsync(
    api.call.metadata.metadataAtVersion(15),
  );
  if (metadataError !== undefined) {
    console.error("Error getting metadata:", metadataError);
    throw metadataError;
  }

  // Get runtime information
  const [runtimeError, runtimeInfo] = trySync(() => {
    const { specName, specVersion } = api.runtimeVersion;
    return { specName, specVersion };
  });

  if (runtimeError !== undefined) {
    console.error("Error getting runtime information:", runtimeError);
    throw runtimeError;
  }

  const { specName, specVersion } = runtimeInfo;

  // Convert metadata to hex and merkleize it
  const [merkleError, merkleizedMetadata] = trySync(() =>
    merkleizeMetadata(metadata.toHex(), {
      base58Prefix: api.consts.system.ss58Prefix.toNumber(),
      decimals: CONSTANTS.EMISSION.DECIMALS,
      specName: specName.toString(),
      specVersion: specVersion.toNumber(),
      tokenSymbol: "TORUS",
    }),
  );

  if (merkleError !== undefined) {
    console.error("Error merkleizing metadata:", merkleError);
    throw merkleError;
  }

  // Get hash from merkleized metadata
  const [hashError, metadataHash] = trySync(() =>
    u8aToHex(merkleizedMetadata.digest()),
  );

  if (hashError !== undefined) {
    console.error("Error generating metadata hash:", hashError);
    throw hashError;
  }

  console.log("Generated metadata hash:", metadataHash);

  return {
    metadataHash,
    merkleizedMetadata,
  };
}

// export interface ExtrinsicStatus extends Enum {
//   readonly isFuture: boolean;
//   readonly isReady: boolean;
//   readonly isBroadcast: boolean;
//   readonly asBroadcast: Vec<Text>;
//   readonly isInBlock: boolean;
//   readonly asInBlock: Hash;
//   readonly isRetracted: boolean;
//   readonly asRetracted: Hash;
//   readonly isFinalityTimeout: boolean;
//   readonly asFinalityTimeout: Hash;
//   readonly isFinalized: boolean;
//   readonly asFinalized: Hash;
//   readonly isUsurped: boolean;
//   readonly asUsurped: Hash;
//   readonly isDropped: boolean;
//   readonly isInvalid: boolean;
//   readonly type: 'Future' | 'Ready' | 'Broadcast' | 'InBlock' | 'Retracted' | 'FinalityTimeout' | 'Finalized' | 'Usurped' | 'Dropped' | 'Invalid';
// }

// const sb_hash =

export type HexH256 = z.infer<typeof sb_h256>;

/**
 * Transitions:
 *   Submit -> [Invalid] | Future | Ready
 *   Future -> Ready
 *   Ready -> Broadcast | [Dropped] | [Usurped] | InBlock
 *   Broadcast -> InBlock
 *   InBlock -> [Finalized] | Retracted | [FinalityTimeout]
 *   Retracted -> Ready
 *
 * TODO: Test `sb_extrinsic_status`
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

/**
 * Extrinsic statuses grouping:
 *
 *   | Group      | Description                          | Statuses                                   |
 *   |------------|--------------------------------------|------------------------------------------  |
 *   | Submitting | Before submitting to node            |                                            |
 *   | Pending    | Validated and waiting for inclusion  | Future, Ready, Broadcast                   |
 *   | Success    | Included in block                    | InBlock, Finalized                         |
 *   | Error      | Transaction failed                   | Invalid, Dropped, Usurped, FinalityTimeout |
 *   | Reverted   | Was included in block but reverted   | Retracted                                 |
 */
export type TransactionResult = Enum<{
  Submitting: null;
  Pending: Enum<{ Future: null; Ready: null; Broadcast: string[] }>;
  Success: Enum<{ InBlock: HexH256; Finalized: HexH256 }>;
  Error: Enum<{
    Invalid: null;
    Dropped: null;
    Usurped: HexH256;
    FinalityTimeout: null;
  }>;
  Reverted: Enum<{ Retracted: HexH256 }>;
}>;

function sbTxStatusToTxResult(extStatus: SbExtrinsicStatus): TransactionResult {
  return match(extStatus)<TransactionResult>({
    Future: () => ({
      Pending: {
        Future: null,
      },
    }),
    Ready: () => ({
      Pending: {
        Ready: null,
      },
    }),
    Broadcast: (xs) => ({
      Pending: {
        Broadcast: xs,
      },
    }),
    InBlock: (hash) => ({
      Success: {
        InBlock: hash,
      },
    }),
    Retracted: (hash) => ({
      Reverted: {
        Retracted: hash,
      },
    }),
    FinalityTimeout: () => ({
      Error: {
        FinalityTimeout: null,
      },
    }),
    Finalized: (xs) => ({
      Success: {
        Finalized: xs,
      },
    }),
    Invalid: () => ({
      Error: {
        Invalid: null,
      },
    }),
    Usurped: (hash) => ({
      Error: {
        Usurped: hash,
      },
    }),
    Dropped: () => ({
      Error: {
        Dropped: null,
      },
    }),
  });
}

type SendTxFn = <T extends ISubmittableResult>(
  tx: SubmittableExtrinsic<"promise", T>,
) => Promise<void>;

type SendTxState = Enum<{
  Init: null;
  Sendable: {
    send: SendTxFn;
  };
  Sent: { txResult: TransactionResult };
  Error: { message: string; error?: Error };
}>;

export function useSendTransaction({
  api,
  wsEndpoint,
  injector,
  metadataHash,
  selectedAccount,
  logger,
}: {
  api: ApiPromise | null;
  wsEndpoint: string | null;
  injector: InjectedExtension | null;
  metadataHash: `0x${string}` | null;
  selectedAccount: InjectedAccountWithMeta | null;
  logger: BaseLogger;
}) {
  const [sendTxState, setSendTxState] = useState<SendTxState>({ Init: null });

  const onErr = (errMsg: string, err?: Error) => {
    logger.error(errMsg, err);
    setSendTxState({ Error: { message: errMsg, error: err } });
  };

  useEffect(() => {
    if (!api || !wsEndpoint || !injector || !metadataHash) {
      onErr("Inconsistent internal state for transaction");
      return;
    }

    const [txOptionsError, txOptions] = trySync(() => ({
      signer: injector.signer,
      tip: 0,
      nonce: -1,
      mode: 1, // mortal
      metadataHash,
      signedExtensions: api.registry.signedExtensions,
      withSignedTransaction: true,
    }));
    if (txOptionsError !== undefined) {
      const err = chainErr("Failed to create transaction options")(
        txOptionsError,
      );
      onErr("Failed to create transaction options", err);
      return;
    }

    const doSend = async <T extends ISubmittableResult>(
      tx: SubmittableExtrinsic<"promise", T>,
    ) => {
      if (!selectedAccount) {
        setSendTxState({ Error: { message: "No account selected" } });
        return;
      }

      // TODO: improve state handling

      // match(sendTxState)({
      //   Init: () => {
      //     // setSendTxState({ Error: { message: "Wallet not initialized" } });
      //   },
      //   Sent: () => {
      //     // setSendTxState({ Error: { message: "Transaction already sent" } });
      //   },
      //   Error: () => {
      //     // setSendTxState({ Error: { message: "Transaction already failed" } });
      //   },
      //   Sendable: () => {},
      // });

      // TODO: check _idk
      const _idk = await tx.signAndSend(
        selectedAccount.address,
        txOptions,
        (result: SubmittableResult) => {
          const { success, data: extStatus } = sb_extrinsic_status.safeParse(
            result.status,
          );
          if (!success) {
            console.error("Failed to parse extrinsic status:", extStatus);
            return;
          }
          const txResult = sbTxStatusToTxResult(extStatus);
          setSendTxState({
            Sent: { txResult },
          });
        },
      );
    };

    setSendTxState({ Sendable: { send: doSend } });
  });

  return sendTxState;
}

/*
interface SendTransactionProps {
  api: ApiPromise | null;
  selectedAccount: InjectedAccountWithMeta | null;
  torusApi: TorusApiState;
  transactionType: string;
  transaction: SubmittableExtrinsic<"promise">;
  callback?: (result: TransactionResult) => void;
  refetchHandler?: () => Promise<void>;
  wsEndpoint: string;
  toast: typeof toast;
}
*/

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

  const [proofError, proof] = await tryAsync(getMetadataProof(api));
  if (proofError !== undefined) {
    const err = chainErr("Failed to generate metadata proof")(proofError);
    return makeErr(err);
  }

  const { metadataHash } = proof;

  return makeOk({ injector, metadataHash });
};

interface UseWalletArgs {
  api: ApiPromise | null;
  selectedAccount: InjectedAccountWithMeta | null;
  web3FromAddress: ((address: string) => Promise<InjectedExtension>) | null;
  logger: BaseLogger;
}

export const useWallet = ({
  api,
  selectedAccount,
  web3FromAddress,
  logger,
}: UseWalletArgs) => {
  const [wallet, setWallet] = useState<{
    injector: InjectedExtension;
    metadataHash: `0x${string}`;
  } | null>(null);

  useEffect(() => {
    if (!api || !selectedAccount || !web3FromAddress) {
      logger.error("Inconsistent internal state for transaction");
      return;
    }

    const run = async () => {
      const [walletSetupError, walletSetup] = await setupWallet({
        api,
        selectedAccount,
        web3FromAddress,
      });

      if (walletSetupError !== undefined) {
        logger.error(
          "Failed to setup wallet for transactions:",
          walletSetupError,
        );
        return;
      }

      setWallet(walletSetup);

      const { injector } = walletSetup;

      // Update chain metadata
      // TODO: refactor, do this only once for wallet/app instance
      const [metadataError] = await tryAsync(updateMetadata(api, [injector]));
      if (metadataError !== undefined) {
        logger.error("Failed to update chain metadata", metadataError);
      }
    };

    run().catch((e) => logger.error("Unexpected error setting up wallet:", e));
  }, [api, selectedAccount, web3FromAddress, logger]);

  return wallet;
};
