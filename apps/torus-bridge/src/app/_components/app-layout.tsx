import { MultiProtocolWalletModal } from "@hyperlane-xyz/widgets";

import type { PropsWithChildren } from "react";

import { SideBarMenu } from "./side-bar-menu";
import { useStore } from "~/utils/store";

export function AppLayout({ children }: PropsWithChildren) {
  const {
    isSideBarOpen,
    showEnvSelectModal,
    setIsSideBarOpen,
    setShowEnvSelectModal,
  } = useStore((s) => ({
    isSideBarOpen: s.isSideBarOpen,
    showEnvSelectModal: s.showEnvSelectModal,
    setIsSideBarOpen: s.setIsSideBarOpen,
    setShowEnvSelectModal: s.setShowEnvSelectModal,
  }));

  return (
    <>
      <MultiProtocolWalletModal
        isOpen={showEnvSelectModal}
        close={() => setShowEnvSelectModal(false)}
      />
      <div className="mt-6 flex flex-col items-end gap-2 md:flex-row-reverse md:items-start">
        <SideBarMenu
          onClose={() => setIsSideBarOpen(false)}
          isOpen={isSideBarOpen}
          onClickConnectWallet={() => setShowEnvSelectModal(true)}
        />
      </div>

      <div
        id="app-content"
        className="min-w-screen relative flex h-full min-h-screen w-full flex-col justify-between"
      >
        <div className="mx-auto flex max-w-screen-xl grow items-center sm:px-4">
          <main className="my-4 flex w-full flex-1 items-center justify-center">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
