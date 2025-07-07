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
import { trySync } from "@torus-network/torus-utils/try-catch";

export function tryGetMsgIdFromTransferReceipt(
  multiProvider: MultiProtocolProvider,
  origin: ChainName,
  receipt: TypedTransactionReceipt,
) {
  // IBC transfers have no message IDs
  if (receipt.type === ProviderType.CosmJs) return undefined;

  // Massage viem type into ethers type
  const [receiptConversionError, convertedReceipt] = trySync(() => {
    let processedReceipt = receipt;
    if (receipt.type === ProviderType.Viem) {
      // Massage viem type into ethers type because that's still what the
      // SDK expects. In this case they're compatible.
      processedReceipt = {
        type: ProviderType.EthersV5,
        receipt: receipt.receipt as never,
      };
    }
    return processedReceipt;
  });

  if (receiptConversionError !== undefined) {
    logger.error("Could not convert receipt type:", receiptConversionError);
    return undefined;
  }

  // Create address stubs for core initialization
  const [addressStubsError, addressStubs] = trySync(() =>
    multiProvider
      .getKnownChainNames()
      .reduce<ChainMap<CoreAddresses>>((acc, chainName) => {
        // Actual core addresses not required for the id extraction
        acc[chainName] = {
          validatorAnnounce: "",
          proxyAdmin: "",
          mailbox: "",
        };
        return acc;
      }, {}),
  );

  if (addressStubsError !== undefined) {
    logger.error("Could not create address stubs:", addressStubsError);
    return undefined;
  }

  // Create core and extract message IDs
  const [coreError, core] = trySync(
    () => new MultiProtocolCore(multiProvider, addressStubs),
  );

  if (coreError !== undefined) {
    logger.error("Could not create MultiProtocolCore:", coreError);
    return undefined;
  }

  const [extractError, messages] = trySync(() =>
    core.extractMessageIds(origin, convertedReceipt),
  );

  if (extractError !== undefined) {
    logger.error("Could not extract message IDs from logs:", extractError);
    return undefined;
  }

  // Check if messages were found
  if (messages.length) {
    const msgId = messages[0]?.messageId;
    logger.debug("Message id found in logs", msgId);
    return msgId;
  } else {
    logger.warn("No messages found in logs");
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
