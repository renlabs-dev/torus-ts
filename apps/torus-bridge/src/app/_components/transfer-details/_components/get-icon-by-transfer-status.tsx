import { Ban,CircleCheckBig, MailCheck } from "lucide-react";

import { TransferStatus } from "~/utils/types";

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
