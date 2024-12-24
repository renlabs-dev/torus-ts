import type { ApiPromise, SubmittableResult } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import type { DispatchError } from "@polkadot/types/interfaces";
import { toast } from "react-toastify";

import type { TransactionResult } from "../_types";
import type { TorusApiState } from "../torus-provider";

interface SendTransactionProps {
  api: ApiPromise | null;
  selectedAccount: InjectedAccountWithMeta | null;
  torusApi: TorusApiState;
  transactionType: string;
  transaction: SubmittableExtrinsic<"promise">;
  callback?: (result: TransactionResult) => void;
  refetchHandler?: () => Promise<void>;
}

export async function sendTransaction({
  api,
  selectedAccount,
  torusApi,
  transactionType,
  transaction,
  callback,
  refetchHandler,
}: SendTransactionProps): Promise<void> {
  if (!api || !selectedAccount || !torusApi.web3FromAddress) return;
  try {
    const injector = await torusApi.web3FromAddress(selectedAccount.address);
    await transaction.signAndSend(
      selectedAccount.address,
      { signer: injector.signer },
      (result: SubmittableResult) => {
        if (result.status.isInBlock) {
          callback?.({
            finalized: false,
            status: "PENDING",
            message: `${transactionType} in progress`,
          });
        }
        if (result.status.isFinalized) {
          const success = result.findRecord("system", "ExtrinsicSuccess");
          const failed = result.findRecord("system", "ExtrinsicFailed");

          if (success) {
            toast.success(`${transactionType} successful`);
            callback?.({
              finalized: true,
              status: "SUCCESS",
              message: `${transactionType} successful`,
            });
            if (refetchHandler) {
              void refetchHandler();
            }
            setTimeout(() => {
              callback?.({
                status: null,
                message: null,
                finalized: false,
              });
            }, 6000);
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

            toast.error(msg);
            callback?.({ finalized: true, status: "ERROR", message: msg });
          }
        }
      },
    );
  } catch (err) {
    toast.error(err as string);
  }
}
