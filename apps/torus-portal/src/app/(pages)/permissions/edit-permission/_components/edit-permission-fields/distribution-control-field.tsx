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

      {/* Additional fields for Automatic distribution */}
      {distributionType === "Automatic" && (
        <FormField
          control={control}
          name="newDistributionControl.Automatic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Threshold Amount</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  placeholder="Enter threshold amount"
                  value={field.value?.toString() || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value ? BigInt(value) : 0n);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Additional fields for AtBlock distribution */}
      {distributionType === "AtBlock" && (
        <FormField
          control={control}
          name="newDistributionControl.AtBlock"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Block Number</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  placeholder="Enter block number"
                  value={field.value?.toString() || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value ? parseInt(value) : 0);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Additional fields for Interval distribution */}
      {distributionType === "Interval" && (
        <FormField
          control={control}
          name="newDistributionControl.Interval"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Block Interval</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  placeholder="Enter block interval"
                  value={field.value?.toString() || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value ? parseInt(value) : 0);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
