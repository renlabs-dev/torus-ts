"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ArrowRightIcon, RotateCcw } from "lucide-react";
import Image from "next/image";
import { toast } from "react-toastify";
import { TransfersDetailsModal } from "~/app/_components/transfers-details-modal";
import { tryFindToken, useWarpCore } from "~/hooks/token";
import { useMultiProvider } from "~/hooks/use-multi-provider";
import { getChainDisplayName } from "~/utils/chain";
import { useStore } from "~/utils/store";
import { getIconByTransferStatus, STATUSES_WITH_ICON } from "~/utils/transfer";

import { AccountList, ChainLogo, SpinnerIcon } from "@hyperlane-xyz/widgets";
import { Button, Sheet, SheetContent, SheetTrigger } from "@torus-ts/ui";

import type { TransferContext } from "../../utils/types";

export function SideBarMenu({
  onClickConnectWallet,
  isOpen,
  onClose,
}: {
  onClickConnectWallet: () => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const didMountRef = useRef(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] =
    useState<TransferContext | null>(null);

  console.log(onClose, isMenuOpen, isModalOpen, selectedTransfer);

  const multiProvider = useMultiProvider();

  const { transfers, resetTransfers, transferLoading } = useStore((s) => ({
    transfers: s.transfers,
    resetTransfers: s.resetTransfers,
    transferLoading: s.transferLoading,
  }));

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
    } else if (transferLoading) {
      setSelectedTransfer(transfers[transfers.length - 1] ?? null);
      setIsModalOpen(true);
    }
  }, [transfers, transferLoading]);

  useEffect(() => {
    setIsMenuOpen(isOpen);
  }, [isOpen]);

  const sortedTransfers = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    () => [...transfers].sort((a, b) => b.timestamp - a.timestamp) || [],
    [transfers],
  );

  const onCopySuccess = () => {
    toast.success("Address copied to clipboard", { autoClose: 2000 });
  };

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="z-50">
            Sidebar thing
          </Button>
        </SheetTrigger>
        <SheetContent>
          <div className="flex h-full w-full flex-col overflow-y-auto">
            <div className="bg-primary-500 w-full rounded-t-md px-3.5 py-2 text-base font-normal tracking-wider text-white">
              Connected Wallets
            </div>
            <AccountList
              multiProvider={multiProvider}
              onClickConnectWallet={onClickConnectWallet}
              onCopySuccess={onCopySuccess}
              className="px-3 py-3"
            />
            <div className="bg-primary-500 mb-4 w-full px-3.5 py-2 text-base font-normal tracking-wider text-white">
              Transfer History
            </div>
            <div className="flex grow flex-col px-3.5">
              <div className="flex w-full grow flex-col divide-y">
                {sortedTransfers.length > 0 &&
                  sortedTransfers.map((t, i) => (
                    <TransferSummary
                      key={i}
                      transfer={t}
                      onClick={() => {
                        setSelectedTransfer(t);
                        setIsModalOpen(true);
                      }}
                    />
                  ))}
              </div>
              {sortedTransfers.length > 0 && (
                <button
                  onClick={resetTransfers}
                  className={`${styles.btn} mx-2 my-5`}
                >
                  <RotateCcw className="h-3 w-3" />
                  <span className="text-sm font-normal text-gray-900">
                    Reset transaction history
                  </span>
                </button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
      {selectedTransfer && (
        <TransfersDetailsModal
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

function TransferSummary({
  transfer,
  onClick,
}: {
  transfer: TransferContext;
  onClick: () => void;
}) {
  const multiProvider = useMultiProvider();
  const warpCore = useWarpCore();

  const {
    amount,
    origin,
    destination,
    status,
    timestamp,
    originTokenAddressOrDenom,
  } = transfer;

  const token = tryFindToken(warpCore, origin, originTokenAddressOrDenom);

  return (
    <button
      key={timestamp}
      onClick={onClick}
      className={`${styles.btn} justify-between py-3`}
    >
      <div className="flex gap-2.5">
        <div className="flex h-[2.25rem] w-[2.25rem] flex-col items-center justify-center rounded-full bg-gray-100 px-1.5">
          <ChainLogo chainName={origin} size={20} />
        </div>
        <div className="flex flex-col">
          <div className="flex flex-col">
            <div className="items flex items-baseline">
              <span className="text-sm font-normal text-gray-800">
                {amount}
              </span>
              <span className="ml-1 text-sm font-normal text-gray-800">
                {token?.symbol ?? ""}
              </span>
            </div>
            <div className="mt-1 flex flex-row items-center">
              <span className="text-xxs font-normal tracking-wide text-gray-900">
                {getChainDisplayName(multiProvider, origin, true)}
              </span>
              <ArrowRightIcon className="h-3 w-3" />
              <span className="text-xxs font-normal tracking-wide text-gray-900">
                {getChainDisplayName(multiProvider, destination, true)}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex h-5 w-5">
        {STATUSES_WITH_ICON.includes(status) ? (
          <Image
            src={getIconByTransferStatus(status)}
            width={25}
            height={25}
            alt=""
          />
        ) : (
          <SpinnerIcon className="-ml-1 mr-3 h-5 w-5" />
        )}
      </div>
    </button>
  );
}

const styles = {
  btn: "w-full flex items-center px-1 py-2 text-sm hover:bg-gray-200 active:scale-95 transition-all duration-500 cursor-pointer rounded-sm",
};
