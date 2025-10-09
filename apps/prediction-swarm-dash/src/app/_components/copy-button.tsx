import { Copy } from "lucide-react";
import React from "react";
import { formatAddress } from "@/lib/api-utils";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  return (
    <span className="text-sm text-muted-foreground">
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
        <span>{formatAddress(text)}</span>
        <button
          type="button"
          onClick={handleCopy}
          className={`flex items-center gap-1 transition-colors cursor-pointer ${
            copied ? "text-blue-200" : "hover:text-blue-200"
          }`}
          title="Copy full address"
        >
          <Copy className="h-3 w-3" />
          <span className="text-xs">{copied ? "copied" : "copy"}</span>
        </button>
      </div>
    </span>
  );
}
