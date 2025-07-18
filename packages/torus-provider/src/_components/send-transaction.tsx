import { merkleizeMetadata } from "@polkadot-api/merkleize-metadata";
import type { ApiPromise, SubmittableResult } from "@polkadot/api";
import type { SignerOptions, SubmittableExtrinsic } from "@polkadot/api/types";
import type {
  InjectedAccountWithMeta,
  InjectedExtension,
} from "@polkadot/extension-inject/types";
import type { DispatchError, EventRecord } from "@polkadot/types/interfaces";
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
<<<<<<< HEAD
import { getExplorerLink } from "./toast-content-handler";
>>>>>>> e4da494e (feat: refactors transaction sending for better UX)
=======

const METADATA_VERSION = 15;
const TRANSACTION_MODE = 1; // mortal
const TRANSACTION_TIP = 0;
const TRANSACTION_NONCE = -1;
const TOKEN_SYMBOL = "TORUS";

const TOAST_MESSAGES = {
  PREPARING: "Preparing transaction...",
  READY: "Transaction ready, waiting for signature...",
  BROADCASTING: "Broadcasting transaction to the network...",
  IN_BLOCK: "Transaction included in block, waiting for finalization...",
  SUCCESS: "Transaction completed successfully",
  FAILED: "Transaction failed with unknown error",
} as const;

const ERROR_MESSAGES = {
  MISSING_PARAMETERS: "Missing required parameters for transaction",
  WALLET_CONNECTION_FAILED: "Failed to connect to wallet",
  METADATA_PROOF_FAILED: "Failed to generate metadata proof",
  METADATA_UPDATE_FAILED: "Failed to update wallet metadata",
  TRANSACTION_OPTIONS_FAILED: "Failed to create transaction options",
  TRANSACTION_FAILED: "Transaction failed",
} as const;

interface MetadataProof {
  metadataHash: string;
  merkleizedMetadata: ReturnType<typeof merkleizeMetadata>;
}

interface TransactionExecutionResult {
  hash: string;
  success: boolean;
}
>>>>>>> f7a125d3 (feat: implements transaction sending functionality)

interface SendTransactionProps {
  api: ApiPromise;
  selectedAccount: InjectedAccountWithMeta;
  torusApi: TorusApiState;
  transactionType: string;
  transaction: SubmittableExtrinsic<"promise">;
  callback?: (result: TransactionResult) => void;
  refetchHandler?: () => Promise<void>;
  wsEndpoint: string;
}

export function getExplorerLink({
  wsEndpoint,
  hash,
}: {
  wsEndpoint: string;
  hash: string;
}) {
  return `https://polkadot.js.org/apps/?rpc=${wsEndpoint}#/explorer/query/${hash}`;
}

async function generateMetadataProof(api: ApiPromise): Promise<MetadataProof> {
  const metadata = await getApiMetadata(api);
  const runtimeInfo = getRuntimeInfo(api);
  const merkleizedMetadata = createMerkleizedMetadata(
    api,
    metadata,
    runtimeInfo,
  );
  const metadataHash = generateMetadataHash(merkleizedMetadata);

  console.log("Generated metadata hash:", metadataHash);

  return { metadataHash, merkleizedMetadata };
}

async function getApiMetadata(api: ApiPromise) {
  const [metadataError, metadata] = await tryAsync(
    api.call.metadata.metadataAtVersion(METADATA_VERSION),
  );

  if (metadataError !== undefined) {
    console.error("Error getting metadata:", metadataError);
    throw metadataError;
  }

  return metadata;
}

function getRuntimeInfo(api: ApiPromise) {
  const [runtimeError, runtimeInfo] = trySync(() => {
    const { specName, specVersion } = api.runtimeVersion;
    return { specName, specVersion };
  });

  if (runtimeError !== undefined) {
    console.error("Error getting runtime information:", runtimeError);
    throw runtimeError;
  }

  return runtimeInfo;
}

function createMerkleizedMetadata(
  api: ApiPromise,
  metadata: Awaited<ReturnType<typeof getApiMetadata>>,
  runtimeInfo: ReturnType<typeof getRuntimeInfo>,
) {
  const [merkleError, merkleizedMetadata] = trySync(() =>
    merkleizeMetadata(metadata.toHex(), {
      base58Prefix: api.consts.system.ss58Prefix.toNumber(),
      decimals: CONSTANTS.EMISSION.DECIMALS,
      specName: runtimeInfo.specName.toString(),
      specVersion: runtimeInfo.specVersion.toNumber(),
      tokenSymbol: TOKEN_SYMBOL,
    }),
  );

  if (merkleError !== undefined) {
    console.error("Error merkleizing metadata:", merkleError);
    throw merkleError;
  }

  return merkleizedMetadata;
}

