import { Button } from "@torus-ts/ui/components/button";
import { updateSearchParams } from "~/utils/query-params";
import { useTransferFormContext } from "./transfer-form-context";
import { ArrowLeftRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export function SwapChainsButton({
  disabled,
}: Readonly<{ disabled?: boolean }>) {
  const { watch, setValue } = useTransferFormContext();
  const values = watch();
  const { origin, destination } = values;
  const searchParams = useSearchParams();
  const router = useRouter();

  const onClick = () => {
    if (disabled) return;

    const newFrom = destination;
    const newTo = origin;

    setValue("origin", newFrom);
    setValue("destination", newTo);
    setValue("tokenIndex", undefined);
    setValue("recipient", "");

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
