import {
  getIndexForToken,
  getTokenByIndex,
  useWarpCore,
} from "../../../hooks/token";
import type { TransferFormValues } from "../../../utils/types";
import { TokenListModal } from "./token-list-modal";
import type { IToken } from "@hyperlane-xyz/sdk";
import { ChevronIcon } from "@hyperlane-xyz/widgets";
import { Button } from "@torus-ts/ui";
import { useField, useFormikContext } from "formik";
import { useEffect, useState } from "react";
import { TokenIcon } from "~/app/_components/token-icon";

interface Props {
  name: string;
  disabled?: boolean;
}

export function TokenSelectField({ name, disabled }: Props) {
  const { values } = useFormikContext<TransferFormValues>();
  const [field, , helpers] = useField<number | undefined>(name);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAutomaticSelection, setIsAutomaticSelection] = useState(false);

  const warpCore = useWarpCore();

  const { origin, destination } = values;
  useEffect(() => {
    const tokensWithRoute = warpCore.getTokensForRoute(origin, destination);
    let newFieldValue: number | undefined;
    let newIsAutomatic: boolean;
    // No tokens available for this route
    if (tokensWithRoute.length === 0) {
      newFieldValue = undefined;
      newIsAutomatic = true;
    }
    // Exactly one found
    else if (tokensWithRoute.length === 1) {
      newFieldValue = getIndexForToken(warpCore, tokensWithRoute[0]);
      newIsAutomatic = true;
      // Multiple possibilities
    } else {
      newFieldValue = undefined;
      newIsAutomatic = false;
    }
    void helpers.setValue(newFieldValue);
    setIsAutomaticSelection(newIsAutomatic);
  }, [warpCore, origin, destination, helpers]);

  const onSelectToken = (newToken: IToken) => {
    // Set the token address value in formik state
    void helpers.setValue(getIndexForToken(warpCore, newToken));
  };

  const onClickField = () => {
    if (!disabled && !isAutomaticSelection) setIsModalOpen(true);
  };

  return (
    <>
      <TokenButton
        token={getTokenByIndex(warpCore, field.value)}
        disabled={isAutomaticSelection || disabled}
        onClick={onClickField}
        isAutomatic={isAutomaticSelection}
      />
      <TokenListModal
        isOpen={isModalOpen}
        close={() => setIsModalOpen(false)}
        onSelect={onSelectToken}
        origin={values.origin}
        destination={values.destination}
      />
    </>
  );
}

function TokenButton({
  token,
  disabled,
  onClick,
  isAutomatic,
}: {
  token?: IToken;
  disabled?: boolean;
  onClick?: () => void;
  isAutomatic?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
    >
      <div className="flex items-center">
        {token && <TokenIcon token={token} size={20} />}
        <span className={`ml-2 ${!token?.symbol && "text-slate-400"}`}>
          {token?.symbol ??
            (isAutomatic ? "No routes available" : "Select Token")}
        </span>
      </div>
      {!isAutomatic && <ChevronIcon width={12} height={8} direction="s" />}
    </Button>
  );
}
