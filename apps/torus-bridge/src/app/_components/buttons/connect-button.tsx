import { ConnectButton as RainbowkitConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";

export default function ConnectButton() {
  return (
    <RainbowkitConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="flex items-center gap-2 bg-background p-2 text-sm"
                  >
                    <Wallet className="!h-5 !w-5" />
                    Connect Base Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="flex items-center gap-2 bg-background p-2 text-sm"
                  >
                    <Wallet className="!h-5 !w-5" />
                    Wrong network
                  </button>
                );
              }

              return (
                <button
                  onClick={openAccountModal}
                  type="button"
                  className="flex items-center gap-2 bg-background p-2 text-sm"
                >
                  <Wallet className="!h-5 !w-5" />
                  Base ({account.displayName})
                </button>
              );
            })()}
          </div>
        );
      }}
    </RainbowkitConnectButton.Custom>
  );
}
