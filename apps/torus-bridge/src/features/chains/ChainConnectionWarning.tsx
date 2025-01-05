import type { ChainMetadata, ChainName } from "@hyperlane-xyz/sdk";
import { isRpcHealthy } from "@hyperlane-xyz/sdk";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { logger } from "../../utils/logger";
import { ChainSelectListModal } from "./ChainSelectModal";
import { useMultiProvider } from "~/hooks/use-multi-provider";
import { getChainDisplayName } from "./utils";
import { FormWarningBanner } from "~/app/components/banner/FormWarningBanner";

export function ChainConnectionWarning({
  origin,
  destination,
}: {
  origin: ChainName;
  destination: ChainName;
}) {
  const multiProvider = useMultiProvider();
  const originMetadata = multiProvider.getChainMetadata(origin);
  const destinationMetadata = multiProvider.getChainMetadata(destination);

  const { data } = useQuery({
    queryKey: ["ChainConnectionWarning", originMetadata, destinationMetadata],
    queryFn: async () => {
      const isOriginHealthy = await checkRpcHealth(originMetadata);
      const isDestinationHealthy = await checkRpcHealth(destinationMetadata);
      return { isOriginHealthy, isDestinationHealthy };
    },
    refetchInterval: 5000,
  });

  const unhealthyChain =
    data &&
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    ((!data.isOriginHealthy && originMetadata) ||
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      (!data.isDestinationHealthy && destinationMetadata) ||
      undefined);

  const displayName = getChainDisplayName(
    multiProvider,
    unhealthyChain?.name ?? originMetadata.name,
    true,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  const onClickEdit = () => {
    if (!unhealthyChain) return;
    setIsModalOpen(true);
  };

  return (
    <>
      <FormWarningBanner
        isVisible={!!unhealthyChain}
        cta="Edit"
        onClick={onClickEdit}
      >
        {`Connection to ${displayName} is unstable. Consider adding a more reliable RPC URL.`}
      </FormWarningBanner>
      <ChainSelectListModal
        isOpen={isModalOpen}
        close={() => setIsModalOpen(false)}
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onSelect={() => {}}
        showChainDetails={unhealthyChain?.name}
      />
    </>
  );
}

async function checkRpcHealth(chainMetadata: ChainMetadata) {
  try {
    // Note: this currently checks the health of only the first RPC,
    // which is what wallets and wallet libs (e.g. wagmi) will use
    const isHealthy = await isRpcHealthy(chainMetadata, 0);
    return isHealthy;
  } catch (error) {
    logger.warn("Error checking RPC health", error);
    return false;
  }
}
