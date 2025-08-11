import type { Control } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { match } from "rustie";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";

import type { EditPermissionFormData } from "../edit-permission-schema";

interface DistributionControlFieldProps {
  control: Control<EditPermissionFormData>;
}

export function DistributionControlField({
  control,
}: DistributionControlFieldProps) {
  const distributionControl = useWatch({
    control,
    name: "newDistributionControl",
  });

  const distributionType = distributionControl
    ? match(distributionControl)({
        Manual: () => "Manual",
        Automatic: () => "Automatic",
        AtBlock: () => "AtBlock",
        Interval: () => "Interval",
      })
    : null;

  return (
    <div className="grid gap-4">
      <FormField
        control={control}
        name="newDistributionControl"
        render={({ field }) => {
          const currentType = field.value
            ? match(field.value)({
                Manual: () => "Manual",
                Automatic: () => "Automatic",
                AtBlock: () => "AtBlock",
                Interval: () => "Interval",
              })
            : "";

          return (
            <FormItem>
              <FormLabel>Distribution Control</FormLabel>
              <Select
                value={currentType}
                onValueChange={(value) => {
                  switch (value) {
                    case "Manual":
                      field.onChange({ Manual: null });
                      break;
                    case "Automatic":
                      field.onChange({ Automatic: 0n });
                      break;
                    case "AtBlock":
                      field.onChange({ AtBlock: 0 });
                      break;
                    case "Interval":
                      field.onChange({ Interval: 0 });
                      break;
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select distribution type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Manual">Manual</SelectItem>
                  <SelectItem value="Automatic">Automatic</SelectItem>
                  <SelectItem value="AtBlock">At Block</SelectItem>
                  <SelectItem value="Interval">Interval</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          );
        }}
      />

      {distributionType === "Automatic" && (
        <FormField
          control={control}
          name="newDistributionControl"
          render={({ field }) => {
            const currentValue =
              field.value && "Automatic" in field.value
                ? field.value.Automatic
                : 0n;
            return (
              <FormItem>
                <FormLabel>Threshold Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter threshold amount"
                    value={currentValue.toString() || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange({ Automatic: value ? BigInt(value) : 0n });
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      )}

      {/* Additional fields for AtBlock distribution */}
      {distributionType === "AtBlock" && (
        <FormField
          control={control}
          name="newDistributionControl"
          render={({ field }) => {
            const currentValue =
              field.value && "AtBlock" in field.value ? field.value.AtBlock : 0;
            return (
              <FormItem>
                <FormLabel>Block Number</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter block number"
                    value={currentValue.toString() || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange({ AtBlock: value ? parseInt(value) : 0 });
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      )}

      {distributionType === "Interval" && (
        <FormField
          control={control}
          name="newDistributionControl"
          render={({ field }) => {
            const currentValue =
              field.value && "Interval" in field.value
                ? field.value.Interval
                : 0;
            return (
              <FormItem>
                <FormLabel>Block Interval</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter block interval"
                    value={currentValue.toString() || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange({ Interval: value ? parseInt(value) : 0 });
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      )}
    </div>
  );
}
