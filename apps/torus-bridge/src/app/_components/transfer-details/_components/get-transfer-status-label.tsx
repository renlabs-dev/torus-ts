import { FinalTransferStatuses, TransferStatus } from "~/utils/types";

export function getTransferStatusLabel(
  status: TransferStatus,
  connectorName: string,
  isPermissionlessRoute: boolean,
  isAccountReady: boolean,
): string {
  if (!isAccountReady && !FinalTransferStatuses.includes(status)) {
    return "Please connect wallet to continue";
  }

  const statusDescriptions: Record<
    TransferStatus,
    string | ((connectorName: string) => string)
  > = {
    [TransferStatus.Preparing]: "Preparing for token transfer...",
    [TransferStatus.CreatingTxs]: "Creating transactions...",
    [TransferStatus.SigningApprove]: (connector) =>
      `Sign approve transaction in ${connector} to continue.`,
    [TransferStatus.ConfirmingApprove]: "Confirming approve transaction...",
    [TransferStatus.SigningTransfer]: (connector) =>
      `Sign transfer transaction in ${connector} to continue.`,
    [TransferStatus.ConfirmingTransfer]: "Confirming transfer transaction...",
    [TransferStatus.ConfirmedTransfer]: isPermissionlessRoute
      ? "Transfer confirmed, the funds will arrive when the message is delivered."
      : "Transfer transaction confirmed, delivering message...",
    [TransferStatus.Delivered]: "Delivery complete, transfer successful!",
    [TransferStatus.Failed]: "Transfer failed, please try again.",
  };

  const description = statusDescriptions[status];
  return typeof description === "function"
    ? description(connectorName)
    : description;
}
