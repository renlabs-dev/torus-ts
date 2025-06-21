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
  const isAccountReady = account?.isReady ?? false;

  const { errors, setErrors, touched, setTouched } =
    useFormikContext<FormValues>();

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hasError =
    Object.keys(touched).length > 0 && Object.keys(errors).length > 0;

  const clearErrors = useCallback(() => {
    setErrors({});
    void setTouched({});
  }, [setErrors, setTouched]);

  const handleClick = useCallback(() => {
    if (!isAccountReady) {
      connectFn();
    }
  }, [isAccountReady, connectFn]);

  useEffect(() => {
    if (hasError) {
      timeoutRef.current = setTimeout(clearErrors, 2000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [hasError, clearErrors]);

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <Loading className="h-4 w-4 animate-spin" />
          <span>Validating...</span>
        </div>
      );
    }

    if (hasError) {
      return "Please fix errors above";
    }

    return isAccountReady ? text : "Connect wallet";
  };

  const getButtonProps = () => {
    const baseProps = {
      className: "w-full transition-all duration-200 ease-in-out",
      disabled: isLoading,
      variant: hasError ? ("destructive" as const) : ("default" as const),
    };

    if (hasError || !isAccountReady) {
      return {
        ...baseProps,
        type: "button" as const,
        onClick: handleClick,
        title: hasError
          ? "Errors will clear automatically in 2 seconds"
          : undefined,
      };
    }

    return {
      ...baseProps,
      type: "submit" as const,
      title: isLoading ? "Validating form..." : undefined,
    };
  };

  return (
    <Button {...getButtonProps()}>
      <span className="transition-opacity duration-200">
        {getButtonContent()}
      </span>
    </Button>
  );
}