function generateMetadataHash(
  merkleizedMetadata: ReturnType<typeof merkleizeMetadata>,
) {
  const [hashError, metadataHash] = trySync(() =>
    u8aToHex(merkleizedMetadata.digest()),
  );

  if (hashError !== undefined) {
    console.error("Error generating metadata hash:", hashError);
    throw hashError;
  }

  return metadataHash;
}

function createTransactionOptions(
  injector: InjectedExtension,
  metadataHash: string,
  api: ApiPromise,
) {
  const [optionsError, txOptions] = trySync(() => ({
    signer: injector.signer,
    tip: TRANSACTION_TIP,
    nonce: TRANSACTION_NONCE,
    mode: TRANSACTION_MODE,
    metadataHash,
    signedExtensions: api.registry.signedExtensions,
    withSignedTransaction: true,
  }));

  if (optionsError !== undefined) {
    console.error("Error creating transaction options:", optionsError);
    throw optionsError;
  }

  return txOptions;
}

function createExplorerAction(hash: string, wsEndpoint: string) {
  return {
    label: "View on Block Explorer",
    onClick: () => window.open(getExplorerLink({ wsEndpoint, hash }), "_blank"),
  };
}

function parseTransactionError(
  failed: EventRecord | undefined,
  api: ApiPromise,
  transactionType: string,
): string {
  const [parseError, dispatchErrorArray] = trySync(
    () => failed?.event.data as unknown as [DispatchError],
  );

  if (parseError !== undefined) {
    console.error("Error parsing dispatch error:", parseError);
    return `${transactionType} failed: Unknown error`;
  }

  const dispatchError = dispatchErrorArray[0];
  let errorMessage = `${transactionType} failed: ${dispatchError.toString() || "Unknown error"}`;

  if (dispatchError.isModule) {
    const [moduleError, metaError] = trySync(() => {
      const mod = dispatchError.asModule;
      return api.registry.findMetaError(mod);
    });

    if (moduleError === undefined) {
      errorMessage = `${transactionType} failed: ${metaError.name}`;
    }
  }

  return errorMessage;
}

function showTransactionResultToast(
  toastId: string | number,
  success: boolean,
  failed: EventRecord | undefined,
  hash: string,
  transactionType: string,
  wsEndpoint: string,
  api: ApiPromise,
) {
  if (success) {
    toast.success("", {
      id: toastId,
      description: `${transactionType} ${TOAST_MESSAGES.SUCCESS}`,
      duration: Infinity,
      action: createExplorerAction(hash, wsEndpoint),
      classNames: {
        icon: "mb-6",
        content: "mb-6",
      },
      actionButtonStyle: {
        position: "absolute",
        right: "0.5rem",
        bottom: "0.5rem",
      },
    });
  } else {
    const errorMessage = failed
      ? parseTransactionError(failed, api, transactionType)
      : TOAST_MESSAGES.FAILED;

    toast.error("", {
      id: toastId,
      description: errorMessage,
      duration: Infinity,
    });
  }
}

function handleTransactionStatus(
  result: SubmittableResult,
  toastId: string | number,
  callback?: (result: TransactionResult) => void,
) {
  if (result.status.isReady) {
    toast.loading(TOAST_MESSAGES.READY, { id: toastId });
    callback?.({
      finalized: false,
      status: "PENDING",
      message: "Transaction prepared and ready to send",
    });
  }

  if (result.status.isBroadcast) {
    toast.loading(TOAST_MESSAGES.BROADCASTING, { id: toastId });
    callback?.({
      finalized: false,
      status: "PENDING",
      message: "Broadcasting your transaction to the network...",
    });
  }

  if (result.status.isInBlock) {
    toast.loading(TOAST_MESSAGES.IN_BLOCK, { id: toastId });
    callback?.({
      finalized: false,
      status: "SUCCESS",
      message: "Transaction included in the blockchain!",
    });
  }
}

async function handleTransactionRefetch(refetchHandler?: () => Promise<void>) {
  if (!refetchHandler) return;

  const [refetchError] = await tryAsync(Promise.resolve(refetchHandler()));
  if (refetchError !== undefined) {
    console.error("Error refetching data:", refetchError);
    // Don't throw since transaction was successful
  }
}

