import type { ChainMetadata, ChainName } from "@hyperlane-xyz/sdk";
import type { ChainSearchMenuProps } from "@hyperlane-xyz/widgets";
import { ChainSearchMenu, Modal } from "@hyperlane-xyz/widgets";
import { useStore } from "~/utils/store";

export function ChainSelectListModal({
  isOpen,
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
    <div className="absolute z-50">
      <Modal
        isOpen={isOpen}
        close={close}
        panelClassname="p-4 sm:p-5 max-w-lg min-h-[40vh]"
      >
        <ChainSearchMenu
          chainMetadata={chainMetadata}
          onClickChain={onSelectChain}
          overrideChainMetadata={chainMetadataOverrides}
          onChangeOverrideMetadata={setChainMetadataOverrides}
          customListItemField={customListItemField}
          defaultSortField="custom"
          showChainDetails={showChainDetails}
        />
      </Modal>
    </div>
  );
}
