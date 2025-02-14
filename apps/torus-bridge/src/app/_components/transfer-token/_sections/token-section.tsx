import { Label } from "@torus-ts/ui";

import { TokenSelectField } from "~/app/_components/tokens/token-select-field";

export function TokenSection({ isReview }: { isReview: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>Token</Label>
      <TokenSelectField name="tokenIndex" disabled={isReview} />
    </div>
  );
}
