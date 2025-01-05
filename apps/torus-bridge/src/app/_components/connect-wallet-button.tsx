import { ConnectWalletButton as ConnectWalletButtonInner } from "@hyperlane-xyz/widgets";

import { useStore } from "~/features/store";
import { useMultiProvider } from "~/hooks/use-multi-provider";

export function ConnectWalletButton() {
  const multiProvider = useMultiProvider();

  const { setShowEnvSelectModal, setIsSideBarOpen } = useStore((s) => ({
    setShowEnvSelectModal: s.setShowEnvSelectModal,
    setIsSideBarOpen: s.setIsSideBarOpen,
  }));

  return (
    <ConnectWalletButtonInner
      multiProvider={multiProvider}
      onClickWhenUnconnected={() => setShowEnvSelectModal(true)}
      onClickWhenConnected={() => setIsSideBarOpen(true)}
      className="rounded-lg bg-black"
      countClassName="bg-accent-500"
    />
  );
}
