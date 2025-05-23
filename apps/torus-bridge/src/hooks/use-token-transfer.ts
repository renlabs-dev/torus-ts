import type { TypedTransactionReceipt, WarpCore } from "@hyperlane-xyz/sdk";
import { WarpTxCategory } from "@hyperlane-xyz/sdk";
import { toTitleCase, toWei } from "@hyperlane-xyz/utils";
import {
  getAccountAddressForChain,
  useAccounts,
  useActiveChains,
  useTransactionFns,
} from "@hyperlane-xyz/widgets";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { ToastTxSuccess } from "~/app/_components/toast/tx-success-toast";
import { useCallback, useState } from "react";
import { getChainDisplayName } from "../utils/chain";
import { logger } from "../utils/logger";
import type { AppState } from "../utils/store";
import { useStore } from "../utils/store";
import { tryGetMsgIdFromTransferReceipt } from "../utils/transfer";
import type { TransferContext, TransferFormValues } from "../utils/types";
import { TransferStatus } from "../utils/types";
import { getTokenByIndex, useWarpCore } from "./token";
import { useMultiProvider } from "./use-multi-provider";

const CHAIN_MISMATCH_ERROR = "ChainMismatchError";
const TRANSFER_TIMEOUT_ERROR1 = "block height exceeded";
const TRANSFER_TIMEOUT_ERROR2 = "timeout";

export function useTokenTransfer(onDone?: () => void) {
  const { transfers, addTransfer, updateTransferStatus } = useStore((s) => ({
    transfers: s.transfers,
    addTransfer: s.addTransfer,
    updateTransferStatus: s.updateTransferStatus,
  }));
  const transferIndex = transfers.length;

  const multiProvider = useMultiProvider();
  const warpCore = useWarpCore();

  const activeAccounts = useAccounts(multiProvider);
  const activeChains = useActiveChains(multiProvider);
  const transactionFns = useTransactionFns(multiProvider);
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);

  // TODO implement cancel callback for when modal is closed?
  const triggerTransactions = useCallback(
    (values: TransferFormValues) =>
      executeTransfer({
        warpCore,
        values,
        transferIndex,
        activeAccounts,
        activeChains,
        transactionFns,
        addTransfer,
        updateTransferStatus,
        setIsLoading,
        onDone,
        toast,
      }),
    [
      warpCore,
      transferIndex,
      activeAccounts,
      activeChains,
      transactionFns,
      setIsLoading,
      addTransfer,
      updateTransferStatus,
      onDone,
      toast,
    ],
  );

  return {
    isLoading,
    triggerTransactions,
  };
}

