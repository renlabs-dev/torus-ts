import { ConnectButton as RainbowkitConnectButton } from "@rainbow-me/rainbowkit";
import { Button, Card, Label } from "@torus-ts/ui";
import { Wallet } from "lucide-react";

export default function ConnectButton() {
  return (
    <Card className="p-6">
      <Label>EVM Wallet</Label>
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
                    <Button
                      onClick={openConnectModal}
                      type="button"
                      className="mt-2 w-full"
                    >
                      Connect Wallet
                    </Button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <Button
                      onClick={openChainModal}
                      type="button"
                      className="mt-2 w-full"
                    >
                      Wrong network
                    </Button>
                  );
                }

                return (
                  <div style={{ display: "flex", gap: 12 }}>
                    <Button
                      onClick={openAccountModal}
                      type="button"
                      variant="outline"
                      className="mt-2 w-full"
                    >
                      <Wallet className="h-3 w-3" />
                      {account.displayName}
                      {account.displayBalance
                        ? ` (${account.displayBalance})`
                        : ""}
                    </Button>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </RainbowkitConnectButton.Custom>
    </Card>
  );
}
