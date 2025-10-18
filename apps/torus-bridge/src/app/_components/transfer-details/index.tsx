"use client";

import { useStore } from "~/utils/store";
import type { TransferContext } from "~/utils/types";
import { useLayoutEffect, useRef, useState } from "react";
import { TransfersDetailsDialog } from "./_components/transfer-details-dialog";

export function TransferDetails() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<
    TransferContext | undefined | null
  >(null);

  const prevTransfersLength = useRef(0);
  const hasInitialized = useRef(false);

  const transfers = useStore((s) => s.transfers);
  const transferLoading = useStore((s) => s.transferLoading);

  useLayoutEffect(() => {
    if (!hasInitialized.current) {
      prevTransfersLength.current = transfers.length;
      hasInitialized.current = true;
      return;
    }

    const hasNewTransfer = transfers.length > prevTransfersLength.current;

    if (hasNewTransfer && !transferLoading && transfers.length > 0) {
      const latestTransfer = transfers[transfers.length - 1];

      queueMicrotask(() => {
        setSelectedTransfer(latestTransfer);
        setIsModalOpen(true);
      });
    }

    prevTransfersLength.current = transfers.length;
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
