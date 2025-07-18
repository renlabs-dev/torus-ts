import { merkleizeMetadata } from "@polkadot-api/merkleize-metadata";
import type { ApiPromise, SubmittableResult } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import type { DispatchError } from "@polkadot/types/interfaces";
import { u8aToHex } from "@polkadot/util";
<<<<<<< HEAD

import { CONSTANTS } from "@torus-network/sdk/constants";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

import { toast } from "@torus-ts/ui/hooks/use-toast";

import type { TransactionResult } from "../_types";
import type { TorusApiState } from "../torus-provider";
import { updateMetadata } from "../utils/chain-metadata";
import {
  renderFinalizedWithError,
  renderSuccessfulyFinalized,
  renderWaitingForValidation,
} from "./toast-content-handler";
=======
import { CONSTANTS } from "@torus-network/sdk";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";
import { toast } from "sonner";
import type { TransactionResult } from "../_types";
import type { TorusApiState } from "../torus-provider";
import { updateMetadata } from "../utils/metadata";
import { getExplorerLink } from "./toast-content-handler";
>>>>>>> e4da494e (feat: refactors transaction sending for better UX)

interface SendTransactionProps {
  api: ApiPromise | null;
  selectedAccount: InjectedAccountWithMeta | null;
  torusApi: TorusApiState;
  transactionType: string;
  transaction: SubmittableExtrinsic<"promise">;
  callback?: (result: TransactionResult) => void;
  refetchHandler?: () => Promise<void>;
  wsEndpoint: string;
}

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

// Helper function to create action button for explorer link
const createExplorerAction = (hash: string, wsEndpoint: string) => {
  return {
    label: "View on Block Explorer",
    onClick: () => window.open(getExplorerLink({ wsEndpoint, hash }), "_blank"),
  };
};

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
    toast.error("Missing required parameters for transaction");
    return;
  }

  // Get injector from address
  const [injectorError, injector] = await tryAsync(
    torusApi.web3FromAddress(selectedAccount.address),
  );
  if (injectorError !== undefined) {
    console.error("Error getting web3 injector:", injectorError);
    callback?.({
      finalized: true,
      status: "ERROR",
      message: injectorError.message || "Failed to connect to wallet",
    });
    toast.error(injectorError.message || "Failed to connect to wallet");
    return;
  }

  // Generate metadata proof
  const [proofError, proof] = await tryAsync(getMetadataProof(api));
  if (proofError !== undefined) {
    console.error("Error generating metadata proof:", proofError);
    callback?.({
      finalized: true,
      status: "ERROR",
      message: proofError.message || "Failed to generate metadata proof",
    });
    toast.error(proofError.message || "Failed to generate metadata proof");
    return;
  }

  const { metadataHash } = proof;

  // Update metadata for wallet
  const [metadataError] = await tryAsync(updateMetadata(api, [injector]));
  if (metadataError !== undefined) {
    console.error("Metadata update failed:", metadataError);
    callback?.({
      finalized: true,
      status: "ERROR",
      message: "Failed to update wallet metadata",
    });
    toast.error("Failed to update wallet metadata");
    return;
  }

  console.log("Metadata update successful");

  // Create transaction options
  const [optionsError, txOptions] = trySync(() => ({
    signer: injector.signer,
    tip: 0,
    nonce: -1,
    mode: 1, // mortal
    metadataHash,
    signedExtensions: api.registry.signedExtensions,
    withSignedTransaction: true,
  }));

  if (optionsError !== undefined) {
    console.error("Error creating transaction options:", optionsError);
    callback?.({
      finalized: true,
      status: "ERROR",
      message: "Failed to create transaction options",
    });
    toast.error("Failed to create transaction options");
    return;
  }

  // Create promise for transaction
  const transactionPromise = new Promise<{ hash: string; success: boolean }>(
    (resolve, reject) => {
      transaction
        .signAndSend(
          selectedAccount.address,
          txOptions,
          async (result: SubmittableResult) => {
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
            }

            if (result.status.isFinalized) {
              const success = result.findRecord("system", "ExtrinsicSuccess");
              const failed = result.findRecord("system", "ExtrinsicFailed");
              const hash = result.status.asFinalized.toHex();

              // Handle refetch
              if (refetchHandler) {
                const [refetchError] = await tryAsync(
                  Promise.resolve(refetchHandler()),
                );
                if (refetchError !== undefined) {
                  console.error("Error refetching data:", refetchError);
                  // Don't throw since transaction was successful
                }
              }

              callback?.({
                finalized: true,
                status: success ? "SUCCESS" : "ERROR",
                message: success
                  ? "Transaction completed successfully!"
                  : "Transaction failed",
                hash,
              });

              if (success) {
                resolve({ hash, success: true });
              } else if (failed) {
                // Handle dispatch error
                const [parseError, dispatchErrorArray] = trySync(
                  () => failed.event.data as unknown as [DispatchError],
                );

                if (parseError !== undefined) {
                  console.error("Error parsing dispatch error:", parseError);
                }

                const dispatchError = dispatchErrorArray?.[0];
                let errorMessage = `${transactionType} failed: ${dispatchError?.toString() ?? "Unknown error"}`;

                if (dispatchError?.isModule) {
                  const [moduleError, metaError] = trySync(() => {
                    const mod = dispatchError.asModule;
                    return api.registry.findMetaError(mod);
                  });

                  if (moduleError !== undefined) {
                    console.error("Error finding meta error:", moduleError);
                  } else {
                    errorMessage = `${transactionType} failed: ${metaError.name}`;
                  }
                }

                reject(new Error(errorMessage));
              } else {
                reject(new Error("Transaction failed with unknown error"));
              }
            }
          },
        )
        .catch((error: Error) => {
          console.error("Transaction error:", error);
          callback?.({
            finalized: true,
            status: "ERROR",
            message: error.message || "Transaction failed",
          });
          reject(error);
        });
    },
  );

  toast.promise(transactionPromise, {
    loading: "Processing transaction...",
    success: (data) => ({
      message: "",
      type: "success",
      description: `${transactionType} completed successfully`,
      duration: Infinity,
      action: createExplorerAction(data.hash, wsEndpoint),
      classNames: {
        icon: "mb-6",
        content: "mb-6",
      },
      actionButtonStyle: {
        position: "absolute",
        right: "0.5rem",
        bottom: "0.5rem",
        "&:hover": {
          backgroundColor: "var(--color-primary)",
        },
      },
    }),
    error: (error: Error) => ({
      message: "",
      type: "error",
      description: error.message || "Transaction failed with unknown error",
      duration: Infinity,
    }),
  });
}
