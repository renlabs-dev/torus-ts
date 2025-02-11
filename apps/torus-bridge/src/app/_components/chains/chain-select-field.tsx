import { useField } from "formik";

import type { ChainName } from "@hyperlane-xyz/sdk";

import { useChainDisplayName } from "~/hooks/chain/use-chain-display-name";

import { Button, Label } from "@torus-ts/ui";
import { ChainLogo } from "../chain-logo";

interface Props {
  name: string;
  label: string;
}

export function ChainSelectField({ name, label }: Props) {
  const [field] = useField<ChainName>(name);

  const displayName = useChainDisplayName(field.value, true);

  return (
    <div className="flex w-full flex-col gap-2">
      <Label>{label}</Label>
      <Button
        size="lg"
        variant="outline"
        disabled={true}
        className="flex w-full items-center justify-between p-0 hover:cursor-default hover:bg-background disabled:opacity-100"
      >
        <div className="max-w-[1.4rem] border-r p-[0.65em] sm:max-w-fit">
          <ChainLogo chainName={field.value} size={28} />
        </div>
        <span className="w-full">{displayName}</span>
      </Button>
    </div>
  );
}
