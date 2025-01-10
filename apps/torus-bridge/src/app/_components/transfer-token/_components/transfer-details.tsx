import { ProtocolType, toBase64 } from "@hyperlane-xyz/utils";
import {
  CopyButton,
  MessageStatus,
  MessageTimeline,
  useAccountForChain,
  useMessageTimeline,
  useTimeout,
  useWalletDetails,
} from "@hyperlane-xyz/widgets";
// import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

// import { TokenIcon } from "~/app/_components/token-icon";
import {
  Ban,
  ChevronsRight,
  CircleCheckBig,
  LinkIcon,
  MailCheck,
} from "lucide-react";
import { useMultiProvider } from "~/hooks/use-multi-provider";
import { useWarpCore, tryFindToken } from "~/hooks/token";
import {
  getChainDisplayName,
  hasPermissionlessChain,
  isPermissionlessChain,
} from "~/utils/chain";
import { logger } from "~/utils/logger";
import type { TransferContext } from "~/utils/types";
import { FinalTransferStatuses, TransferStatus } from "~/utils/types";
import {
  formatTimestamp,
  isTransferFailed,
  isTransferSent,
} from "~/utils/transfer";
import type { MultiProtocolProvider } from "@hyperlane-xyz/sdk";
import { config } from "~/consts/config";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  links,
  Loading,
} from "@torus-ts/ui";
import { smallAddress } from "@torus-ts/utils/subspace";

export function TransfersDetailsModal({
  isOpen,
  onClose,
  transfer,
}: {
  isOpen: boolean;
  onClose: () => void;
  transfer: TransferContext;
}) {
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
          {isFinal && (
            <div className="flex items-start justify-between">
              <h2 className="font-medium text-gray-600">{date}</h2>
              <div className="flex items-center gap-1 font-medium">
                {getIconByTransferStatus(status)}
                {isSent ? <p>Sent</p> : <p>Failed</p>}
              </div>
            </div>
          )}
        </AlertDialogHeader>

        <div className="mt-4 flex w-full items-center justify-center">
          <div className="flex items-baseline">
            <span className="text-lg font-medium">{amount}</span>
            <span className="ml-1 text-lg font-medium">{token?.symbol}</span>
          </div>
        </div>

        <div className="flex items-center justify-around rounded-md border border-border p-2">
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
                name="Token Address or Denom"
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
              className={`mt-5 text-center text-sm ${isFailed ? "text-red-600" : "text-gray-600"}`}
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

// TODO consider re-enabling timeline
export function Timeline({
  transferStatus,
  originTxHash,
}: {
  transferStatus: TransferStatus;
  originTxHash?: string;
}) {
  const isFailed = transferStatus === TransferStatus.Failed;
  const multiProtocolProvider = useMultiProvider();
  const { stage, timings, message } = useMessageTimeline({
    originTxHash: isFailed ? undefined : originTxHash,
    multiProvider: multiProtocolProvider.toMultiProvider(),
  });
  const messageStatus = isFailed
    ? MessageStatus.Failing
    : (message?.status ?? MessageStatus.Pending);

  return (
    <div className="timeline-container mb-2 mt-6 flex w-full flex-col items-center justify-center">
      <MessageTimeline
        status={messageStatus}
        stage={stage}
        timings={timings}
        timestampSent={message?.origin.timestamp}
        hideDescriptions={true}
      />
    </div>
  );
}

function TransferProperty({
  name,
  value,
  url,
}: {
  name: string;
  value: string;
  url?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-gray-350 text-sm leading-normal tracking-wider">
          {name}
        </label>
        <div className="flex items-center space-x-2">
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer">
              <LinkIcon className="h-3 w-3" />
            </a>
          )}
          <CopyButton
            copyValue={value}
            width={14}
            height={14}
            className="opacity-40"
          />
        </div>
      </div>
      <div className="mt-1 truncate text-sm leading-normal tracking-wider text-zinc-400">
        {smallAddress(value, 21)}
      </div>
    </div>
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

export function getHypExplorerLink(
  multiProvider: MultiProtocolProvider,
  chain: ChainName,
  msgId?: string,
) {
  if (!config.enableExplorerLink || !chain || !msgId) return null;
  const baseLink = `${links.explorer}/message/${msgId}`;

  if (!isPermissionlessChain(multiProvider, chain)) return baseLink;

  const chainMetadata = multiProvider.tryGetChainMetadata(chain);
  if (!chainMetadata) return baseLink;

  const serializedConfig = toBase64([chainMetadata]);
  if (!serializedConfig) return baseLink;

  const params = new URLSearchParams({ chains: serializedConfig });
  return `${baseLink}?${params.toString()}`;
}

export function getTransferStatusLabel(
  status: TransferStatus,
  connectorName: string,
  isPermissionlessRoute: boolean,
  isAccountReady: boolean,
) {
  let statusDescription = "...";
  if (!isAccountReady && !FinalTransferStatuses.includes(status))
    statusDescription = "Please connect wallet to continue";
  else if (status === TransferStatus.Preparing)
    statusDescription = "Preparing for token transfer...";
  else if (status === TransferStatus.CreatingTxs)
    statusDescription = "Creating transactions...";
  else if (status === TransferStatus.SigningApprove)
    statusDescription = `Sign approve transaction in ${connectorName} to continue.`;
  else if (status === TransferStatus.ConfirmingApprove)
    statusDescription = "Confirming approve transaction...";
  else if (status === TransferStatus.SigningTransfer)
    statusDescription = `Sign transfer transaction in ${connectorName} to continue.`;
  else if (status === TransferStatus.ConfirmingTransfer)
    statusDescription = "Confirming transfer transaction...";
  else if (status === TransferStatus.ConfirmedTransfer)
    if (!isPermissionlessRoute)
      statusDescription =
        "Transfer transaction confirmed, delivering message...";
    else
      statusDescription =
        "Transfer confirmed, the funds will arrive when the message is delivered.";
  else if (status === TransferStatus.Delivered)
    statusDescription = "Delivery complete, transfer successful!";
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  else if (status === TransferStatus.Failed)
    statusDescription = "Transfer failed, please try again.";

  return statusDescription;
}

export function getIconByTransferStatus(status: TransferStatus) {
  switch (status) {
    case TransferStatus.Delivered:
      return <MailCheck className="h-4 w-4" />;
    case TransferStatus.ConfirmedTransfer:
      return <CircleCheckBig className="h-4 w-4" />;
    case TransferStatus.Failed:
      return <Ban className="h-4 w-4" />;
    default:
      return <Ban className="h-4 w-4" />;
  }
}
