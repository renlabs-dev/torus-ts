const DISCORD_URL = "https://discord.gg/PLACEHOLDER";

export function ScwFootnote() {
  return (
    <p className="text-muted-foreground mt-3 text-center text-xs">
      Smart contract wallets (Safe, Coinbase Wallet) require manual processing.{" "}
      <a
        href={DISCORD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-foreground underline underline-offset-2 transition-colors"
      >
        Contact the team on Discord
      </a>{" "}
      with your contract address to verify custody and claim.
    </p>
  );
}
