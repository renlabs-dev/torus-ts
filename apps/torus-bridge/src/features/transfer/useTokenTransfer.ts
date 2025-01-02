import type { TypedTransactionReceipt, WarpCore } from "@hyperlane-xyz/sdk";
import { WarpTxCategory } from "@hyperlane-xyz/sdk";
import { toTitleCase, toWei } from "@hyperlane-xyz/utils";
import {
  getAccountAddressForChain,
  useAccounts,
  useActiveChains,
  useTransactionFns,
} from "@hyperlane-xyz/widgets";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";

import { logger } from "../../utils/logger";
import { useMultiProvider } from "../chains/hooks";
import { getChainDisplayName } from "../chains/utils";
import type { AppState } from "../store";
import { useStore } from "../store";
import { getTokenByIndex, useWarpCore } from "../tokens/hooks";
import type { TransferContext, TransferFormValues } from "./types";
import { TransferStatus } from "./types";
import { tryGetMsgIdFromTransferReceipt } from "./utils";
import { toastTxSuccess } from "~/app/components/toast/TxSuccessToast";

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
}) {
  logger.debug("Preparing transfer transaction(s)");
  setIsLoading(true);
  let transferStatus: TransferStatus = TransferStatus.Preparing;
  updateTransferStatus(transferIndex, transferStatus);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { origin, destination, tokenIndex, amount, recipient } = values;
  const multiProvider = warpCore.multiProvider;

  try {
    const originToken = getTokenByIndex(warpCore, tokenIndex);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const connection = originToken?.getConnectionForChain(destination);
    if (!originToken || !connection)
      throw new Error("No token route found between chains");

    const originProtocol = originToken.protocol;
    const isNft = originToken.isNft();
    const weiAmountOrId = isNft ? amount : toWei(amount, originToken.decimals);
    const originTokenAmount = originToken.amount(weiAmountOrId);

    const sendTransaction = transactionFns[originProtocol].sendTransaction;
    const activeChain = activeChains.chains[originProtocol];
    const sender = getAccountAddressForChain(
      multiProvider,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      origin,
      activeAccounts.accounts,
    );
    if (!sender) throw new Error("No active account found for origin chain");

    const isCollateralSufficient =
      await warpCore.isDestinationCollateralSufficient({
        originTokenAmount,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        destination,
      });
    if (!isCollateralSufficient) {
      toast.error("Insufficient collateral on destination for transfer");
      throw new Error("Insufficient destination collateral");
    }

    addTransfer({
      timestamp: new Date().getTime(),
      status: TransferStatus.Preparing,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      origin,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      destination,
      originTokenAddressOrDenom: originToken.addressOrDenom,
      destTokenAddressOrDenom: connection.token.addressOrDenom,
      sender,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      recipient,
      amount,
    });

    updateTransferStatus(
      transferIndex,
      (transferStatus = TransferStatus.CreatingTxs),
    );

    const txs = await warpCore.getTransferRemoteTxs({
      originTokenAmount,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      destination,
      sender,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
      toastTxSuccess(`${description} transaction sent!`, hash, origin);
      hashes.push(hash);
    }

    const msgId = txReceipt
      ? // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        tryGetMsgIdFromTransferReceipt(multiProvider, origin, txReceipt)
      : undefined;

    updateTransferStatus(
      transferIndex,
      (transferStatus = TransferStatus.ConfirmedTransfer),
      {
        originTxHash: hashes.at(-1),
        msgId,
      },
    );
  } catch (error: unknown) {
    logger.error(`Error at stage ${transferStatus}`, error);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const errorDetails = error.message || error.toString();
    updateTransferStatus(transferIndex, TransferStatus.Failed);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    if (errorDetails.includes(CHAIN_MISMATCH_ERROR)) {
      // Wagmi switchNetwork call helps prevent this but isn't foolproof
      toast.error("Wallet must be connected to origin chain");
    } else if (
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      errorDetails.includes(TRANSFER_TIMEOUT_ERROR1) ||
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      errorDetails.includes(TRANSFER_TIMEOUT_ERROR2)
    ) {
      toast.error(
        `Transaction timed out, ${getChainDisplayName(multiProvider, origin)} may be busy. Please try again.`,
      );
    } else {
      toast.error(
        errorMessages[transferStatus] ?? "Unable to transfer tokens.",
      );
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
