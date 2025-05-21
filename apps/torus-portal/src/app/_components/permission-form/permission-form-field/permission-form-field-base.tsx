"use client";

import type { useForm } from "react-hook-form";
import { useWatch } from "react-hook-form";
import type { FormSchema } from "../permission-form-schemas";
import { makeDynamicFieldPath } from "../permission-form-utils";
import { PermissionFormFieldNumber } from "./permission-form-field-number";
import { SelectField } from "./permission-form-field-select";
import { InputField } from "./permission-form-field-input";
import { NestedField } from "./permission-form-field-nested";
import { FieldWrapper } from "./permission-form-field-wrapper";

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

  const constraintOptions = [
    { value: "MaxDelegationDepth", label: "Max Delegation Depth" },
    { value: "PermissionExists", label: "Permission Exists" },
    { value: "PermissionEnabled", label: "Permission Enabled" },
    { value: "RateLimit", label: "Rate Limit" },
    {
      value: "InactiveUnlessRedelegated",
      label: "Inactive Unless Redelegated",
    },
  ];

  return (
    <FieldWrapper>
      <SelectField
        control={control}
        path={`${path}.type`}
        label="Constraint Type"
        placeholder="Select constraint type"
        options={constraintOptions}
      />

      {/* Render fields based on constraint type */}
      {constraintType === "MaxDelegationDepth" && (
        <NestedField label="Depth">
          <PermissionFormFieldNumber control={control} path={`${path}.depth`} />
        </NestedField>
      )}

      {(constraintType === "PermissionExists" ||
        constraintType === "PermissionEnabled") && (
        <InputField
          control={control}
          path={`${path}.pid`}
          label="Permission ID"
          placeholder="Enter permission ID"
        />
      )}

      {constraintType === "RateLimit" && (
        <>
          <NestedField label="Max Operations">
            <PermissionFormFieldNumber
              control={control}
              path={`${path}.maxOperations`}
            />
          </NestedField>
          <NestedField label="Period">
            <PermissionFormFieldNumber
              control={control}
              path={`${path}.period`}
            />
          </NestedField>
        </>
      )}
    </FieldWrapper>
  );
}
