import type { ChainName } from "@hyperlane-xyz/sdk";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useMultiProvider } from "~/hooks/use-multi-provider";

export function ToastTxSuccess(msg: string, txHash: string, chain: ChainName) {
  const { toast } = useToast();
  toast({
    title: "Success!",
    description: <TxSuccessToast msg={msg} txHash={txHash} chain={chain} />,
    duration: 12000,
  });
}

export function TxSuccessToast({
  msg,
  txHash,
  chain,
}: Readonly<{
  msg: string;
  txHash: string;
  chain: ChainName;
}>) {
  const multiProvider = useMultiProvider();
  const url = multiProvider.tryGetExplorerTxUrl(chain, { hash: txHash });

  return (
    <div>
      {msg + " "}
      {url && (
        <a
          className="underline"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in Explorer
        </a>
      )}
    </div>
  );
}
