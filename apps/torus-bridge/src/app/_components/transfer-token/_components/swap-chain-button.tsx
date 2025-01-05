import { useFormikContext } from "formik";
import { IconButton, SwapIcon } from "@hyperlane-xyz/widgets";
import type { TransferFormValues } from "~/utils/types";

export function SwapChainsButton({ disabled }: { disabled?: boolean }) {
  const { values, setFieldValue } = useFormikContext<TransferFormValues>();
  const { origin, destination } = values;

  const onClick = () => {
    if (disabled) return;
    void setFieldValue("origin", destination);
    void setFieldValue("destination", origin);
    // Reset other fields on chain change
    void setFieldValue("tokenIndex", undefined);
    void setFieldValue("recipient", "");
  };

  return (
    <IconButton
      width={20}
      height={20}
      title="Swap chains"
      className={!disabled ? "hover:rotate-180" : undefined}
      onClick={onClick}
      disabled={disabled}
    >
      <SwapIcon width={20} height={20} />
    </IconButton>
  );
}
