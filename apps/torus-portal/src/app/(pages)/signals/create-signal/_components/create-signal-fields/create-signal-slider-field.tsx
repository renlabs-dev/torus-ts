import React from "react";

import type { inferProcedureOutput } from "@trpc/server";

import type { AppRouter } from "@torus-ts/api";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Slider } from "@torus-ts/ui/components/slider";

interface CreateSignalSliderFieldProps {
  field: {
    value: number;
    onChange: (value: number) => void;
  };
  existingSignals: inferProcedureOutput<AppRouter["signal"]["byCreatorId"]>;
}

export function CreateSignalSliderField(props: CreateSignalSliderFieldProps) {
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
          className="-mt-3 -mb-2"
        />
      </FormControl>
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">
          Available: <span className="text-white">{maxAllowedAllocation}%</span>
        </span>
        <span className="text-md font-medium">{props.field.value || 0}%</span>
      </div>
      {totalExistingAllocation ? (
        <div className="text-xs text-muted-foreground mt-1">
          You have already allocated {totalExistingAllocation}% across{" "}
          {props.existingSignals.length} signals
        </div>
      ) : null}
      <FormMessage />
    </FormItem>
  );
}
