import { useEffect, useMemo, useState } from "react";

import type { ApiPromise, SubmittableResult } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { InjectedExtension } from "@polkadot/extension-inject/types";
import type { DispatchError } from "@polkadot/types/interfaces";
import type { ISubmittableResult } from "@polkadot/types/types";
import { match } from "rustie";

import { chainErr } from "@torus-network/torus-utils/error";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import type { Result } from "@torus-network/torus-utils/result";
import { makeErr, makeOk } from "@torus-network/torus-utils/result";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

import { toast } from "@torus-ts/ui/hooks/use-toast";

import type { InjectedAccountWithMeta } from "../torus-provider";
import type { TxHelper, TxStage } from "../transactions";
import { sb_extrinsic_status, txStatusToTxHelper } from "../transactions";
import { getMerkleizedMetadata, updateMetadata } from "../utils/chain-metadata";

const strErr = (txt: string) => new Error(txt);

export const getExplorerLink = ({
  wsEndpoint,
  hash,
}: {
  wsEndpoint: string;
  hash: string;
}) => `https://polkadot.js.org/apps/?rpc=${wsEndpoint}#/explorer/query/${hash}`;

const TOAST_MESSAGES = {
  PREPARING: "Preparing transaction...",
  READY: "Transaction ready, waiting for signature...",
  BROADCASTING: "Broadcasting transaction to the network...",
  IN_BLOCK: "Transaction included in block...",
  FINALIZING: "Waiting for finalization...",
  SUCCESS: "Transaction completed successfully",
  FAILED: "Transaction failed with unknown error",
} as const;

export type SendTxFn = <T extends ISubmittableResult>(
  tx: SubmittableExtrinsic<"promise", T>,
) => Promise<void>;

interface UseSendTxOutput extends TxHelper {
  txStage: TxStage;
  sendTx: SendTxFn | null;
}

const logger = BasicLogger.create({ name: "use-send-transaction" });

export function useSendTransaction({
  api,
  wsEndpoint,
  selectedAccount,
  transactionType,
  web3FromAddress,
}: {
  api: ApiPromise | null;
  wsEndpoint: string | null;
  selectedAccount: InjectedAccountWithMeta | null;
  transactionType: string;
  web3FromAddress: ((address: string) => Promise<InjectedExtension>) | null;
  // toast: typeof toast; // TODO: modularize
}): UseSendTxOutput {
  const wallet = useWallet({ api, selectedAccount, web3FromAddress });

  const [txStage, setTxStage] = useState<TxStage>({ Empty: null });
  const [sendFn, setSendFn] = useState<{ sendTx: SendTxFn | null }>({
    sendTx: null,
  });

  const setErrState = (err: Error) => {
    logger.error(err);
    setTxStage({ Error: { error: err } });
    toast.error(err.message || "Transaction failed");
  };

  useEffect(() => {
    if (!api || !wsEndpoint || !wallet) {
      setErrState(strErr("Inconsistent internal state for transaction"));
      return;
    }

    const { injector, metadataHash } = wallet;

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
      setErrState(
        chainErr("Failed to create transaction options")(txOptionsError),
      );
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let currentToastId: string | number;

    const sendTx = async <T extends ISubmittableResult>(
      tx: SubmittableExtrinsic<"promise", T>,
    ) => {
      if (!selectedAccount) {
        setErrState(strErr("No account selected"));
        return;
      }

      if (unsubscribe != null) {
        unsubscribe();
        unsubscribe = null;
      }

      currentToastId = toast.loading(TOAST_MESSAGES.PREPARING);

      unsubscribe = await tx.signAndSend(
        selectedAccount.address,
        txOptions,
        (result: SubmittableResult) => {
          const { success, data: extStatus } = sb_extrinsic_status.safeParse(
            result.status,
          );
          if (!success) {
            setErrState(
              strErr(`Failed to parse extrinsic status ${extStatus}`),
            );
            return;
          }
          setTxStage({ Submitted: { result, extStatus } });
          handleTxUpdate({
            api,
            setErrState,
            transactionType,
            wsEndpoint,
            toastId: currentToastId,
          });
        },
      );
    };

    setSendFn({ sendTx });

    return () => {
      if (unsubscribe != null) {
        unsubscribe();
      }
    };
  }, [api, wsEndpoint, wallet, selectedAccount, web3FromAddress]);

  const txHelper = useMemo(() => txStatusToTxHelper(txStage), [txStage]);

  return {
    txStage,
    ...sendFn,
    ...txHelper,
  };
}

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

  const [proofError, proof] = await getMerkleizedMetadata(api);
  if (proofError !== undefined) {
    console.error(proofError);
    const err = chainErr("Failed to generate metadata")(proofError);
    return makeErr(err);
  }

  const { metadataHash } = proof;

  return makeOk({ injector, metadataHash });
};

interface UseWalletArgs {
  api: ApiPromise | null;
  selectedAccount: InjectedAccountWithMeta | null;
  web3FromAddress: ((address: string) => Promise<InjectedExtension>) | null;
}

