import { useStore } from "~/utils/store";
import type { TransferContext } from "~/utils/types";
import { useEffect, useRef, useState } from "react";
import { TransfersDetailsDialog } from "./_components/transfer-details-dialog";
import dynamic from "next/dynamic";

// Ensure this component only runs on the client
const TransferDetailsComponent = dynamic(() => Promise.resolve(TransferDetailsClient), {
  ssr: false,
});

function TransferDetailsClient() {
  const didMountRef = useRef(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<
    TransferContext | undefined | null
  >(null);

  // Access store selectors individually to avoid object creation
  const transfers = useStore((s) => s.transfers);
  const transferLoading = useStore((s) => s.transferLoading);

  const prevLoading = useRef<boolean>(false);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
<<<<<<< HEAD
    } else if (transferLoading && transfers.length > 0) {
=======
    } else if (!prevLoading.current && transferLoading) {
>>>>>>> 69f37104e0a98e3f4589827c8deab71735913410
      setSelectedTransfer(transfers[transfers.length - 1]);
      setIsModalOpen(true);
    }
    prevLoading.current = transferLoading;
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

// Export a simple wrapper that loads the client component
export function TransferDetails() {
  return <TransferDetailsComponent />;
}
