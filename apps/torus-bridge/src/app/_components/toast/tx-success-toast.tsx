import type { ChainName } from "@hyperlane-xyz/sdk";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useMultiProvider } from "~/hooks/use-multi-provider";

interface TxSuccessContentProps {
  msg: string;
  txHash: string;
  chain: ChainName;
}

const TxSuccessContent = ({ msg, txHash, chain }: TxSuccessContentProps) => {
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
};

export const useTxSuccessToast = () => {
  const { toast } = useToast();

  return (msg: string, txHash: string, chain: ChainName) => {
    toast({
      title: "Success!",
      description: <TxSuccessContent msg={msg} txHash={txHash} chain={chain} />,
      duration: 12000,
    });
  };
};
