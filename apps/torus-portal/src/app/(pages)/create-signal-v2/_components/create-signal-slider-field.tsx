import { useTorus } from "@torus-ts/torus-provider";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Slider } from "@torus-ts/ui/components/slider";

import { api } from "~/trpc/react";

export function CreateSignalSliderField({
  field,
}: {
  field: {
    value: number;
    onChange: (value: number) => void;
  };
}) {
  const { selectedAccount, isAccountConnected } = useTorus();

  const existingSignals = api.signal.byCreatorId.useQuery(
    { creatorId: selectedAccount?.address ?? "" },
    { enabled: isAccountConnected },
  );

  const totalExistingAllocation = existingSignals.data?.reduce(
    (total, signal) => total + signal.proposedAllocation,
    0,
  );

  const maxAllowedAllocation = Math.max(
    0,
    100 - (totalExistingAllocation ?? 0),
  );

  return (
    <FormItem>
      <FormLabel>Proposed Allocation (%)</FormLabel>
      <FormControl>
        <Slider
          value={[field.value || 0]}
          onValueChange={([value]) =>
            field.onChange(Math.min(value ?? 0, maxAllowedAllocation))
          }
          max={maxAllowedAllocation}
          min={0}
          step={1}
          className="-mt-3 -mb-2"
          disabled={!isAccountConnected}
        />
      </FormControl>
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">
          Available: <span className="text-white">{maxAllowedAllocation}%</span>
        </span>
        <span className="text-md font-medium">{field.value || 0}%</span>
      </div>
      {totalExistingAllocation ? (
        <div className="text-xs text-muted-foreground mt-1">
          You have already allocated {totalExistingAllocation}% across{" "}
          {existingSignals.data?.length} signals
        </div>
      ) : null}
      <FormMessage />
    </FormItem>
  );
}
