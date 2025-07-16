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
import { useTxSuccessToast } from "~/app/_components/toast/tx-success-toast";
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
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

const CHAIN_MISMATCH_ERROR = "ChainMismatchError";
const TRANSFER_TIMEOUT_ERROR1 = "block height exceeded";
const TRANSFER_TIMEOUT_ERROR2 = "timeout";

export function useTokenTransfer(onDone?: () => void) {
  const transfers = useStore((s) => s.transfers);
  const addTransfer = useStore((s) => s.addTransfer);
  const updateTransferStatus = useStore((s) => s.updateTransferStatus);

  const transferIndex = transfers.length;

  const multiProvider = useMultiProvider();
  const warpCore = useWarpCore();

  const activeAccounts = useAccounts(multiProvider);
  const activeChains = useActiveChains(multiProvider);
  const transactionFns = useTransactionFns(multiProvider);
  const { toast } = useToast();
  const txSuccessToast = useTxSuccessToast();

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
        txSuccessToast,
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
      txSuccessToast,
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
  txSuccessToast,
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
  txSuccessToast: ReturnType<typeof useTxSuccessToast>;
}) {
  logger.debug("Preparing transfer transaction(s)");
  setIsLoading(true);
  let transferStatus: TransferStatus = TransferStatus.Preparing;
  updateTransferStatus(transferIndex, transferStatus);

  const { origin, destination, tokenIndex, amount, recipient } = values;
  const multiProvider = warpCore.multiProvider;

  const handleStepError = (
    stage: TransferStatus,
    transferIndex: number,
    error: unknown,
    opts: {
      toast: ReturnType<typeof useToast>["toast"];
      setIsLoading: (b: boolean) => void;
      updateTransferStatus: AppState["updateTransferStatus"];
      onDone?: () => void;
    },
  ) => {
    const { toast, setIsLoading, updateTransferStatus, onDone } = opts;
    logger.error(`Error at stage ${stage}`, error);
    updateTransferStatus(transferIndex, TransferStatus.Failed);
    toast({
      title: errorMessages[stage] ?? "Unable to transfer tokens.",
      description: errorMessages[stage] ?? "Unable to transfer tokens.",
    });
    setIsLoading(false);
    onDone?.();
  };

  // Step 1: Get token by index
  const [tokenError, originToken] = trySync(() =>
    getTokenByIndex(warpCore, tokenIndex),
  );

  if (tokenError !== undefined) {
    const errorMsg = "Failed to get token";
    logger.error(`Error at stage ${transferStatus}: ${errorMsg}`, tokenError);
    handleStepError(transferStatus, transferIndex, tokenError, {
      toast,
      setIsLoading,
      updateTransferStatus,
      onDone,
    });
    return;
  }

  // Step 2: Get connection for chain
  const [connectionError, connection] = trySync(() =>
    originToken?.getConnectionForChain(destination),
  );

  if (connectionError !== undefined || !originToken || !connection) {
    const errorMsg = "No token route found between chains";
    logger.error(
      `Error at stage ${transferStatus}: ${errorMsg}`,
      connectionError,
    );
    handleStepError(transferStatus, transferIndex, connectionError, {
      toast,
      setIsLoading,
      updateTransferStatus,
      onDone,
    });
    return;
  }

  const originProtocol = originToken.protocol;

  // Step 3: Convert amount to wei
  const [weiError, weiAmount] = trySync(() =>
    toWei(amount, originToken.decimals),
  );

  if (weiError !== undefined) {
    const errorMsg = "Failed to convert amount";
    logger.error(`Error at stage ${transferStatus}: ${errorMsg}`, weiError);
    handleStepError(transferStatus, transferIndex, weiError, {
      toast,
      setIsLoading,
      updateTransferStatus,
      onDone,
    });
    return;
  }

  // Step 4: Create token amount
  const [amountError, originTokenAmount] = trySync(() =>
    originToken.amount(weiAmount),
  );

  if (amountError !== undefined) {
    const errorMsg = "Failed to create token amount";
    logger.error(`Error at stage ${transferStatus}: ${errorMsg}`, amountError);
    handleStepError(transferStatus, transferIndex, amountError, {
      toast,
      setIsLoading,
      updateTransferStatus,
      onDone,
    });
    return;
  }

  const sendTransaction = transactionFns[originProtocol].sendTransaction;
  const activeChain = activeChains.chains[originProtocol];

  // Step 5: Get account address
  const [addressError, sender] = trySync(() =>
    getAccountAddressForChain(multiProvider, origin, activeAccounts.accounts),
  );

  if (addressError !== undefined || !sender) {
    const errorMsg = "No active account found for origin chain";
    logger.error(`Error at stage ${transferStatus}: ${errorMsg}`, addressError);
    handleStepError(transferStatus, transferIndex, addressError, {
      toast,
      setIsLoading,
      updateTransferStatus,
      onDone,
    });
    return;
  }

  // Step 6: Check collateral
  const [collateralError, isCollateralSufficient] = await tryAsync(
    warpCore.isDestinationCollateralSufficient({
      originTokenAmount,
      destination,
    }),
  );

  if (collateralError !== undefined) {
    const errorMsg = "Failed to check destination collateral";
    logger.error(
      `Error at stage ${transferStatus}: ${errorMsg}`,
      collateralError,
    );
    handleStepError(transferStatus, transferIndex, collateralError, {
      toast,
      setIsLoading,
      updateTransferStatus,
      onDone,
    });
    return;
  }

  if (!isCollateralSufficient) {
    const errorMsg = "Insufficient destination collateral";
    logger.error(
      `Error at stage ${transferStatus}: ${errorMsg}`,
      new Error(errorMsg),
    );
    handleStepError(transferStatus, transferIndex, new Error(errorMsg), {
      toast,
      setIsLoading,
      updateTransferStatus,
      onDone,
    });
    return;
  }

  // Add transfer to state
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

  // Step 7: Get transactions
  const [txsError, txs] = await tryAsync(
    warpCore.getTransferRemoteTxs({
      originTokenAmount,
      destination,
      sender,
      recipient,
    }),
  );

  if (txsError !== undefined) {
    const errorMsg = "Failed to get transfer transactions";
    logger.error(`Error at stage ${transferStatus}: ${errorMsg}`, txsError);
    handleStepError(transferStatus, transferIndex, txsError, {
      toast,
      setIsLoading,
      updateTransferStatus,
      onDone,
    });
    return;
  }

  const hashes: string[] = [];
  let txReceipt: TypedTransactionReceipt | undefined = undefined;

  // Step 8: Process transactions
  for (const tx of txs) {
    updateTransferStatus(
      transferIndex,
      (transferStatus = txCategoryToStatuses[tx.category][0]),
    );

    // Send transaction
    const [sendError, txResult] = await tryAsync(
      sendTransaction({
        tx,
        chainName: origin,
        activeChainName: activeChain.chainName,
      }),
    );

    if (sendError !== undefined) {
      const errorDetails =
        sendError instanceof Error ? sendError.message : String(sendError);
      logger.error(`Error at stage ${transferStatus}`, sendError);
      updateTransferStatus(transferIndex, TransferStatus.Failed);

      if (errorDetails.includes(CHAIN_MISMATCH_ERROR)) {
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

      setIsLoading(false);
      if (onDone) onDone();
      return;
    }

    const { hash, confirm } = txResult;

    updateTransferStatus(
      transferIndex,
      (transferStatus = txCategoryToStatuses[tx.category][1]),
    );

    // Confirm transaction
    const [confirmError, receipt] = await tryAsync(confirm());

    if (confirmError !== undefined) {
      const errorMsg = "Failed to confirm transaction";
      logger.error(
        `Error at stage ${transferStatus}: ${errorMsg}`,
        confirmError,
      );
      handleStepError(transferStatus, transferIndex, confirmError, {
        toast,
        setIsLoading,
        updateTransferStatus,
        onDone,
      });
      return;
    }

    txReceipt = receipt;
    const description = toTitleCase(tx.category);
    logger.debug(`${description} transaction confirmed, hash:`, hash);
    txSuccessToast(`${description} transaction sent!`, hash, origin);
    hashes.push(hash);
  }

  // Step 9: Get message ID
  const [msgIdError, msgId] = txReceipt
    ? trySync(() =>
        tryGetMsgIdFromTransferReceipt(multiProvider, origin, txReceipt),
      )
    : [undefined, undefined];

  if (msgIdError !== undefined) {
    logger.warn("Failed to get message ID from receipt", msgIdError);
  }

  updateTransferStatus(
    transferIndex,
    (transferStatus = TransferStatus.ConfirmedTransfer),
    {
      originTxHash: hashes.at(-1),
      msgId,
    },
  );

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
