"use client";

import { useStore } from "~/utils/store";
import type { TransferContext } from "~/utils/types";
import { useEffect, useState } from "react";
import { TransfersDetailsDialog } from "./_components/transfer-details-dialog";

export function TransferDetails() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<
    TransferContext | undefined | null
  >(null);

  const { transfers, transferLoading } = useStore((s) => ({
    transfers: s.transfers,
    transferLoading: s.transferLoading,
  }));

  useEffect(() => {
    if (!transferLoading && transfers.length > 0) {
      setSelectedTransfer(transfers[transfers.length - 1]);
      setIsModalOpen(true);
    }
  }, [transfers, transferLoading]);

  if (!selectedTransfer) return null;

  return (
    <TransfersDetailsDialog
      isOpen={isModalOpen}
      onClose={() => {
        setIsModalOpen(false);
        setSelectedTransfer(null);
      }}
      transfer={selectedTransfer}
    />
  );
}
