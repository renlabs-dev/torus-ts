import React from "react";

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

import type { CreateEmissionPermissionForm } from "../create-emission-permission-form-schema";

interface DistributionFieldProps {
  form: CreateEmissionPermissionForm;
  isAccountConnected: boolean;
}

export function DistributionField({
  form,
  isAccountConnected,
}: DistributionFieldProps) {
  const distributionType = form.watch("distribution.type");

  return (
    <div className="grid gap-3 space-y-3">
      <FormField
        control={form.control}
        name="distribution.type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Distribution Type</FormLabel>
            <Select
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                switch (value) {
                  case "Manual":
                    form.setValue("distribution", { type: "Manual" });
                    break;
                  case "Automatic":
                    form.setValue("distribution", {
                      type: "Automatic",
                      threshold: "",
                    });
                    break;
                  case "AtBlock":
                    form.setValue("distribution", {
                      type: "AtBlock",
                      blockNumber: "",
                    });
                    break;
                  case "Interval":
                    form.setValue("distribution", {
                      type: "Interval",
                      blocks: "",
                    });
                    break;
                }
              }}
              disabled={!isAccountConnected}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
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

      {distributionType === "Automatic" && (
        <FormField
          control={form.control}
          name="distribution.threshold"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Threshold Amount</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g. 1000"
                  type="number"
                  step="0.01"
                  disabled={!isAccountConnected}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {distributionType === "AtBlock" && (
        <FormField
          control={form.control}
          name="distribution.blockNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Block Number</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g. 1000000"
                  type="number"
                  disabled={!isAccountConnected}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {distributionType === "Interval" && (
        <FormField
          control={form.control}
          name="distribution.blocks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Block Interval</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g. 100"
                  type="number"
                  disabled={!isAccountConnected}
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
