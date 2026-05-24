import { Info } from "lucide-react";

const DISCORD_URL = "https://discord.gg/SS2kBerKZg";

export function ScwNotice() {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-start gap-2">
        <Info className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">Smart contract wallet detected</p>
          <p className="text-muted-foreground mt-1">
            This wallet type cannot self-claim. Contact the team on Discord to
            process your claim manually.
          </p>
        </div>
      </div>
      <a
        href={DISCORD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-foreground ml-6 text-xs underline underline-offset-2 transition-colors"
      >
        Contact on Discord →
      </a>
    </div>
  );
}
