import { merkleizeMetadata } from "@polkadot-api/merkleize-metadata";
import type { ApiPromise, SubmittableResult } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import type { DispatchError } from "@polkadot/types/interfaces";
import { u8aToHex } from "@polkadot/util";
import { CONSTANTS } from "@torus-network/sdk";
import { toast } from "@torus-ts/ui/hooks/use-toast";
// React is needed for JSX even if not directly referenced
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as React from "react";
import type { TransactionResult } from "../_types";
import type { TorusApiState } from "../torus-provider";
import { updateMetadata } from "../utils/metadata";
import {
  renderFinalizedWithError,
  renderSuccessfulyFinalized,
  renderWaitingForValidation,
} from "./toast-content-handler";

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

async function getMetadataProof(api: ApiPromise) {
  const metadata = await api.call.metadata.metadataAtVersion(15);
  const { specName, specVersion } = api.runtimeVersion;

  const merkleizedMetadata = merkleizeMetadata(metadata.toHex(), {
    base58Prefix: api.consts.system.ss58Prefix.toNumber(),
    decimals: CONSTANTS.EMISSION.DECIMALS,
    specName: specName.toString(),
    specVersion: specVersion.toNumber(),
    tokenSymbol: "TORUS",
  });

  const metadataHash = u8aToHex(merkleizedMetadata.digest());
  console.log("Generated metadata hash:", metadataHash);

  return {
    metadataHash,
    merkleizedMetadata,
  };
}

export async function sendTransaction({
  api,
  selectedAccount,
  torusApi,
  transactionType,
  transaction,
  callback,
  refetchHandler,
  wsEndpoint,
}: SendTransactionProps): Promise<void> {
  if (!api || !selectedAccount || !torusApi.web3FromAddress) {
    console.error("Missing required parameters");
    return;
  }

  try {
    const injector = await torusApi.web3FromAddress(selectedAccount.address);

    // Generate metadata proof for all transactions
    const { metadataHash } = await getMetadataProof(api);

    // Update metadata for all wallets
    try {
      await updateMetadata(api, [injector]);
      console.log("Metadata update successful");
    } catch (metadataError) {
      console.error("Metadata update failed:", metadataError);
      throw new Error("Failed to update wallet metadata");
    }

    const txOptions = {
      signer: injector.signer,
      tip: 0,
      nonce: -1,
      mode: 1, //  mortal
      metadataHash,
      signedExtensions: api.registry.signedExtensions,
      withSignedTransaction: true,
    };

    await transaction.signAndSend(
      selectedAccount.address,
      txOptions,
      (result: SubmittableResult) => {
        if (result.status.isReady) {
          callback?.({
            finalized: false,
            status: "PENDING",
            message: "Transaction prepared and ready to send",
          });
        }

        if (result.status.isBroadcast) {
          callback?.({
            finalized: false,
            status: "PENDING",
            message: "Broadcasting your transaction to the network...",
          });
        }

        if (result.status.isInBlock) {
          callback?.({
            finalized: false,
            status: "SUCCESS",
            message: "Transaction included in the blockchain!",
          });

          toast({
            title: "Loading...",
            description: renderWaitingForValidation(
              result.status.asInBlock.toHex(),
              wsEndpoint,
            ),
            duration: Infinity,
          });
        }

        if (result.status.isFinalized) {
          const success = result.findRecord("system", "ExtrinsicSuccess");
          const failed = result.findRecord("system", "ExtrinsicFailed");
          const hash = result.status.asFinalized.toHex();

          if (refetchHandler) {
            void refetchHandler();
          }

          callback?.({
            finalized: true,
            status: success ? "SUCCESS" : "ERROR",
            message: success
              ? "Transaction completed successfully!"
              : "Transaction failed",
          });

          if (success) {
            toast({
              title: "Success!",
              description: renderSuccessfulyFinalized(
                transactionType,
                hash,
                wsEndpoint,
              ),
            });
          } else if (failed) {
            const [dispatchError] = failed.event.data as unknown as [
              DispatchError,
            ];
            let msg = `${transactionType} failed: ${dispatchError.toString()}`;

            if (dispatchError.isModule) {
              const mod = dispatchError.asModule;
              const error = api.registry.findMetaError(mod);
              msg = `${transactionType} failed: ${error.name}`;
            }

            toast({
              title: "Error",
              description: renderFinalizedWithError(msg, hash, wsEndpoint),
            });
          }
        }
      },
    );
  } catch (err) {
    console.error("Transaction error:", err);

    callback?.({
      finalized: true,
      status: "ERROR",
      message: err instanceof Error ? err.message : "Transaction failed",
    });

    toast({
      title: "Error",
      description: err instanceof Error ? err.message : "Transaction failed",
    });
  }
}
