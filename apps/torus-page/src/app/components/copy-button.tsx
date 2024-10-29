"use client";

import { useState } from "react";lid";
import { Copy } from "lucide-react";

interface CodeComponentProps {
  code: string;
}

export function CopyButton(props: CodeComponentProps): JSX.Element {
  const { code } = props;
  const [copied, setCopied] = useState(false);

  async function copyTextToClipboard(text: string): Promise<boolean> {
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1000);
    if ("clipboard" in navigator) {
      await navigator.clipboard.writeText(text);
    }
    return document.execCommand("copy", true, text);
  }

  return (
    <button
      className={`mt-1 h-8 rounded-md border-[1px] border-gray-700 px-2 text-xs text-gray-500 ${copied ? "border-green-700 text-green-700" : "hover:border-gray-400 hover:text-gray-200"}`}
      onClick={() => void copyTextToClipboard(code)}
      type="button"
    >
      {!copied && <Copy height={16} />}
      {copied ? (
        <Copy color="text-green-500" height={16} />
      ) : null}
    </button>
  );
}
