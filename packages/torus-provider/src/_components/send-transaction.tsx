import type { TransactionResult } from "../_types";
import type { TorusApiState } from "../torus-provider";
import { updateMetadata } from "../utils/metadata";
import {
  renderSuccessfulyFinalized,
  renderFinalizedWithError,
  renderWaitingForValidation,
} from "./toast-content-handler";
import { merkleizeMetadata } from "@polkadot-api/merkleize-metadata";
import type { ApiPromise, SubmittableResult } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import type { DispatchError } from "@polkadot/types/interfaces";
import { u8aToHex } from "@polkadot/util";
import { toast } from "react-toastify";

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
  const metadata = await api.call.metadata.metadataAtVersion(15);
  const { specName, specVersion } = api.runtimeVersion;

  const merkleizedMetadata = merkleizeMetadata(metadata.toHex(), {
    base58Prefix: api.consts.system.ss58Prefix.toNumber(),
    decimals: 18,
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
  const toastId = `${selectedAccount.address}:${transactionType}`;

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

          toast.loading(
            renderWaitingForValidation(
              result.status.asInBlock.toHex(),
              wsEndpoint,
            ),
            {
              toastId,
              type: "default",
              autoClose: false,
              closeOnClick: false,
            },
          );

          setTimeout(() => {
            callback?.({
              status: null,
              message: null,
              finalized: false,
            });
          }, 6000);
        }

        if (result.status.isFinalized) {
          const success = result.findRecord("system", "ExtrinsicSuccess");
          const failed = result.findRecord("system", "ExtrinsicFailed");
          const hash = result.status.asFinalized.toHex();

          if (refetchHandler) {
            void refetchHandler();
          }

          if (success) {
            toast.update(toastId, {
              render: renderSuccessfulyFinalized(
                transactionType,
                hash,
                wsEndpoint,
              ),
              type: "success",
              isLoading: false,
              autoClose: 10000,
              closeOnClick: false,
              pauseOnHover: true,
              draggable: true,
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

            toast.update(toastId, {
              render: renderFinalizedWithError(msg, hash, wsEndpoint),
              type: "error",
              isLoading: false,
              autoClose: false,
              closeOnClick: false,
              pauseOnHover: true,
              draggable: true,
            });
          }
        }
      },
    );
  } catch (err) {
    console.error("Transaction error:", err);
    toast.error(err instanceof Error ? err.message : "Transaction failed");
  }
}
