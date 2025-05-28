import type { ChainName } from "@hyperlane-xyz/sdk";
import { Button } from "@torus-ts/ui/components/button";
import { Label } from "@torus-ts/ui/components/label";
import { useChainDisplayName } from "~/hooks/chain/use-chain-display-name";
import { useField } from "formik";
import { ChainLogo } from "../chain-logo";

interface Props {
  name: string;
  label: string;
}

export function ChainSelectField({ name, label }: Readonly<Props>) {
  const [field] = useField<ChainName>(name);

  const displayName = useChainDisplayName(field.value, true);

  return (
    <div className="flex w-full flex-col gap-2">
      <Label>{label}</Label>
      <Button
        size="lg"
        variant="outline"
        disabled={true}
        className="hover:bg-background flex w-full items-center justify-between p-0
          hover:cursor-default disabled:opacity-100"
      >
        <div className="max-w-[1.4rem] border-r p-[0.65em] sm:max-w-fit">
          <ChainLogo chainName={field.value} size={28} />
        </div>
        <span className="w-full">{displayName}</span>
      </Button>
    </div>
  );
}
