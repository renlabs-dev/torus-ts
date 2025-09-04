"use client";

import { useStore } from "~/utils/store";
import type { TransferContext } from "~/utils/types";
import { useState } from "react";
import { TransfersDetailsDialog } from "./_components/transfer-details-dialog";

export function TransferDetails() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<
    TransferContext | undefined | null
  >(null);

  const transfers = useStore((s) => s.transfers);
  const transferLoading = useStore((s) => s.transferLoading);

  // Derive the selected transfer directly from state without useEffect
  const shouldShowModal = !transferLoading && transfers.length > 0;
  const latestTransfer = shouldShowModal
    ? transfers[transfers.length - 1]
    : null;

  // Use a different approach - derive state changes in the render phase
  if (latestTransfer && latestTransfer !== selectedTransfer) {
    // This will trigger a re-render with the new state
    setTimeout(() => {
      setSelectedTransfer(latestTransfer);
      setIsModalOpen(true);
    }, 0);
  }

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
