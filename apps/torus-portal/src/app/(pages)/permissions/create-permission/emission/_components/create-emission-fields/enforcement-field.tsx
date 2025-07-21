import React from "react";

import { Plus, Trash2 } from "lucide-react";
import { useFieldArray } from "react-hook-form";

import type { SS58Address } from "@torus-network/sdk/types";

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

import type { CreateEmissionPermissionForm } from "../create-emission-permission-form-schema";

interface EnforcementFieldProps {
  form: CreateEmissionPermissionForm;
  isAccountConnected: boolean;
}

export function EnforcementField({
  form,
  isAccountConnected,
}: EnforcementFieldProps) {
  const enforcementType = form.watch("enforcement.type");

  const {
    fields: controllerFields,
    append: appendController,
    remove: removeController,
  } = useFieldArray({
    control: form.control,
    // @ts-expect-error - TypeScript has issues with conditional schema fields
    name: "enforcement.controllers" as const,
  });

  return (
    <div className="grid gap-3">
      <FormField
        control={form.control}
        name="enforcement.type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Enforcement Type</FormLabel>
            <Select
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                if (value === "ControlledBy") {
                  form.setValue("enforcement", {
                    type: "ControlledBy",
                    controllers: [
                      "5DoVVgN7R6vHw4mvPX8s4EkkR8fgN1UJ5TDfKzab8eW9z89b" as SS58Address,
                    ],
                    requiredVotes: "1",
                  });
                } else {
                  form.setValue("enforcement", { type: "None" });
                }
              }}
              disabled={!isAccountConnected}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="None">No Enforcement</SelectItem>
                <SelectItem value="ControlledBy">Controlled By</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {enforcementType === "ControlledBy" && (
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <FormLabel>Controllers</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
              onClick={() => (appendController as any)("")}
              disabled={!isAccountConnected}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Controller
            </Button>
          </div>
          {controllerFields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <FormField
                control={form.control}
                name={`enforcement.controllers.${index}`}
                render={({ field: controllerField }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        {...controllerField}
                        placeholder="5Dx...abc (SS58 address)"
                        disabled={!isAccountConnected}
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
                onClick={() => removeController(index)}
                disabled={!isAccountConnected || controllerFields.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <FormField
            control={form.control}
            name="enforcement.requiredVotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Required Votes</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. 2"
                    type="number"
                    min="1"
                    disabled={!isAccountConnected}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
}
