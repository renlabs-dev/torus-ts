import { MultiProtocolWalletModal } from "@hyperlane-xyz/widgets";

import type { PropsWithChildren } from "react";

import { Header } from "../nav/Header";
import { useStore } from "~/features/store";
import { BACKGROUND_COLOR, BACKGROUND_IMAGE } from "~/consts/app";
import { SideBarMenu } from "~/features/wallet/SideBarMenu";

export function AppLayout({ children }: PropsWithChildren) {
  const {
    showEnvSelectModal,
    setShowEnvSelectModal,
    isSideBarOpen,
    setIsSideBarOpen,
  } = useStore((s) => ({
    showEnvSelectModal: s.showEnvSelectModal,
    setShowEnvSelectModal: s.setShowEnvSelectModal,
    isSideBarOpen: s.isSideBarOpen,
    setIsSideBarOpen: s.setIsSideBarOpen,
  }));

  return (
    <>
      <div
        style={styles.container}
        id="app-content"
        className="min-w-screen relative flex h-full min-h-screen w-full flex-col justify-between"
      >
        <Header />
        <div className="mx-auto flex max-w-screen-xl grow items-center sm:px-4">
          <main className="my-4 flex w-full flex-1 items-center justify-center">
            {children}
          </main>
        </div>
      </div>

      <MultiProtocolWalletModal
        isOpen={showEnvSelectModal}
        close={() => setShowEnvSelectModal(false)}
      />
      <SideBarMenu
        onClose={() => setIsSideBarOpen(false)}
        isOpen={isSideBarOpen}
        onClickConnectWallet={() => setShowEnvSelectModal(true)}
      />
    </>
  );
}

const styles = {
  container: {
    backgroundColor: BACKGROUND_COLOR,
    backgroundImage: BACKGROUND_IMAGE,
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
  },
};
