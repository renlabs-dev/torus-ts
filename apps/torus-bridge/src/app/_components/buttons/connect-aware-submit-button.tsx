import type { ChainName } from "@hyperlane-xyz/sdk";
import { ProtocolType } from "@hyperlane-xyz/utils";
import {
  useAccountForChain,
  useConnectFns,
  useTimeout,
} from "@hyperlane-xyz/widgets";
import { Button } from "@torus-ts/ui/components/button";
import { useChainProtocol } from "~/hooks/chain/use-chain-protocol";
import { useMultiProvider } from "~/hooks/use-multi-provider";
import { useCallback } from "react";
import type { FieldErrors } from "react-hook-form";
import type { TransferFormValues } from "~/utils/types";

interface Props {
  chainName: ChainName;
  text: string;
  errors?: FieldErrors<TransferFormValues>;
}

export function ConnectAwareSubmitButton<FormValues = unknown>({
  chainName,
  text,
  errors,
}: Readonly<Props>) {
  const protocol = useChainProtocol(chainName) ?? ProtocolType.Ethereum;
  const connectFns = useConnectFns();
  const connectFn = connectFns[protocol];

  const multiProvider = useMultiProvider();
  const account = useAccountForChain(multiProvider, chainName);
  const isAccountReady = account?.isReady;

  const hasError = errors && Object.keys(errors).length > 0;
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  const firstError = errors
    ? `${Object.values(errors)[0]?.message || Object.values(errors)[0]}` ||
      "Unknown error"
    : "";

  const variant = hasError ? "destructive" : "default";
  const accountReadyContent = isAccountReady ? text : "Connect wallet";
  const content = hasError ? firstError : accountReadyContent;
  const type = isAccountReady ? "submit" : "button";
  const onClick = isAccountReady ? undefined : connectFn;

  // Automatically clear error state after a timeout
  const clearErrors = useCallback(() => {
    // Note: In React Hook Form, errors are managed by the form state
    // This timeout is kept for UI consistency but errors will be cleared
    // when the form is re-validated
  }, []);

  useTimeout(clearErrors, 3500);

  return (
    <Button type={type} variant={variant} onClick={onClick} className="w-full">
      {content}
    </Button>
  );
}
