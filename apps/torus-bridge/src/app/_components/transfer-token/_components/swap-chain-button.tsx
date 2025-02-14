import { useFormikContext } from "formik";
import type { TransferFormValues } from "~/utils/types";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@torus-ts/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { updateSearchParams } from "~/utils/query-params";

export function SwapChainsButton({ disabled }: { disabled?: boolean }) {
  const { values, setFieldValue } = useFormikContext<TransferFormValues>();
  const { origin, destination } = values;
  const searchParams = useSearchParams();
  const router = useRouter();

  const onClick = () => {
    if (disabled) return;

    const newFrom = destination;
    const newTo = origin;

    void setFieldValue("origin", newFrom);
    void setFieldValue("destination", newTo);
    void setFieldValue("tokenIndex", undefined);
    void setFieldValue("recipient", "");

    handleChainChange(newFrom, newTo);
  };

  const handleChainChange = (from: string, to: string) => {
    const newQuery = updateSearchParams(searchParams, {
      tab: "base",
      mode: null,
      from,
      to,
    });
    router.push(`/?${newQuery}`);
  };

  return (
    <Button size="icon" variant="ghost" onClick={onClick} disabled={disabled}>
      <ArrowLeftRight className="h-4 w-4" />
    </Button>
  );
}
