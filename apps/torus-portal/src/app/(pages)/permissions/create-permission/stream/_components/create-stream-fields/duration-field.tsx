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
import React from "react";
import type { CreateStreamPermissionForm } from "../create-stream-permission-form-schema";

interface DurationFieldProps {
  form: CreateStreamPermissionForm;
  isAccountConnected: boolean;
}

export function DurationField({
  form,
  isAccountConnected,
}: DurationFieldProps) {
  const durationType = form.watch("duration.type");

  return (
    <div className="grid gap-3">
      <FormField
        control={form.control}
        name="duration.type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Duration Type</FormLabel>
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
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Indefinite">Indefinite</SelectItem>
                <SelectItem value="UntilBlock">Until Block</SelectItem>
              </SelectContent>
            </Select>
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
              <FormLabel>End Block Number</FormLabel>
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
    </div>
  );
}
