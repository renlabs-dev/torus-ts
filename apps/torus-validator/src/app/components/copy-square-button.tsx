"use client";

import { Copy } from "lucide-react";

import { toast } from "@torus-ts/providers/use-toast";
import { copyToClipboard } from "@torus-ts/ui/utils";

interface CopySquareButtonProps {
  address: string;
}

export function CopySquareButton(props: CopySquareButtonProps) {
  async function handleCopy() {
    await copyToClipboard(props.address);
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
