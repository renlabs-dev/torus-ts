import type {
  ChainMap,
  ChainName,
  CoreAddresses,
  MultiProtocolProvider,
  TypedTransactionReceipt,
} from "@hyperlane-xyz/sdk";
import { MultiProtocolCore, ProviderType } from "@hyperlane-xyz/sdk";
import { logger } from "./logger";
import { SentTransferStatuses, TransferStatus } from "./types";

export function tryGetMsgIdFromTransferReceipt(
  multiProvider: MultiProtocolProvider,
  origin: ChainName,
  receipt: TypedTransactionReceipt,
) {
  try {
    // IBC transfers have no message IDs
    if (receipt.type === ProviderType.CosmJs) return undefined;

    if (receipt.type === ProviderType.Viem) {
      // Massage viem type into ethers type because that's still what the
      // SDK expects. In this case they're compatible.
      receipt = {
        type: ProviderType.EthersV5,
        receipt: receipt.receipt as never,
      };
    }

    const addressStubs = multiProvider
      .getKnownChainNames()
      .reduce<ChainMap<CoreAddresses>>((acc, chainName) => {
        // Actual core addresses not required for the id extraction
        acc[chainName] = {
          validatorAnnounce: "",
          proxyAdmin: "",
          mailbox: "",
        };
        return acc;
      }, {});
    const core = new MultiProtocolCore(multiProvider, addressStubs);
    const messages = core.extractMessageIds(origin, receipt);
    if (messages.length) {
      const msgId = messages[0]?.messageId;
      logger.debug("Message id found in logs", msgId);
      return msgId;
    } else {
      logger.warn("No messages found in logs");
      return undefined;
    }
  } catch (error) {
    logger.error("Could not get msgId from transfer receipt", error);
    return undefined;
  }
}

export function isTransferSent(status: TransferStatus) {
  return SentTransferStatuses.includes(status);
}

export function isTransferFailed(status: TransferStatus) {
  return status === TransferStatus.Failed;
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.toLocaleTimeString()} ${date.toLocaleDateString()}`;
}
