"use client";

import {
  FormControl,
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
import { useWatch, Controller } from "react-hook-form";
import type { FormSchema } from "./permission-form-schemas";
import { makeDynamicFieldPath } from "./permission-form-utils";
import { PermissionFormFieldNumber } from "./permission-form-field-number";

type ConstraintType =
  | "MaxDelegationDepth"
  | "PermissionExists"
  | "PermissionEnabled"
  | "RateLimit"
  | "InactiveUnlessRedelegated";

export function PermissionFormFieldBase({
  control,
  path,
}: {
  control: ReturnType<typeof useForm<FormSchema>>["control"];
  path: string;
  onDelete?: () => void;
  showDelete?: boolean;
}) {
  const constraintType = useWatch({
    control,
    name: makeDynamicFieldPath<FormSchema>(`${path}.type`),
  }) as ConstraintType | undefined;

  return (
    <div className="space-y-4 border p-4 rounded-md">
      <Controller
        control={control}
        name={makeDynamicFieldPath<FormSchema>(`${path}.type`)}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Constraint Type</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={typeof field.value === "string" ? field.value : ""}
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
          <PermissionFormFieldNumber control={control} path={`${path}.depth`} />
        </div>
      )}

      {(constraintType === "PermissionExists" ||
        constraintType === "PermissionEnabled") && (
        <Controller
          control={control}
          name={makeDynamicFieldPath<FormSchema>(`${path}.pid`)}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Permission ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter permission ID"
                  value={typeof field.value === "string" ? field.value : ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
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
            <PermissionFormFieldNumber
              control={control}
              path={`${path}.maxOperations`}
            />
          </div>
          <div className="pl-4 border-l-2 border-gray-300">
            <FormLabel>Period</FormLabel>
            <PermissionFormFieldNumber
              control={control}
              path={`${path}.period`}
            />
          </div>
        </>
      )}
    </div>
  );
}
