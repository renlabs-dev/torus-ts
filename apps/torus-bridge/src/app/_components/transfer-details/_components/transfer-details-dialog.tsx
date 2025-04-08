import { ProtocolType } from "@hyperlane-xyz/utils";
import {
  useAccountForChain,
  useTimeout,
  useWalletDetails,
} from "@hyperlane-xyz/widgets";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@torus-ts/ui/components/alert-dialog";
import { Loading } from "@torus-ts/ui/components/loading";
import { tryFindToken, useWarpCore } from "~/hooks/token";
import { useMultiProvider } from "~/hooks/use-multi-provider";
import { getChainDisplayName, hasPermissionlessChain } from "~/utils/chain";
import { logger } from "~/utils/logger";
import {
  formatTimestamp,
  isTransferFailed,
  isTransferSent,
} from "~/utils/transfer";
import type { TransferContext } from "~/utils/types";
import { TransferStatus } from "~/utils/types";
import { ChevronsRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getIconByTransferStatus } from "./get-icon-by-transfer-status";
import { getTransferStatusLabel } from "./get-transfer-status-label";
import { TransferProperty } from "./transfer-property";

export function TransfersDetailsDialog({
  isOpen,
  onClose,
  transfer,
}: Readonly<{
  isOpen: boolean;
  onClose: () => void;
  transfer: TransferContext;
}>) {
  const [fromUrl, setFromUrl] = useState<string>("");
  const [toUrl, setToUrl] = useState<string>("");
  const [originTxUrl, setOriginTxUrl] = useState<string>("");

  const {
    status,
    origin,
    destination,
    amount,
    sender,
    recipient,
    originTokenAddressOrDenom,
    originTxHash,
    msgId,
    timestamp,
  } = transfer;

  const multiProvider = useMultiProvider();
  const warpCore = useWarpCore();

  const isChainKnown = multiProvider.hasChain(origin);
  const account = useAccountForChain(
    multiProvider,
    isChainKnown ? origin : undefined,
  );
  const walletDetails =
    useWalletDetails()[account?.protocol ?? ProtocolType.Ethereum];

  const getMessageUrls = useCallback(async () => {
    try {
      if (originTxHash) {
        const originTxUrl = multiProvider.tryGetExplorerTxUrl(origin, {
          hash: originTxHash,
        });
        if (originTxUrl) setOriginTxUrl(fixDoubleSlash(originTxUrl));
      }
      const [fromUrl, toUrl] = await Promise.all([
        multiProvider.tryGetExplorerAddressUrl(origin, sender),
        multiProvider.tryGetExplorerAddressUrl(destination, recipient),
      ]);
      if (fromUrl) setFromUrl(fixDoubleSlash(fromUrl));
      if (toUrl) setToUrl(fixDoubleSlash(toUrl));
    } catch (error) {
      logger.error("Error fetching URLs:", error);
    }
  }, [sender, recipient, originTxHash, multiProvider, origin, destination]);

  useEffect(() => {
    getMessageUrls().catch((err) =>
      logger.error("Error getting message URLs for details modal", err),
    );
  }, [transfer, getMessageUrls]);

  const isAccountReady = !!account?.isReady;
  const connectorName = walletDetails.name ?? "wallet";
  const token = tryFindToken(warpCore, origin, originTokenAddressOrDenom);
  const isPermissionlessRoute = hasPermissionlessChain(multiProvider, [
    destination,
    origin,
  ]);
  const isSent = isTransferSent(status);
  const isFailed = isTransferFailed(status);
  const isFinal = isSent || isFailed;
  const statusDescription = getTransferStatusLabel(
    status,
    connectorName,
    isPermissionlessRoute,
    isAccountReady,
  );
  const showSignWarning = useSignIssueWarning(status);

  const date = useMemo(
    () =>
      timestamp
        ? formatTimestamp(timestamp)
        : formatTimestamp(new Date().getTime()),
    [timestamp],
  );

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start justify-between">
            <AlertDialogTitle>
              <h3 className="text-base font-medium text-gray-600">{date}</h3>
            </AlertDialogTitle>

            {isFinal && (
              <div className="flex items-center gap-1 font-medium">
                {getIconByTransferStatus(status)}
                {isSent ? <p>Sent</p> : <p>Failed</p>}
              </div>
            )}
          </div>
        </AlertDialogHeader>

        <div className="mt-4 flex w-full items-center justify-center">
          <div className="flex items-baseline">
            <span className="text-lg font-medium">{amount}</span>
            <span className="ml-1 text-lg font-medium">{token?.symbol}</span>
          </div>
        </div>

        <div className="rounded-radius border-border flex items-center justify-around border p-2">
          <span className="font-medium tracking-wider">
            {getChainDisplayName(multiProvider, origin, true)}
          </span>

          <ChevronsRight className="h-6 w-6" />

          <span className="font-medium tracking-wider">
            {getChainDisplayName(multiProvider, destination, true)}
          </span>
        </div>

        {isFinal ? (
          <div className="mt-5 flex flex-col space-y-4">
            <TransferProperty
              name="Sender Address"
              value={sender}
              url={fromUrl}
            />
            <TransferProperty
              name="Recipient Address"
              value={recipient}
              url={toUrl}
            />
            {token?.addressOrDenom && (
              <TransferProperty
                name="Token Address"
                value={token.addressOrDenom}
              />
            )}
            {originTxHash && (
              <TransferProperty
                name="Origin Transaction Hash"
                value={originTxHash}
                url={originTxUrl}
              />
            )}
            {msgId && <TransferProperty name="Message ID" value={msgId} />}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <Loading />
            <div
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              className={`mt-5 text-center text-sm ${isFailed ? "text-red-600" : "text-white"}`}
            >
              {statusDescription}
            </div>
            {showSignWarning && (
              <div className="mt-3 text-center text-sm text-gray-600">
                If your wallet does not show a transaction request or never
                confirms, please try the transfer again.
              </div>
            )}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogAction className="mt-4 w-full" onClick={onClose}>
            Close Details
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// https://github.com/wagmi-dev/wagmi/discussions/2928
function useSignIssueWarning(status: TransferStatus) {
  const [showWarning, setShowWarning] = useState(false);
  const warningCallback = useCallback(() => {
    if (
      status === TransferStatus.SigningTransfer ||
      status === TransferStatus.ConfirmingTransfer
    )
      setShowWarning(true);
  }, [status, setShowWarning]);
  useTimeout(warningCallback, 20_000);
  return showWarning;
}

// TODO cosmos fix double slash problem in ChainMetadataManager
// Occurs when baseUrl has not other path (e.g. for manta explorer)
function fixDoubleSlash(url: string) {
  return url.replace(/([^:]\/)\/+/g, "$1");
}
