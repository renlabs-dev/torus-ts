import React from "react";

import {
  FormControl,
  FormDescription,
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

import type {
  CreateCapabilityPermissionForm,
} from "../create-capability-permission-form-schema";

interface DurationFieldProps {
  form: CreateCapabilityPermissionForm;
  isAccountConnected: boolean;
}

export function DurationField({
  form,
  isAccountConnected,
}: DurationFieldProps) {
  const durationType = form.watch("duration.type");

  return (
    <div className="grid gap-4">
      <FormField
        control={form.control}
        name="duration.type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Duration</FormLabel>
            <FormControl>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  if (value === "Indefinite") {
                    form.setValue("duration", { type: "Indefinite" });
                  } else {
                    form.setValue("duration", {
                      type: "UntilBlock",
                      blockNumber: "",
                    });
                  }
                }}
                disabled={!isAccountConnected}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select duration..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Indefinite">Indefinite</SelectItem>
                  <SelectItem value="UntilBlock">Until Block</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {durationType === "UntilBlock" && (
        <FormField
          control={form.control}
          name="duration.blockNumber"
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
              <FormDescription>
                The block number when this permission expires.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
