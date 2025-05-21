"use client";

import type { useForm } from "react-hook-form";
import { useWatch } from "react-hook-form";
import type { FormSchema } from "../permission-form-schemas";
import { makeDynamicFieldPath } from "../permission-form-utils";
import { InputField } from "./permission-form-field-input";
import { NestedField } from "./permission-form-field-nested";
import { SelectField } from "./permission-form-field-select";
import { FieldWrapper } from "./permission-form-field-wrapper";

type NumExprType =
  | "UIntLiteral"
  | "BlockNumber"
  | "StakeOf"
  | "Add"
  | "Sub"
  | "WeightSet"
  | "WeightPowerFrom";

export function PermissionFormFieldNumber({
  control,
  path,
}: {
  control: ReturnType<typeof useForm<FormSchema>>["control"];
  path: string;
}) {
  const exprType = useWatch({
    control,
    name: makeDynamicFieldPath<FormSchema>(`${path}.type`),
  }) as NumExprType | undefined;

  const expressionOptions = [
    { value: "UIntLiteral", label: "Literal Value" },
    { value: "BlockNumber", label: "Block Number" },
    { value: "StakeOf", label: "Stake Of Account" },
    { value: "Add", label: "Addition" },
    { value: "Sub", label: "Subtraction" },
    { value: "WeightSet", label: "Weight Set" },
    { value: "WeightPowerFrom", label: "Weight Power From" },
  ];

  return (
    <FieldWrapper>
      <SelectField
        control={control}
        path={`${path}.type`}
        label="Expression Type"
        placeholder="Select expression type"
        options={expressionOptions}
        showToast={true}
      />

      {/* Render fields based on expression type */}
      {exprType === "UIntLiteral" && (
        <InputField
          control={control}
          path={`${path}.value`}
          label="Value"
          placeholder="Enter a number value"
        />
      )}

      {exprType === "StakeOf" && (
        <InputField
          control={control}
          path={`${path}.account`}
          label="Account"
          placeholder="Enter account address"
        />
      )}

      {(exprType === "Add" || exprType === "Sub") && (
        <>
          <NestedField label="Left Expression">
            <PermissionFormFieldNumber
              control={control}
              path={`${path}.left`}
            />
          </NestedField>
          <NestedField label="Right Expression">
            <PermissionFormFieldNumber
              control={control}
              path={`${path}.right`}
            />
          </NestedField>
        </>
      )}

      {(exprType === "WeightSet" || exprType === "WeightPowerFrom") && (
        <>
          <InputField
            control={control}
            path={`${path}.from`}
            label="From Account"
            placeholder="Enter from account address"
          />
          <InputField
            control={control}
            path={`${path}.to`}
            label="To Account"
            placeholder="Enter to account address"
          />
        </>
      )}
    </FieldWrapper>
  );
}