async function executeTransfer({
  warpCore,
  values,
  transferIndex,
  activeAccounts,
  activeChains,
  transactionFns,
  addTransfer,
  updateTransferStatus,
  setIsLoading,
  onDone,
  toast,
}: {
  warpCore: WarpCore;
  values: TransferFormValues;
  transferIndex: number;
  activeAccounts: ReturnType<typeof useAccounts>;
  activeChains: ReturnType<typeof useActiveChains>;
  transactionFns: ReturnType<typeof useTransactionFns>;
  addTransfer: (t: TransferContext) => void;
  updateTransferStatus: AppState["updateTransferStatus"];
  setIsLoading: (b: boolean) => void;
  onDone?: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  logger.debug("Preparing transfer transaction(s)");
  setIsLoading(true);
  let transferStatus: TransferStatus = TransferStatus.Preparing;
  updateTransferStatus(transferIndex, transferStatus);

  const { origin, destination, tokenIndex, amount, recipient } = values;
  const multiProvider = warpCore.multiProvider;

  try {
    const originToken = getTokenByIndex(warpCore, tokenIndex);

    const connection = originToken?.getConnectionForChain(destination);
    if (!originToken || !connection)
      throw new Error("No token route found between chains");

    const originProtocol = originToken.protocol;

    const weiAmount = toWei(amount, originToken.decimals);
    const originTokenAmount = originToken.amount(weiAmount);

    const sendTransaction = transactionFns[originProtocol].sendTransaction;
    const activeChain = activeChains.chains[originProtocol];
    const sender = getAccountAddressForChain(
      multiProvider,

      origin,
      activeAccounts.accounts,
    );
    if (!sender) throw new Error("No active account found for origin chain");

    const isCollateralSufficient =
      await warpCore.isDestinationCollateralSufficient({
        originTokenAmount,
        destination,
      });
    if (!isCollateralSufficient) {
      toast({
        title: "Insufficient collateral on destination for transfer",
        description: "Insufficient collateral on destination for transfer",
      });
      throw new Error("Insufficient destination collateral");
    }

    addTransfer({
      timestamp: new Date().getTime(),
      status: TransferStatus.Preparing,
      origin,
      destination,
      originTokenAddressOrDenom: originToken.addressOrDenom,
      destTokenAddressOrDenom: connection.token.addressOrDenom,
      sender,
      recipient,
      amount,
    });

    updateTransferStatus(
      transferIndex,
      (transferStatus = TransferStatus.CreatingTxs),
    );

    const txs = await warpCore.getTransferRemoteTxs({
      originTokenAmount,
      destination,
      sender,
      recipient,
    });

    const hashes: string[] = [];
    let txReceipt: TypedTransactionReceipt | undefined = undefined;
    for (const tx of txs) {
      updateTransferStatus(
        transferIndex,
        (transferStatus = txCategoryToStatuses[tx.category][0]),
      );
      const { hash, confirm } = await sendTransaction({
        tx,
        chainName: origin,
        activeChainName: activeChain.chainName,
      });
      updateTransferStatus(
        transferIndex,
        (transferStatus = txCategoryToStatuses[tx.category][1]),
      );
      txReceipt = await confirm();
      const description = toTitleCase(tx.category);
      logger.debug(`${description} transaction confirmed, hash:`, hash);
      ToastTxSuccess(`${description} transaction sent!`, hash, origin);
      hashes.push(hash);
    }

    const msgId = txReceipt
      ? tryGetMsgIdFromTransferReceipt(multiProvider, origin, txReceipt)
      : undefined;

    updateTransferStatus(
      transferIndex,
      (transferStatus = TransferStatus.ConfirmedTransfer),
      {
        originTxHash: hashes.at(-1),
        msgId,
      },
    );
  } catch (error) {
    logger.error(`Error at stage ${transferStatus}`, error);
    const errorDetails = error instanceof Error ? error.message : String(error);
    updateTransferStatus(transferIndex, TransferStatus.Failed);

    if (errorDetails.includes(CHAIN_MISMATCH_ERROR)) {
      // Wagmi switchNetwork call helps prevent this but isn't foolproof
      toast({
        title: "Wallet must be connected to origin chain",
        description: "Wallet must be connected to origin chain",
      });
    } else if (
      errorDetails.includes(TRANSFER_TIMEOUT_ERROR1) ||
      errorDetails.includes(TRANSFER_TIMEOUT_ERROR2)
    ) {
      toast({
        title: `Transaction timed out, ${getChainDisplayName(
          multiProvider,
          origin,
        )} may be busy. Please try again.`,
        description: `Transaction timed out, ${getChainDisplayName(
          multiProvider,
          origin,
        )} may be busy. Please try again.`,
      });
    } else {
      toast({
        title: errorMessages[transferStatus] ?? "Unable to transfer tokens.",
        description:
          errorMessages[transferStatus] ?? "Unable to transfer tokens.",
      });
    }
  }

  setIsLoading(false);
  if (onDone) onDone();
}

const errorMessages: Partial<Record<TransferStatus, string>> = {
  [TransferStatus.Preparing]: "Error while preparing the transactions.",
  [TransferStatus.CreatingTxs]: "Error while creating the transactions.",
  [TransferStatus.SigningApprove]:
    "Error while signing the approve transaction.",
  [TransferStatus.ConfirmingApprove]:
    "Error while confirming the approve transaction.",
  [TransferStatus.SigningTransfer]:
    "Error while signing the transfer transaction.",
  [TransferStatus.ConfirmingTransfer]:
    "Error while confirming the transfer transaction.",
};

const txCategoryToStatuses: Record<
  WarpTxCategory,
  [TransferStatus, TransferStatus]
> = {
  [WarpTxCategory.Approval]: [
    TransferStatus.SigningApprove,
    TransferStatus.ConfirmingApprove,
  ],
  [WarpTxCategory.Transfer]: [
    TransferStatus.SigningTransfer,
    TransferStatus.ConfirmingTransfer,
  ],
};
