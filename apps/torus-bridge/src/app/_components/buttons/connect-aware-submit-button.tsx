import type { ChainName } from "@hyperlane-xyz/sdk";
import { ProtocolType } from "@hyperlane-xyz/utils";
import { useAccountForChain, useConnectFns } from "@hyperlane-xyz/widgets";
import { Button } from "@torus-ts/ui/components/button";
import type { FieldErrors } from "react-hook-form";
import { useChainProtocol } from "~/hooks/chain/use-chain-protocol";
import { useMultiProvider } from "~/hooks/use-multi-provider";
import type { TransferFormValues } from "~/utils/types";

interface Props {
  chainName: ChainName;
  text: string;
  errors?: FieldErrors<TransferFormValues>;
  disabled?: boolean;
}

export function ConnectAwareSubmitButton({
  chainName,
  text,
  errors,
  disabled,
}: Readonly<Props>) {
  const protocol = useChainProtocol(chainName) ?? ProtocolType.Ethereum;
  const connectFns = useConnectFns();
  const connectFn = connectFns[protocol];

  const multiProvider = useMultiProvider();
  const account = useAccountForChain(multiProvider, chainName);
  const isAccountReady = account?.isReady;

  const hasError = errors && Object.keys(errors).length > 0;
  const firstError = errors
    ? (Object.values(errors)[0]?.message ?? "Unknown error")
    : "";

  const variant = hasError ? "destructive" : "default";
  const accountReadyContent = isAccountReady ? text : "Connect wallet";
  const content = hasError ? String(firstError) : accountReadyContent;
  const type = isAccountReady ? "submit" : "button";
  const onClick = isAccountReady ? undefined : connectFn;

  return (
    <Button
      type={type}
      variant={variant}
      onClick={onClick}
      className="w-full"
      disabled={disabled}
    >
      {content}
    </Button>
  );
}
