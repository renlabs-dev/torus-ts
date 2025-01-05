import type { ChainSearchMenuProps } from "@hyperlane-xyz/widgets";
import { ChevronIcon } from "@hyperlane-xyz/widgets";
import { useField, useFormikContext } from "formik";
import { useState } from "react";

import { ChainSelectListModal } from "./chain-select-modal";

import type { ChainName } from "@hyperlane-xyz/sdk";

import { useChainDisplayName } from "~/hooks/chain/use-chain-display-name";
import type { TransferFormValues } from "~/utils/types";
import { ChainLogo } from "../chain-logo";
import { Button } from "@torus-ts/ui";

interface Props {
  name: string;
  label: string;
  onChange?: (id: ChainName) => void;
  disabled?: boolean;
  customListItemField: ChainSearchMenuProps["customListItemField"];
}

export function ChainSelectField({
  name,
  label,
  onChange,
  disabled,
  customListItemField,
}: Props) {
  const [field, , helpers] = useField<ChainName>(name);
  const { setFieldValue } = useFormikContext<TransferFormValues>();

  const displayName = useChainDisplayName(field.value, true);

  const handleChange = (chainName: ChainName) => {
    void helpers.setValue(chainName);
    // Reset other fields on chain change
    void setFieldValue("recipient", "");
    void setFieldValue("amount", "");
    void setFieldValue("tokenIndex", undefined);
    if (onChange) onChange(chainName);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const onClick = () => {
    if (!disabled) setIsModalOpen(true);
  };

  return (
    <div className="flex-[4]">
      <Button type="button" name={field.name} onClick={onClick}>
        <div className="flex items-center gap-3">
          <div className="max-w-[1.4rem] sm:max-w-fit">
            <ChainLogo chainName={field.value} size={32} />
          </div>
          <div className="flex flex-col items-start gap-1">
            <label htmlFor={name} className="text-xs text-gray-600">
              {label}
            </label>
            {displayName}
          </div>
        </div>
        <ChevronIcon width={12} height={8} direction="s" />
      </Button>
      <ChainSelectListModal
        isOpen={isModalOpen}
        close={() => setIsModalOpen(false)}
        onSelect={handleChange}
        customListItemField={customListItemField}
      />
    </div>
  );
}
