import { useFormikContext } from "formik";
import type { TransferFormValues } from "~/utils/types";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@torus-ts/ui";

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
    <Button size="icon" variant="ghost" onClick={onClick} disabled={disabled}>
      <ArrowLeftRight className="h-4 w-4" />
    </Button>
  );
}
