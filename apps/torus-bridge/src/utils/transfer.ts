import { SentTransferStatuses, TransferStatus } from "./types";

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
