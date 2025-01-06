import type { ChainMetadata, ChainName } from "@hyperlane-xyz/sdk";
import type { ChainSearchMenuProps } from "@hyperlane-xyz/widgets";
import { ChainSearchMenu } from "@hyperlane-xyz/widgets";
import { useStore } from "~/utils/store";

// TODO: Remove
export function ChainSelectListModal({
  close,
  onSelect,
  customListItemField,
  showChainDetails,
}: {
  isOpen: boolean;
  close: () => void;
  onSelect: (chain: ChainName) => void;
  customListItemField?: ChainSearchMenuProps["customListItemField"];
  showChainDetails?: ChainSearchMenuProps["showChainDetails"];
}) {
  const { chainMetadata, chainMetadataOverrides, setChainMetadataOverrides } =
    useStore((s) => ({
      chainMetadata: s.chainMetadata,
      chainMetadataOverrides: s.chainMetadataOverrides,
      setChainMetadataOverrides: s.setChainMetadataOverrides,
    }));

  const onSelectChain = (chain: ChainMetadata) => {
    onSelect(chain.name);
    close();
  };

  return (
    <ChainSearchMenu
      chainMetadata={chainMetadata}
      onClickChain={onSelectChain}
      overrideChainMetadata={chainMetadataOverrides}
      onChangeOverrideMetadata={setChainMetadataOverrides}
      customListItemField={customListItemField}
      defaultSortField="custom"
      showChainDetails={showChainDetails}
    />
  );
}
