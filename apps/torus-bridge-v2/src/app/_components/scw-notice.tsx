import { Info } from "lucide-react";

const DISCORD_URL = "https://discord.gg/PLACEHOLDER";

export function ScwNotice() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
        <div>
          <p className="font-medium">Smart contract wallet detected</p>
          <p className="text-muted-foreground mt-1">
            Automated claiming is not available for smart contract wallets
            (Safe, Coinbase Smart Wallet, etc.). Please contact support on
            Discord to process your claim manually.
          </p>
        </div>
      </div>
      <a
        href={DISCORD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-400 underline"
      >
        Contact support on Discord
      </a>
    </div>
  );
}
