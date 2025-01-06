import type { ChainSearchMenuProps } from "@hyperlane-xyz/widgets";
import { useField } from "formik";

import type { ChainName } from "@hyperlane-xyz/sdk";

import { useChainDisplayName } from "~/hooks/chain/use-chain-display-name";

import { ChainLogo } from "../chain-logo";
import { Button, Dialog, Label } from "@torus-ts/ui";

interface Props {
  name: string;
  label: string;
  onChange?: (id: ChainName) => void;
  disabled?: boolean;
  customListItemField: ChainSearchMenuProps["customListItemField"];
}

export function ChainSelectField({ name, label }: Props) {
  const [field] = useField<ChainName>(name);

  const displayName = useChainDisplayName(field.value, true);

  return (
    <div className="flex w-full flex-col gap-2">
      <Dialog>
        <Label>{label}</Label>
        <Button
          size="lg"
          variant="outline"
          className="flex w-full items-center justify-center gap-3"
        >
          <div className="max-w-[1.4rem] sm:max-w-fit">
            <ChainLogo chainName={field.value} size={26} />
          </div>
          {displayName}
        </Button>
        {/* <ChainSelectListModal
            isOpen={isModalOpen}
            close={() => setIsModalOpen(false)}
            onSelect={handleChange}
            customListItemField={customListItemField}
          /> */}
      </Dialog>
    </div>
  );
}