async function executeTransaction(
  transaction: SubmittableExtrinsic<"promise">,
  selectedAccount: InjectedAccountWithMeta,
  txOptions: Partial<SignerOptions>,
  transactionType: string,
  wsEndpoint: string,
  api: ApiPromise,
  callback?: (result: TransactionResult) => void,
  refetchHandler?: () => Promise<void>,
): Promise<TransactionExecutionResult> {
  return new Promise<TransactionExecutionResult>((resolve, reject) => {
    const toastId = toast.loading(TOAST_MESSAGES.PREPARING);

    transaction
      .signAndSend(
        selectedAccount.address,
        txOptions,
        async (result: SubmittableResult) => {
          handleTransactionStatus(result, toastId, callback);

          if (result.status.isFinalized) {
            const success = result.findRecord("system", "ExtrinsicSuccess");
            const failed = result.findRecord("system", "ExtrinsicFailed");
            const hash = result.status.asFinalized.toHex();

            await handleTransactionRefetch(refetchHandler);

            callback?.({
              finalized: true,
              status: success ? "SUCCESS" : "ERROR",
              message: success
                ? "Transaction completed successfully!"
                : "Transaction failed",
              hash,
            });

            showTransactionResultToast(
              toastId,
              !!success,
              failed,
              hash,
              transactionType,
              wsEndpoint,
              api,
            );

            if (success) {
              resolve({ hash, success: true });
            } else {
              const errorMessage = failed
                ? parseTransactionError(failed, api, transactionType)
                : TOAST_MESSAGES.FAILED;
              reject(new Error(errorMessage));
            }
          }
        },
      )
      .catch((error: Error) => {
        console.error("Transaction error:", error);

        toast.error("", {
          id: toastId,
          description: error.message || ERROR_MESSAGES.TRANSACTION_FAILED,
          duration: Infinity,
        });

        callback?.({
          finalized: true,
          status: "ERROR",
          message: error.message || ERROR_MESSAGES.TRANSACTION_FAILED,
        });

        reject(error);
      });
  });
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
  if (!torusApi.web3FromAddress) {
    console.error("Missing required parameters");
    toast.error(ERROR_MESSAGES.MISSING_PARAMETERS);
    return;
  }

  const [injectorError, injector] = await tryAsync(
    torusApi.web3FromAddress(selectedAccount.address),
  );
  if (injectorError !== undefined) {
    console.error("Error getting web3 injector:", injectorError);
    const errorMessage =
      injectorError.message || ERROR_MESSAGES.WALLET_CONNECTION_FAILED;

    callback?.({
      finalized: true,
      status: "ERROR",
      message: errorMessage,
    });
    toast.error(errorMessage);
    return;
  }

  const [proofError, proof] = await tryAsync(generateMetadataProof(api));
  if (proofError !== undefined) {
    console.error("Error generating metadata proof:", proofError);
    const errorMessage =
      proofError.message || ERROR_MESSAGES.METADATA_PROOF_FAILED;

    callback?.({
      finalized: true,
      status: "ERROR",
      message: errorMessage,
    });
    toast.error(errorMessage);
    return;
  }

  // Update wallet metadata
  const [metadataError] = await tryAsync(updateMetadata(api, [injector]));
  if (metadataError !== undefined) {
    console.error("Metadata update failed:", metadataError);

    callback?.({
      finalized: true,
      status: "ERROR",
      message: ERROR_MESSAGES.METADATA_UPDATE_FAILED,
    });
    toast.error(ERROR_MESSAGES.METADATA_UPDATE_FAILED);
    return;
  }

  console.log("Metadata update successful");

  const [optionsError, txOptions] = trySync(() =>
    createTransactionOptions(injector, proof.metadataHash, api),
  );
  if (optionsError !== undefined) {
    console.error("Error creating transaction options:", optionsError);

    callback?.({
      finalized: true,
      status: "ERROR",
      message: ERROR_MESSAGES.TRANSACTION_OPTIONS_FAILED,
    });
    toast.error(ERROR_MESSAGES.TRANSACTION_OPTIONS_FAILED);
    return;
  }

  const [executionError] = await tryAsync(
    executeTransaction(
      transaction,
      selectedAccount,
      txOptions,
      transactionType,
      wsEndpoint,
      api,
      callback,
      refetchHandler,
    ),
  );
  if (executionError !== undefined) {
    console.error("Error executing transaction:", executionError);
    const errorMessage =
      executionError.message || ERROR_MESSAGES.TRANSACTION_FAILED;

    callback?.({
      finalized: true,
      status: "ERROR",
      message: errorMessage,
    });
    toast.error(errorMessage);
  }
}
