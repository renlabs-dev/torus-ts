"use client";

import { useStore } from "~/utils/store";
import type { TransferContext } from "~/utils/types";
import { useLayoutEffect, useState } from "react";
import { TransfersDetailsDialog } from "./_components/transfer-details-dialog";

export function TransferDetails() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<
    TransferContext | undefined | null
  >(null);

  const transfers = useStore((s) => s.transfers);
  const transferLoading = useStore((s) => s.transferLoading);

  useLayoutEffect(() => {
    const shouldShowModal = !transferLoading && transfers.length > 0;
    const latestTransfer = shouldShowModal
      ? transfers[transfers.length - 1]
      : null;

    if (latestTransfer && latestTransfer !== selectedTransfer) {
      queueMicrotask(() => {
        setSelectedTransfer(latestTransfer);
        setIsModalOpen(true);
      });
    }
  }, [transfers, transferLoading, selectedTransfer]);

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