export const useWallet = ({
  api,
  selectedAccount,
  web3FromAddress,
}: UseWalletArgs) => {
  const [wallet, setWallet] = useState<{
    injector: InjectedExtension;
    metadataHash: `0x${string}`;
  } | null>(null);

  useEffect(() => {
    if (!api || !selectedAccount || !web3FromAddress) {
      console.warn("Inconsistent internal state for transaction signing");
      return;
    }

    const run = async () => {
      const [walletSetupError, walletSetup] = await setupWallet({
        api,
        selectedAccount,
        web3FromAddress,
      });
      if (walletSetupError !== undefined) {
        toast.error(
          `Failed to setup wallet for transactions: ${walletSetupError.toString()}`,
        );
        return;
      }

      setWallet(walletSetup);

      const { injector } = walletSetup;

      // Update chain metadata
      // TODO: refactor, do this only once for wallet/app instance
      const [metadataError] = await tryAsync(updateMetadata(api, [injector]));
      if (metadataError !== undefined) {
        toast.error(
          `Failed to update chain metadata: ${metadataError.toString()}`,
        );
      }
    };

    run().catch((e) => {
      toast.error(`Unexpected error setting up wallet: ${e}`);
    });
  }, [api, selectedAccount, web3FromAddress]);

  return wallet;
};

const handleTxUpdate =
  ({
    api,
    setErrState,
    transactionType,
    wsEndpoint,
    toastId,
  }: {
    api: ApiPromise;
    setErrState: (err: Error) => void;
    transactionType: string;
    wsEndpoint: string;
    toastId: string | number;
  }) =>
  (tx: TxStage) => {
    return match(tx)({
      Empty: () => null,
      Signing: () => null,
      Error: ({ error }) => {
        setErrState(error);
        return null;
      },
      Submitted: ({ extStatus, result }) => {
        match(extStatus)({
          Invalid: () => {
            setErrState(strErr("Invalid transaction"));
          },
          Future: () => null,
          Ready: () => {
            toast.loading(TOAST_MESSAGES.READY, { id: toastId });
          },
          Broadcast: () => {
            toast.loading(TOAST_MESSAGES.BROADCASTING, { id: toastId });
          },
          InBlock: () => {
            toast.loading(TOAST_MESSAGES.IN_BLOCK, { id: toastId });
            setTimeout(() => {
              toast.loading(TOAST_MESSAGES.FINALIZING, { id: toastId });
            }, 1000);
          },
          Finalized: (hash) => {
            handleFinalizedTx({
              api,
              hash,
              result,
              setErrState,
              transactionType,
              wsEndpoint,
              toastId,
            });
          },

          Dropped: () => null,
          Usurped: () => null,

          FinalityTimeout: () => null,
          Retracted: () => null,
        });
      },
    });
  };

const handleFinalizedTx = ({
  api,
  hash,
  result,
  setErrState,
  transactionType,
  wsEndpoint,
  toastId,
}: {
  api: ApiPromise;
  hash: string;
  result: SubmittableResult;
  setErrState: (err: Error) => void;
  transactionType: string;
  wsEndpoint: string;
  toastId: string | number;
}) => {
  const success = result.findRecord("system", "ExtrinsicSuccess");
  const failed = result.findRecord("system", "ExtrinsicFailed");

  if (success) {
    toast.dismiss(toastId);
    toast.success(`${transactionType} ${TOAST_MESSAGES.SUCCESS}`, undefined, {
      label: "View on Block Explorer",
      onClick: () =>
        window.open(getExplorerLink({ wsEndpoint, hash }), "_blank"),
    });
    return;
  }

  if (!failed) throw new Error("Inconsistent included transaction state");

  // Fix the destructuring and error handling
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

  setErrState(strErr(errorMessage));

  toast.dismiss(toastId);
  toast.error(errorMessage);
};

function _ExampleUsage() {
  const { api, selectedAccount, web3FromAddress, wsEndpoint } =
    null as unknown as {
      api: ApiPromise;
      selectedAccount: InjectedAccountWithMeta;
      web3FromAddress: (address: string) => Promise<InjectedExtension>;
      wsEndpoint: string;
    };

  const {
    sendTx,
    isSigning,
    isPending,
    isSuccess,
    isFinalized,
    isError,
    message,
    error,
  } = useSendTransaction({
    api,
    wsEndpoint,
    selectedAccount,
    transactionType: "Transfer",
    web3FromAddress,
  });

  const _handleTransfer = async () => {
    if (!sendTx) return;

    const tx = api.tx.balances.transferAllowDeath(
      "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
      "1000000000000",
    );

    await sendTx(tx);
  };

  return (
    <div>
      <button
        onClick={_handleTransfer}
        disabled={!sendTx || isPending || isSigning}
      >
        {isSigning ? "Signing..." : isPending ? "Pending..." : "Transfer"}
      </button>

      <div>Status: {message}</div>
      {isError && error && <div>Error: {error.message}</div>}
      {isSuccess && <div>Success!</div>}
      {isFinalized && <div>Finalized!</div>}
    </div>
  );
}
