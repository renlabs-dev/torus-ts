"use client";

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
import type { useForm } from "react-hook-form";
import { useWatch } from "react-hook-form";
import type { FormSchema } from "./schemas";
import { NumExprField } from "./num-expr-field";

export function BaseConstraintField({
  control,
  path,
  onDelete,
  showDelete = false,
}: {
  control: ReturnType<typeof useForm<FormSchema>>["control"];
  path: string;
  onDelete?: () => void;
  showDelete?: boolean;
}) {
  // Watch the constraint type
  const constraintType = useWatch({
    control,
    name: `${path}.type` as any,
  });

  return (
    <div className="space-y-4 border p-4 rounded-md">
      <FormField
        control={control}
        name={`${path}.type` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Constraint Type</FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                field.onBlur();
              }}
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select constraint type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="MaxDelegationDepth">
                  Max Delegation Depth
                </SelectItem>
                <SelectItem value="PermissionExists">
                  Permission Exists
                </SelectItem>
                <SelectItem value="PermissionEnabled">
                  Permission Enabled
                </SelectItem>
                <SelectItem value="RateLimit">Rate Limit</SelectItem>
                <SelectItem value="InactiveUnlessRedelegated">
                  Inactive Unless Redelegated
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Render fields based on constraint type */}
      {constraintType === "MaxDelegationDepth" && (
        <div className="pl-4 border-l-2 border-gray-300">
          <FormLabel>Depth</FormLabel>
          <NumExprField control={control} path={`${path}.depth`} />
        </div>
      )}

      {(constraintType === "PermissionExists" ||
        constraintType === "PermissionEnabled") && (
        <FormField
          control={control}
          name={`${path}.pid` as any}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Permission ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter permission ID"
                  {...field}
                  onBlur={(e) => {
                    field.onBlur();
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {constraintType === "RateLimit" && (
        <>
          <div className="pl-4 border-l-2 border-gray-300">
            <FormLabel>Max Operations</FormLabel>
            <NumExprField control={control} path={`${path}.maxOperations`} />
          </div>
          <div className="pl-4 border-l-2 border-gray-300">
            <FormLabel>Period</FormLabel>
            <NumExprField control={control} path={`${path}.period`} />
          </div>
        </>
      )}

      {showDelete && (
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          type="button"
        >
          Remove Constraint
        </Button>
      )}
    </div>
  );
}
