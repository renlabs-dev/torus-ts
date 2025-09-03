import type { AppRouter } from "@torus-ts/api";
import { useTorus } from "@torus-ts/torus-provider";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Slider } from "@torus-ts/ui/components/slider";
import type { inferProcedureOutput } from "@trpc/server";
import { useMultipleAccountEmissions } from "~/hooks/use-multiple-account-emissions";
import { calculateStreamValue } from "~/utils/calculate-stream-value";
import React from "react";

interface CreateSignalSliderFieldProps {
  field: {
    value: number;
    onChange: (value: number) => void;
  };
  existingSignals: inferProcedureOutput<AppRouter["signal"]["byCreatorId"]>;
}

export function CreateSignalSliderField(props: CreateSignalSliderFieldProps) {
  const { selectedAccount, isAccountConnected } = useTorus();

  const emissionsData = useMultipleAccountEmissions({
    accountIds: selectedAccount?.address ? [selectedAccount.address] : [],
  });

  const accountEmissions = selectedAccount?.address
    ? emissionsData[selectedAccount.address]
    : null;

  const totalExistingAllocation = props.existingSignals.reduce(
    (total, signal) => total + signal.proposedAllocation,
    0,
  );

  const maxAllowedAllocation = Math.max(0, 100 - totalExistingAllocation);

  return (
    <FormItem>
      <FormLabel>Proposed Allocation</FormLabel>
      <FormControl>
        <Slider
          value={[props.field.value || 0]}
          onValueChange={([value]) =>
            props.field.onChange(Math.min(value ?? 0, maxAllowedAllocation))
          }
          max={maxAllowedAllocation}
          min={0}
          step={1}
          className="-mb-2 -mt-3"
        />
      </FormControl>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Available: <span className="text-white">{maxAllowedAllocation}%</span>
        </span>
        <span className="text-md font-medium">
          {props.field.value || 0}% (
          {calculateStreamValue(
            props.field.value || 0,
            accountEmissions,
            isAccountConnected,
            selectedAccount?.address,
          )}
          )
        </span>
      </div>
      {totalExistingAllocation ? (
        <div className="text-muted-foreground mt-1 text-xs">
          You have already allocated {totalExistingAllocation}% (
          {calculateStreamValue(
            totalExistingAllocation,
            accountEmissions,
            isAccountConnected,
            selectedAccount?.address,
          )}
          ) across {props.existingSignals.length} signals
        </div>
      ) : null}
      <FormMessage />
    </FormItem>
  );
}
