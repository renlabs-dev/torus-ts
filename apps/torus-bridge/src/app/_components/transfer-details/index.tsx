import { useStore } from "~/utils/store";
import type { TransferContext } from "~/utils/types";
import { useEffect, useRef, useState } from "react";
import { TransfersDetailsDialog } from "./_components/transfer-details-dialog";

export function TransferDetails() {
  const didMountRef = useRef(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<
    TransferContext | undefined | null
  >(null);

  const { transfers, transferLoading } = useStore((s) => ({
    transfers: s.transfers,
    resetTransfers: s.resetTransfers,
    transferLoading: s.transferLoading,
  }));

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    if (!transferLoading && transfers.length > 0) {
      setSelectedTransfer(transfers[transfers.length - 1]);
      setIsModalOpen(true);
    }
  }, [transfers, transferLoading]);

  return (
    <>
      {selectedTransfer && (
        <TransfersDetailsDialog
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTransfer(null);
          }}
          transfer={selectedTransfer}
        />
      )}
    </>
  );
}

export default TransferDetails;
