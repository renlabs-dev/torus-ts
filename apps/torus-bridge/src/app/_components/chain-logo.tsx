import { ChainLogo as ChainLogoInner } from "@hyperlane-xyz/widgets";
import { useChainMetadata } from "~/hooks/chain/use-chain-metadata";
import { useStore } from "~/utils/store";
import Image from "next/image";
import { useMemo } from "react";

export function ChainLogo({
  chainName,
  background,
  size,
}: Readonly<{
  chainName?: string;
  background?: boolean;
  size?: number;
}>) {
  const registry = useStore((s) => s.registry);
  const chainMetadata = useChainMetadata(chainName);
  const { name, Icon } = useMemo(() => {
    const name = chainMetadata?.name ?? "";
    const logoUri = chainMetadata?.logoURI;
    const Icon = logoUri
      ? (props: { width: number; height: number; title?: string }) => (
          <Image src={logoUri} alt="" {...props} />
        )
      : undefined;
    return {
      name,
      Icon,
    };
  }, [chainMetadata]);

  return (
    <ChainLogoInner
      chainName={name}
      registry={registry}
      size={size}
      background={background}
      Icon={Icon}
    />
  );
}
