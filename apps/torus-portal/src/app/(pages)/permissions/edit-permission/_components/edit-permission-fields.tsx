import { Plus, Trash2 } from "lucide-react";
import type { Control } from "react-hook-form";
import { useFieldArray, useWatch } from "react-hook-form";

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
  const distributionType = useWatch({
    control,
    name: "newDistributionControl.type",
  });
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
      {/* Distribution Control */}
      <div className="grid gap-4">
        <FormField
          control={control}
          name="newDistributionControl.type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Distribution Control</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
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
          )}
        />

        {/* Additional fields for AtBlock distribution */}
        {distributionType === "AtBlock" && (
          <FormField
            control={control}
            name="newDistributionControl.blockNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Block Number</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder="Enter block number"
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Additional fields for Interval distribution */}
        {distributionType === "Interval" && (
          <>
            <FormField
              control={control}
              name="newDistributionControl.blockNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Block Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="Enter start block number"
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="newDistributionControl.blockInterval"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Block Interval</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="Enter block interval"
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </div>

      {/* Targets Section */}
      <div className="grid gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Targets</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendTarget({ agent: "", weight: 1 })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Target
          </Button>
        </div>

        {targetFields.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <FormField
              control={control}
              name={`newTargets.${index}.agent`}
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
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
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

      {/* Streams Section */}
      <div className="grid gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Streams</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendStream({ agent: "", percentage: 0 })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Stream
          </Button>
        </div>

        {streamFields.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <FormField
              control={control}
              name={`newStreams.${index}.agent`}
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
              name={`newStreams.${index}.percentage`}
              render={({ field }) => (
                <FormItem className="w-32">
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="Percentage"
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
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
