import { Plus, Trash2 } from "lucide-react";
import type { Control } from "react-hook-form";
import { useFieldArray, useWatch } from "react-hook-form";
import { match } from "rustie";

import { Button } from "@torus-ts/ui/components/button";
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

import type { EditPermissionFormData } from "./edit-permission-schema";

interface EditPermissionFieldsProps {
  control: Control<EditPermissionFormData>;
  selectedAccount: { address: string } | null;
}

export function EditPermissionFields({ control }: EditPermissionFieldsProps) {
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

  const {
    fields: targetFields,
    append: appendTarget,
    remove: removeTarget,
  } = useFieldArray({
    control,
    name: "newTargets",
  });

  const {
    fields: streamFields,
    append: appendStream,
    remove: removeStream,
  } = useFieldArray({
    control,
    name: "newStreams",
  });

  return (
    <>
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
            name="newDistributionControl.Automatic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Threshold Amount</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder="Enter threshold amount"
                    value={field.value.toString() || ""}
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
                    value={field.value.toString() || ""}
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
                    value={field.value.toString() || ""}
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

      <div className="grid gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Targets</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendTarget({ address: "", weight: 1 })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Target
          </Button>
        </div>

        {targetFields.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <FormField
              control={control}
              name={`newTargets.${index}.address`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input {...field} placeholder="Agent address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`newTargets.${index}.weight`}
              render={({ field }) => (
                <FormItem className="w-32">
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="Weight"
                      value={field.value || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        field.onChange(isNaN(value) ? 1 : value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => removeTarget(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="grid gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Streams</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendStream({ streamId: "", percentage: 0 })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Stream
          </Button>
        </div>

        {streamFields.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <FormField
              control={control}
              name={`newStreams.${index}.streamId`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input {...field} placeholder="Stream ID (H256)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`newStreams.${index}.percentage`}
              render={({ field }) => (
                <FormItem className="w-32">
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="%"
                      value={field.value || ""}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        field.onChange(isNaN(value) ? 0 : value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => removeStream(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}
