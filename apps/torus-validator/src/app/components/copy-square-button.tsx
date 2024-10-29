"use client";

import { toast } from "@torus-ts/providers/use-toast";
import { copyToClipboard } from "@torus-ts/utils";
import { Copy } from "lucide-react";

interface CopySquareButtonProps {
  address: string;
}

export function CopySquareButton(props: CopySquareButtonProps) {
  function handleCopy() {
    copyToClipboard(props.address);
    toast.success("Copied to clipboard");
  }
  return (
    <button
      className="border border-white/20 bg-[#898989]/5 p-2 backdrop-blur-md transition duration-200 hover:border-green-500 hover:bg-green-500/10"
      onClick={handleCopy}
    >
      <Copy className="h-6 w-6 text-gray-400 transition duration-200 hover:text-green-500" />
    </button>
  );
}
