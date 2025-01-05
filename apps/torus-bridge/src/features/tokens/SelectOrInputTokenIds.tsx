import { useFormikContext } from "formik";

import type { TransferFormValues } from "../../utils/types";
import { SelectTokenIdField } from "./SelectTokenIdField";
import { TextField } from "~/app/_components/text-field";

// import { useContractSupportsTokenByOwner, useIsSenderNftOwner } from './balances';

export function SelectOrInputTokenIds({ disabled }: { disabled: boolean }) {
  const {
    values: { tokenIndex },
  } = useFormikContext<TransferFormValues>();
  // const accountAddress = useAccountAddressForChain(origin);
  // const { isContractAllowToGetTokenIds } = useContractSupportsTokenByOwner(
  //   activeToken,
  //   accountAddress,
  // );
  const isContractAllowToGetTokenIds = true;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return isContractAllowToGetTokenIds ? (
    <SelectTokenIdField
      name="amount"
      disabled={disabled}
      tokenIndex={tokenIndex}
    />
  ) : (
    <InputTokenId disabled={disabled} tokenIndex={tokenIndex} />
  );
}

function InputTokenId({
  disabled,
}: {
  disabled: boolean;
  tokenIndex?: number;
}) {
  // const {
  //   values: { amount },
  // } = useFormikContext<TransferFormValues>();
  // useIsSenderNftOwner(token, amount);

  return (
    <div className="relative w-full">
      <TextField
        name="amount"
        placeholder="Input Token Id"
        className="w-full"
        type="number"
        step="any"
        disabled={disabled}
      />
    </div>
  );
}
