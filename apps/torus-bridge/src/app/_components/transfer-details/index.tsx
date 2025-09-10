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

  const transfers = useStore((s) => s.transfers);
  const transferLoading = useStore((s) => s.transferLoading);

  // Use useEffect to properly handle state updates
  useEffect(() => {
    const shouldShowModal = !transferLoading && transfers.length > 0;
    const latestTransfer = shouldShowModal
      ? transfers[transfers.length - 1]
      : null;

    if (latestTransfer && latestTransfer !== selectedTransfer) {
      // Use setTimeout to avoid synchronous setState in effect
      const timeoutId = setTimeout(() => {
        setSelectedTransfer(latestTransfer);
        setIsModalOpen(true);
      }, 0);

      return () => clearTimeout(timeoutId);
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
