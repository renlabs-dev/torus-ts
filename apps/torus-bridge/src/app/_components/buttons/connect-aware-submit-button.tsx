import { ProtocolType } from "@hyperlane-xyz/utils";
import {
  useAccountForChain,
  useConnectFns,
  useTimeout,
} from "@hyperlane-xyz/widgets";
import { useFormikContext } from "formik";
import { useCallback } from "react";

import { SolidButton } from "./solid-button";
import type { ChainName } from "@hyperlane-xyz/sdk";
import { useChainProtocol } from "~/hooks/chain/use-chain-protocol";
import { useMultiProvider } from "~/hooks/use-multi-provider";

interface Props {
  chainName: ChainName;
  text: string;
  classes?: string;
}

export function ConnectAwareSubmitButton<FormValues = unknown>({
  chainName,
  text,
  classes,
}: Props) {
  const protocol = useChainProtocol(chainName) ?? ProtocolType.Ethereum;
  const connectFns = useConnectFns();
  const connectFn = connectFns[protocol];

  const multiProvider = useMultiProvider();
  const account = useAccountForChain(multiProvider, chainName);
  const isAccountReady = account?.isReady;

  const { errors, setErrors, touched, setTouched } =
    useFormikContext<FormValues>();

  const hasError =
    Object.keys(touched).length > 0 && Object.keys(errors).length > 0;
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  const firstError = `${Object.values(errors)[0]}` || "Unknown error";

  const color = hasError ? "red" : "accent";
  const content = hasError
    ? firstError
    : isAccountReady
      ? text
      : "Connect wallet";
  const type = isAccountReady ? "submit" : "button";
  const onClick = isAccountReady ? undefined : connectFn;

  // Automatically clear error state after a timeout
  const clearErrors = useCallback(() => {
    setErrors({});
    void setTouched({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setErrors, setTouched, errors, touched]);

  useTimeout(clearErrors, 3500);

  return (
    <SolidButton type={type} color={color} onClick={onClick} classes={classes}>
      {content}
    </SolidButton>
  );
}
