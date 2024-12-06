export function NoWalletExtensionDisplay() {
  return (
    <div className="flex h-full flex-col gap-3 p-3 text-sm">
      <div className="flex flex-col gap-4">
        <b className="text-red-400">No wallet found.</b>
        <p className="text-foreground">
          To use this app you must enable your existing wallet.
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-foreground">Need a wallet?</p>

        <a
          className="text-blue-600"
          href="https://docs.torus.network/installation/setup-wallet"
          rel="noreferrer"
          target="_blank"
        >
          Setup your wallet
        </a>
      </div>
    </div>
  );
}
