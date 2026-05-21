import { AlertCircle } from "lucide-react";

interface MerkleRootErrorBannerProps {
  localRoot: string;
  contractRoot: string;
}

export function MerkleRootErrorBanner({
  localRoot: _localRoot,
  contractRoot: _contractRoot,
}: Readonly<MerkleRootErrorBannerProps>) {
  return (
    <div className="border-destructive bg-destructive/10 text-destructive mb-4 flex items-start gap-2 rounded border p-3 text-sm">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-semibold">Proof data mismatch</p>
        <p className="mt-1 text-xs opacity-80">
          The local proof files do not match the on-chain merkle root. Claims
          are disabled until proof data is updated. If this persists, contact
          support.
        </p>
      </div>
    </div>
  );
}
