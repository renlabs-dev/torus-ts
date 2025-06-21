import type { ChainName } from "@hyperlane-xyz/sdk";
import { ProtocolType } from "@hyperlane-xyz/utils";
import { useAccountForChain, useConnectFns } from "@hyperlane-xyz/widgets";
import { Button } from "@torus-ts/ui/components/button";
import { Loading } from "@torus-ts/ui/components/loading";
import { useChainProtocol } from "~/hooks/chain/use-chain-protocol";
import { useMultiProvider } from "~/hooks/use-multi-provider";
import { useFormikContext } from "formik";
import { useCallback, useEffect, useRef } from "react";

interface Props {
  chainName: ChainName;
  text: string;
  isLoading?: boolean;
}

export function ConnectAwareSubmitButton<FormValues = unknown>({
  chainName,
  text,
  isLoading = false,
}: Readonly<Props>) {
  const protocol = useChainProtocol(chainName) ?? ProtocolType.Ethereum;
  const connectFns = useConnectFns();
  const connectFn = connectFns[protocol];

  const multiProvider = useMultiProvider();
  const account = useAccountForChain(multiProvider, chainName);
  const isAccountReady = account?.isReady;

  const { errors, setErrors, touched, setTouched } =
    useFormikContext<FormValues>();

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hasError =
    Object.keys(touched).length > 0 && Object.keys(errors).length > 0;

  const variant = hasError ? "destructive" : "default";
  const accountReadyContent = isAccountReady ? text : "Connect wallet";
  const content = hasError ? "Please fix errors above" : accountReadyContent;

  const type = hasError || !isAccountReady ? "button" : "submit";

  const clearErrors = useCallback(() => {
    setErrors({});
    void setTouched({});
  }, [setErrors, setTouched]);

  const handleClick = useCallback(() => {
    if (isAccountReady) {
      if (hasError) return;
      else connectFn();
    }
  }, [isAccountReady, hasError, connectFn]);

  useEffect(() => {
    if (hasError) {
      timeoutRef.current = setTimeout(() => {
        clearErrors();
      }, 2000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [hasError, clearErrors]);

  return (
    <Button
      type={type}
      variant={variant}
      onClick={handleClick}
      className="w-full transition-all duration-200 ease-in-out"
      disabled={isLoading}
      title={
        hasError
          ? "Errors will clear automatically in 2 seconds"
          : isLoading
            ? "Validating form..."
            : undefined
      }
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Loading className="h-4 w-4 animate-spin" />
          <span>Validating...</span>
        </div>
      ) : (
        <span className="transition-opacity duration-200">{content}</span>
      )}
    </Button>
  );
}
