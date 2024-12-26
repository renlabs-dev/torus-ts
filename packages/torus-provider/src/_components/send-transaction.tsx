import type { ApiPromise, SubmittableResult } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import type { DispatchError } from "@polkadot/types/interfaces";
import { toast } from "react-toastify";

import type { TransactionResult } from "../_types";
import type { TorusApiState } from "../torus-provider";
import {
  renderSuccessfulyFinalized,
  renderFinalizedWithError,
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
  if (!api || !selectedAccount || !torusApi.web3FromAddress) return;

  const toastId = `${selectedAccount.address}:${transactionType}`;

  try {
    const injector = await torusApi.web3FromAddress(selectedAccount.address);

    await transaction.signAndSend(
      selectedAccount.address,
      { signer: injector.signer },
      (result: SubmittableResult) => {
        if (result.status.isReady) {
          callback?.({
            finalized: false,
            status: "PENDING",
            message: `Your transaction is ready to be sent`,
          });
        }

        if (result.status.isBroadcast) {
          callback?.({
            finalized: false,
            status: "PENDING",
            message: `Your transaction is being broadcasted`,
          });
        }

        if (result.status.isInBlock) {
          callback?.({
            finalized: false,
            status: "SUCCESS",
            message: `Your transaction has been included into the block`,
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

              if (error.section && error.name) {
                msg = `${transactionType} failed: ${error.name}`;
              }
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
    toast.error(err as string);
  }
}
