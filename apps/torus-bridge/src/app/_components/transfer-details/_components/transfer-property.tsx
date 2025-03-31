import { CopyButton } from "@hyperlane-xyz/widgets";
import { smallAddress } from "@torus-network/torus-utils/subspace";
import { LinkIcon } from "lucide-react";

export function TransferProperty({
  name,
  value,
  url,
}: Readonly<{
  name: string;
  value: string;
  url?: string;
}>) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-gray-350 text-sm leading-normal tracking-wider">
          {name}
        </label>
        <div className="flex items-center space-x-2">
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer">
              <LinkIcon className="h-3 w-3" />
            </a>
          )}
          <CopyButton
            copyValue={value}
            width={14}
            height={14}
            className="opacity-40"
          />
        </div>
      </div>
      <div className="mt-1 truncate text-sm leading-normal tracking-wider text-zinc-400">
        {smallAddress(value, 21)}
      </div>
    </div>
  );
}
